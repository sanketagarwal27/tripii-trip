import cloudinary from "cloudinary";
import { optimizeImageBuffer } from "../../utils/sharpImage.js";
import getDataUri from "../../utils/datauri.js";
import { TripRole } from "../../models/trip/tripRole.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Trip } from "../../models/trip/trip.model.js";

import { Community } from "../../models/community/community.model.js";
import { CommunityMembership } from "../../models/community/communityMembership.model.js";
import { Room } from "../../models/community/room.model.js";
import { TripActivity } from "../../models/trip/tripActivity.model.js";
import { Activity } from "../../models/community/activity.model.js";
import {
  emitToCommunity,
  emitToTrip,
  emitToUser,
} from "../../socket/server.js";
import { Notification } from "../../models/user/notification.model.js";
import { User } from "../../models/user/user.model.js";

const isTripAdmin = (trip, userId) =>
  trip.createdBy.toString() === userId.toString();

const isTripManager = async (tripId, userId) =>
  TripRole.exists({
    trip: tripId,
    assignedTo: userId,
    roleName: "Manager",
    status: "active",
  });

const getParticipant = (trip, userId) =>
  trip.participants.find((p) => p.user.toString() === userId.toString());

export const toggleTripVisibility = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { visibility } = req.body;
  const userId = req.user._id;

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (!isTripAdmin(trip, userId))
    throw new ApiError(403, "Only admin can change visibility");

  if (trip.status === "completed") throw new ApiError(403, "Trip is read-only");

  trip.visibility = visibility;
  await trip.save();

  res.json(new ApiResponse(200, trip, "Visibility updated"));
});

export const addTripMember = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { userId: newUserId } = req.body;
  const actorId = req.user._id;

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (trip.status !== "planning")
    throw new ApiError(403, "Cannot add members after trip start");

  if (["completed", "cancelled"].includes(trip.status))
    throw new ApiError(403, "Trip is read-only");

  const isManager = await isTripManager(tripId, actorId);
  if (!isTripAdmin(trip, actorId) && !isManager)
    throw new ApiError(403, "Not authorized");

  const existing = getParticipant(trip, newUserId);
  if (existing) {
    if (existing.status === "active")
      throw new ApiError(400, "User already in trip");
    if (existing.canRejoin === false)
      throw new ApiError(403, "User cannot rejoin this trip");
  }

  trip.participants.push({
    user: newUserId,
    joinedVia: "invite",
    status: "active",
  });

  await trip.save();

  await Notification.create({
    recipient: newUserId,
    sender: actorId,
    type: "trip_member_added",
    message: `${req.user.username} added you to a trip`,
    trip: trip._id,
  });

  res.json(new ApiResponse(200, trip, "Member added"));
});

export const leaveTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (trip.status !== "planning")
    throw new ApiError(403, "Cannot leave after trip starts");

  if (["completed", "cancelled"].includes(trip.status))
    throw new ApiError(403, "Trip is read-only");

  if (trip.createdBy.toString() === userId.toString())
    throw new ApiError(400, "Owner cannot leave the trip");

  const participant = getParticipant(trip, userId);
  if (!participant || participant.status !== "active")
    throw new ApiError(400, "Not an active participant");

  participant.status = "left";
  participant.leftAt = new Date();

  await trip.save();

  res.json(new ApiResponse(200, null, "Left trip"));
});

export const assignTripRole = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const { roleName, assignedTo } = req.body;
  const userId = req.user._id;

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (trip.status !== "planning")
    throw new ApiError(403, "Roles cannot be changed after trip starts");

  if (["completed", "cancelled"].includes(trip.status))
    throw new ApiError(403, "Trip is read-only");

  const participant = getParticipant(trip, assignedTo);
  if (!participant || participant.status !== "active")
    throw new ApiError(400, "User not active in trip");

  const isManager = await isTripManager(tripId, userId);
  if (!isTripAdmin(trip, userId) && !isManager)
    throw new ApiError(403, "Not authorized");

  const role = await TripRole.create({
    trip: tripId,
    roleName,
    assignedTo,
  });

  res.json(new ApiResponse(201, role, "Role assigned"));
});

export const updateTripCover = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;
  const file = req.file;

  if (!file) throw new ApiError(400, "Image required");

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (!isTripAdmin(trip, userId))
    throw new ApiError(403, "Only admin can change cover");

  const optimized = await optimizeImageBuffer(file.buffer, {
    maxWidth: 1600,
    maxHeight: 900,
    quality: 80,
  });

  const uri = getDataUri({
    buffer: optimized,
    mimetype: "image/jpeg",
  });

  const uploaded = await cloudinary.uploader.upload(uri.content, {
    folder: `trips/${tripId}/cover`,
    transformation: { quality: "auto", fetch_format: "auto" },
  });

  trip.coverPhoto = {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };

  await trip.save();

  return res.json(new ApiResponse(200, trip.coverPhoto, "Cover updated"));
});

export const publishTripToCommunity = asyncHandler(async (req, res) => {
  const { tripId, communityId } = req.params;
  const userId = req.user._id;
  const { roomTags = "[]", isEphemeral = false } = req.body;

  /* ----------------------------------------------------
     1. LOAD + HARD VALIDATIONS
  ---------------------------------------------------- */
  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (["completed", "cancelled"].includes(trip.status))
    throw new ApiError(403, "Trip is read-only");

  if (!isTripAdmin(trip, userId))
    throw new ApiError(403, "Only trip admin can publish");

  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, "Community not found");

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership)
    throw new ApiError(403, "You are not a member of this community");

  if (
    membership.role === "member" &&
    community.settings?.allowMemberRooms === false
  ) {
    throw new ApiError(
      403,
      "Members are not allowed to create rooms in this community"
    );
  }

  if (trip.visibleInCommunities.some((id) => id.toString() === communityId)) {
    throw new ApiError(400, "Trip already published in this community");
  }

  if (!trip.coverPhoto?.url)
    throw new ApiError(400, "Trip must have a cover photo");

  /* ----------------------------------------------------
     2. PARSE ROOM TAGS SAFELY
  ---------------------------------------------------- */
  let parsedRoomTags = [];
  try {
    parsedRoomTags = Array.isArray(roomTags) ? roomTags : JSON.parse(roomTags);
  } catch {
    throw new ApiError(400, "Invalid roomTags format");
  }

  /* ----------------------------------------------------
     3. BUILD ROOM MEMBERS FROM TRIP PARTICIPANTS
  ---------------------------------------------------- */
  const activeParticipants = trip.participants.filter(
    (p) => p.status === "active"
  );

  const roomMembers = activeParticipants.map((p) => ({
    user: p.user,
    role: p.user.toString() === trip.createdBy.toString() ? "owner" : "member",
    joinedAt: new Date(),
  }));

  /* ----------------------------------------------------
     4. CREATE ROOM
  ---------------------------------------------------- */
  const room = await Room.create({
    name: trip.title,
    description: trip.description || "",
    parentCommunity: communityId,
    createdBy: userId,
    roombackgroundImage: trip.coverPhoto,
    members: roomMembers,
    startDate: trip.startDate,
    endDate: trip.endDate,
    roomTags: parsedRoomTags,
    isEphemeral,
    roomtype: "Trip",
    status: "upcoming",
    linkedTrip: trip._id,
  });

  /* ----------------------------------------------------
     5. SYNC TRIP ↔ COMMUNITY ↔ USERS
  ---------------------------------------------------- */
  trip.visibleInCommunities.push(communityId);
  trip.roomsReleted.push(room._id);
  await trip.save();

  await Community.updateOne(
    { _id: communityId },
    {
      $addToSet: { rooms: room._id },
      $inc: { roomsLast7DaysCount: 1 },
    }
  );

  await User.updateMany(
    { _id: { $in: roomMembers.map((m) => m.user) } },
    { $addToSet: { rooms: room._id } }
  );

  /* ----------------------------------------------------
     6. CREATE ACTIVITIES (TRIP + COMMUNITY)
  ---------------------------------------------------- */
  const tripActivity = await TripActivity.create({
    trip: trip._id,
    actor: userId,
    type: "trip_published_in_community",
    targetId: communityId,
    targetModel: "Community",
    description: `Trip published in ${community.name}`,
  });

  const communityActivity = await Activity.create({
    community: communityId,
    actor: userId,
    type: "trip_created",
    payload: {
      roomId: room._id,
      tripId: trip._id,
      name: trip.title,
    },
  });

  /* ----------------------------------------------------
     7. NOTIFICATIONS (TO TRIP MEMBERS)
  ---------------------------------------------------- */
  await Promise.allSettled(
    roomMembers
      .filter((m) => m.user.toString() !== userId.toString())
      .map(async (member) => {
        try {
          const notif = await Notification.create({
            recipient: member.user,
            sender: userId,
            type: "room_added",
            message: `${req.user.username} published the trip "${trip.title}" in ${community.name}`,
            room: room._id,
            community: communityId,
            trip: trip._id,
            metadata: { roomId: room._id, communityId },
          });

          emitToUser(member.user.toString(), "notification:new", notif);
        } catch (_) {}
      })
  );

  /* ----------------------------------------------------
     8. SOCKET EMITS
  ---------------------------------------------------- */
  try {
    const populatedRoom = await room.populate(
      "createdBy",
      "username profilePicture.url"
    );

    emitToCommunity(communityId.toString(), "room:created", {
      room: populatedRoom,
      trip,
      activity: communityActivity,
    });

    emitToTrip(tripId.toString(), "trip:published", {
      room: populatedRoom,
      activity: tripActivity,
    });
  } catch (err) {
    console.error("Socket emit failed:", err);
  }

  /* ----------------------------------------------------
     9. RESPONSE
  ---------------------------------------------------- */
  return res
    .status(201)
    .json(
      new ApiResponse(201, { room }, "Trip published to community successfully")
    );
});

export const removeTripMember = asyncHandler(async (req, res) => {
  const { tripId, memberId } = req.params;
  const actorId = req.user._id;

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  if (trip.status !== "planning")
    throw new ApiError(403, "Cannot modify members after trip start");

  if (["completed", "cancelled"].includes(trip.status))
    throw new ApiError(403, "Trip is read-only");

  const isManager = await isTripManager(tripId, actorId);
  if (!isTripAdmin(trip, actorId) && !isManager)
    throw new ApiError(403, "Not authorized");

  if (trip.createdBy.toString() === memberId)
    throw new ApiError(400, "Cannot remove trip owner");

  const participant = getParticipant(trip, memberId);
  if (!participant || participant.status !== "active")
    throw new ApiError(404, "Participant not active");

  participant.status = "removed";
  participant.removedAt = new Date();
  participant.removedBy = actorId;
  participant.canRejoin = false;

  // 🔥 IMPORTANT: remove all functional roles
  await TripRole.deleteMany({
    trip: tripId,
    assignedTo: memberId,
  });

  await trip.save();

  res.json(new ApiResponse(200, null, "Member removed"));
});
