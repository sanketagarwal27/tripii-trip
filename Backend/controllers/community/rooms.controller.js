// controllers/community/room.controller.js
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import cloudinary from "../../utils/cloudinary.js";
import getDataUri from "../../utils/datauri.js";

import { User } from "../../models/user/user.model.js";
import { Community } from "../../models/community/community.model.js";
import { CommunityMembership } from "../../models/community/communityMembership.model.js";
import { Room, ROOM_TAGS } from "../../models/community/room.model.js";
import { MessageInRoom } from "../../models/community/messageInRoom.model.js";
import { Trip } from "../../models/trip/trip.model.js";
import { Activity } from "../../models/community/activity.model.js";

import { sendNotification } from "../user/notification.controller.js";
import {
  emitToUser,
  emitToCommunity,
  emitToRoom,
} from "../../socket/server.js";

/**
 * Small local helper to sort members for display.
 * Prioritizes: owner > moderator > member, then users you follow, then followers, then others.
 */
const sortMembers = (
  members = [],
  followingSet = new Set(),
  followersSet = new Set()
) => {
  return members.slice().sort((a, b) => {
    const roleOrder = (r) => (r === "owner" ? 0 : r === "moderator" ? 1 : 2);
    const ra = roleOrder(a.role || "member");
    const rb = roleOrder(b.role || "member");
    if (ra !== rb) return ra - rb;

    const aId = a.user?._id?.toString?.() || a.user?.toString?.();
    const bId = b.user?._id?.toString?.() || b.user?.toString?.();

    const aFollow = followingSet.has(aId) ? 0 : followersSet.has(aId) ? 1 : 2;
    const bFollow = followingSet.has(bId) ? 0 : followersSet.has(bId) ? 1 : 2;
    if (aFollow !== bFollow) return aFollow - bFollow;

    const aName = (a.user?.username || a.displayName || "").toLowerCase();
    const bName = (b.user?.username || b.displayName || "").toLowerCase();
    return aName.localeCompare(bName);
  });
};

/**
 * Upload media helper for room messages
 */
const uploadRoomMedia = async (file, roomId) => {
  const uri = getDataUri(file);
  const folder = `rooms/${roomId}/media`;

  const result = await cloudinary.uploader.upload(uri.content, {
    folder,
    resource_type: "auto",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    mimeType: file.mimetype,
    originalName: file.originalname,
  };
};

//  CREATE ROOM (with Trip option)

export const createRoom = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  let {
    name,
    description = "",
    startDate,
    endDate,
    roomtype,
    isEphemeral = false,
    roomTags = "[]",
    initialMembers = "[]",
    tripType,
    locationName,
  } = req.body;

  // Parse JSON
  try {
    roomTags = JSON.parse(roomTags);
    initialMembers = JSON.parse(initialMembers);
  } catch (err) {
    throw new ApiError(400, "Invalid JSON format");
  }

  // Validations
  if (!name?.trim()) throw new ApiError(400, "Room name is required");
  if (!startDate || !endDate)
    throw new ApiError(400, "Start and end date are required");
  if (new Date(startDate) >= new Date(endDate))
    throw new ApiError(400, "End date must be after start date");
  if (!["Normal", "Trip"].includes(roomtype))
    throw new ApiError(400, "roomtype must be Normal or Trip");

  // Validate roomTags
  if (!Array.isArray(roomTags)) roomTags = [];
  roomTags = roomTags.filter((tag) => ROOM_TAGS.includes(tag));

  // Community checks
  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, "Community not found");

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership)
    throw new ApiError(403, "Only community members can create rooms");

  if (!community.settings?.allowMemberRooms && membership.role !== "admin")
    throw new ApiError(403, "Only admins can create rooms");

  // Trip validation
  if (roomtype === "Trip") {
    if (!tripType || !["national", "international"].includes(tripType))
      throw new ApiError(400, "tripType (national/international) is required");
    if (!locationName)
      throw new ApiError(400, "locationname is required for trip");
  }

  // Upload background image
  const bgFile = req.files?.backgroundImage?.[0];
  if (!bgFile) throw new ApiError(400, "Room background image is required");

  const uri = getDataUri(bgFile);
  const uploadedBg = await cloudinary.uploader.upload(uri.content, {
    folder: `communities/${communityId}/rooms/backgrounds`,
    transformation: [
      { width: 1400, height: 800, crop: "fill", quality: "auto" },
    ],
  });

  const roombackgroundImage = {
    url: uploadedBg.secure_url,
    publicId: uploadedBg.public_id,
  };

  // Build members array
  const roomMembers = [{ user: userId, role: "owner", joinedAt: new Date() }];

  if (Array.isArray(initialMembers) && initialMembers.length > 0) {
    const validMemberships = await CommunityMembership.find({
      community: communityId,
      user: { $in: initialMembers },
    }).select("user");

    for (const mem of validMemberships) {
      if (mem.user.toString() !== userId.toString()) {
        roomMembers.push({
          user: mem.user,
          role: "member",
          joinedAt: new Date(),
        });
      }
    }
  }

  // Calculate initial status
  const now = new Date();
  const start = new Date(startDate);
  let status = now >= start ? "active" : "upcoming";

  // Create room
  const room = await Room.create({
    name: name.trim(),
    description: description.trim(),
    parentCommunity: communityId,
    createdBy: userId,
    roombackgroundImage,
    members: roomMembers,
    startDate,
    endDate,
    roomTags,
    isEphemeral,
    roomtype,
    status,
  });

  let trip = null;

  // Create trip if Trip room
  if (roomtype === "Trip") {
    trip = await Trip.create({
      title: name,
      description,
      startDate,
      endDate,
      coverPhoto: roombackgroundImage,
      createdBy: userId,
      participants: roomMembers.map((m) => m.user),
      type: tripType,
      location: {
        name: locationName, // ✅ FIXED
      },
      visibility: "private",
      visibleInCommunities: [communityId],
      roomsReleted: [room._id],
      status: "planning",
      createdByType: "user",
    });

    room.linkedTrip = trip._id;

    await room.save();
  }

  // Update community
  await Community.updateOne(
    { _id: communityId },
    {
      $addToSet: { rooms: room._id },
      $inc: { roomsLast7DaysCount: 1 },
    }
  );

  // Update users
  await User.updateMany(
    { _id: { $in: roomMembers.map((m) => m.user) } },
    { $addToSet: { rooms: room._id } }
  );

  // Create activity
  const activity = await Activity.create({
    community: communityId,
    actor: userId,
    type: roomtype === "Trip" ? "trip_created" : "room_created",
    payload: { roomId: room._id, tripId: trip?._id || null, name: room.name },
  });

  // Send notifications
  await Promise.allSettled(
    roomMembers
      .filter((m) => m.user.toString() !== userId.toString())
      .map(async (member) => {
        const memberId = member.user.toString();
        try {
          const notif = await sendNotification({
            recipient: memberId,
            sender: userId,
            type: "room_added",
            message:
              roomtype === "Trip"
                ? `${req.user.username} added you to a new trip room: ${room.name}`
                : `${req.user.username} added you to a new room: ${room.name}`,
            room: room._id,
            community: communityId,
            metadata: { roomId: room._id, communityId },
          });
          emitToUser(memberId, "notification:new", notif);
        } catch (err) {}

        if (roomtype === "Trip" && trip) {
          try {
            const tripNotif = await sendNotification({
              recipient: memberId,
              sender: userId,
              type: "trip_invite",
              message: `${req.user.username} created a trip: ${trip.title}`,
              trip: trip._id,
              community: communityId,
              metadata: { tripId: trip._id, roomId: room._id },
            });
            emitToUser(memberId, "notification:new", tripNotif);
          } catch (err) {}
        }
      })
  );

  // Socket broadcast
  try {
    const populatedRoom = await room.populate(
      "createdBy",
      "username profilePicture.url"
    );

    emitToCommunity(communityId.toString(), "room:created", {
      room: populatedRoom,
      trip,
      activity,
    });

    emitToRoom(room._id.toString(), "room:created", {
      room: populatedRoom,
      trip,
      activity,
    });
  } catch (err) {
    console.error("Emit error:", err);
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { room, trip },
        roomtype === "Trip"
          ? "Trip room created successfully"
          : "Room created successfully"
      )
    );
});

//GET COMMUNITY ROOMS

export const getCommunityRooms = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  const community = await Community.findById(communityId);

  if (!membership && community.type == "private_group")
    throw new ApiError(403, "Only members can view rooms of this community");

  const user = await User.findById(userId).select("following followers").lean();
  const followingSet = new Set(
    (user.following || []).map((id) => id.toString())
  );
  const followersSet = new Set(
    (user.followers || []).map((id) => id.toString())
  );

  const rooms = await Room.find({ parentCommunity: communityId })
    .populate("createdBy", "username profilePicture.url")
    .populate("linkedTrip", "title startDate endDate location")
    .populate({ path: "members.user", select: "username profilePicture.url" })
    .sort({ createdAt: -1 })
    .lean();

  const processedRooms = rooms.map((r) => ({
    ...r,
    members: sortMembers(r.members || [], followingSet, followersSet),
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { rooms: processedRooms },
        "Rooms in this community fetched"
      )
    );
});

/* ===========================
   GET MY ROOMS (COMMUNITY)
   =========================== */
export const getMyCommunityRooms = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });
  if (!membership)
    throw new ApiError(403, "Only members can view rooms of this community");

  const user = await User.findById(userId).select("following followers").lean();
  const followingSet = new Set(
    (user.following || []).map((id) => id.toString())
  );
  const followersSet = new Set(
    (user.followers || []).map((id) => id.toString())
  );

  const rooms = await Room.find({
    parentCommunity: communityId,
    "members.user": userId,
  })
    .populate("createdBy", "username profilePicture.url")
    .populate("linkedTrip", "title startDate endDate location")
    .populate({ path: "members.user", select: "username profilePicture.url" })
    .sort({ createdAt: -1 })
    .lean();

  const processedRooms = rooms.map((r) => ({
    ...r,
    members: sortMembers(r.members || [], followingSet, followersSet),
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { rooms: processedRooms },
        "User rooms in this community fetched"
      )
    );
});

/* ===========================
   GET MY ROOMS ACROSS COMMUNITIES
   =========================== */
export const getMyRoomsAcrossCommunities = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const memberships = await CommunityMembership.find({ user: userId })
    .select("community")
    .lean();
  const communityIds = memberships.map((m) => m.community);

  const rooms = await Room.find({
    parentCommunity: { $in: communityIds },
    "members.user": userId,
  })
    .select("name roombackgroundImage parentCommunity linkedTrip")
    .populate("parentCommunity", "name")
    .populate("linkedTrip", "title startDate endDate location")
    .lean();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { rooms },
        "All user rooms across communities fetched"
      )
    );
});

/* ===========================
   GET SUGGESTED ROOMS
   =========================== */
export const getSuggestedRooms = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const memberships = await CommunityMembership.find({ user: userId }).lean();
  const communityIds = memberships.map((m) => m.community);

  const rooms = await Room.aggregate([
    {
      $match: {
        parentCommunity: { $in: communityIds },
        "members.user": { $ne: userId },
      },
    },
    { $addFields: { memberCount: { $size: "$members" } } },
    { $sort: { memberCount: -1 } },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { rooms }, "Suggested rooms fetched"));
});

/* ===========================
   JOIN ROOM
   =========================== */
export const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await Room.findById(roomId).select("parentCommunity members");
  if (!room) throw new ApiError(404, "Room not found");

  const membership = await CommunityMembership.findOne({
    community: room.parentCommunity,
    user: userId,
  });
  if (!membership)
    throw new ApiError(403, "Only community members can join this room");

  const already = room.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (already) throw new ApiError(409, "Already a member of this room");

  room.members.push({ user: userId, role: "member", joinedAt: new Date() });
  await room.save();

  await User.findByIdAndUpdate(userId, { $addToSet: { rooms: roomId } });

  const userData = await User.findById(userId)
    .select("username profilePicture.url")
    .lean();

  // Emit to room
  emitToRoom(roomId.toString(), "room:userJoined", {
    roomId: room._id,
    user: {
      _id: userData._id,
      username: userData.username,
      profilePicture: userData.profilePicture.url,
    },
    role: "member",
    joinedAt: new Date(),
  });

  // Also notify room members about new join (optional)
  try {
    await sendNotification({
      recipient: room.members
        .map((m) => m.user)
        .filter((uid) => uid.toString() !== userId.toString()),
      sender: userId,
      type: "member_joined_room",
      message: `${userData.username} joined ${room.name}`,
      room: room._id,
      community: room.parentCommunity,
      metadata: { roomId: room._id },
    });
  } catch (e) {
    // bulk notification might not be desired; keep non-fatal
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user: userData }, "Joined room successfully"));
});

/* ===========================
   LEAVE ROOM
   =========================== */
export const leaveRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await Room.findById(roomId).select("members");
  if (!room) throw new ApiError(404, "Room not found");

  const memberIndex = room.members.findIndex(
    (m) => m.user.toString() === userId.toString()
  );
  if (memberIndex === -1) throw new ApiError(404, "You are not a member");

  if (room.members[memberIndex].role === "owner") {
    throw new ApiError(400, "Owner cannot leave.");
  }

  room.members.splice(memberIndex, 1);
  await room.save();

  await User.findByIdAndUpdate(userId, { $pull: { rooms: roomId } });

  emitToRoom(roomId.toString(), "room:memberLeft", { roomId, userId });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Left room successfully"));
});

/* ===========================
   SEND ROOM MESSAGE
   =========================== */
export const sendRoomMessage = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;
  const { content = "", gifUrl } = req.body;
  const file = req.files?.media?.[0];

  const room = await Room.findById(roomId).select(
    "members parentCommunity status"
  );
  if (!room) throw new ApiError(404, "Room not found");

  const isMember = room.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (!isMember) {
    throw new ApiError(403, "Only room members can send messages");
  }

  /* ---------------- STATUS GUARD ---------------- */
  if (["finished", "cancelled"].includes(room.status)) {
    throw new ApiError(403, `Messages are disabled for ${room.status} rooms`);
  }

  if (!content && !gifUrl && !file) {
    throw new ApiError(400, "Message must contain text, media, or GIF");
  }

  const messageData = {
    room: roomId,
    sender: userId,
    content: content?.trim() || "",
    type: "text",
  };

  if (file) {
    const uploaded = await uploadRoomMedia(file, roomId);
    messageData.type = uploaded.mimeType?.startsWith("image/")
      ? "image"
      : uploaded.mimeType?.startsWith("video/")
      ? "video"
      : "document";
    messageData.media = uploaded;
  } else if (gifUrl) {
    messageData.type = "gif";
    messageData.media = { url: gifUrl };
  }

  const message = await MessageInRoom.create(messageData);
  await message.populate("sender", "username profilePicture");

  emitToRoom(roomId.toString(), "room:message:new", message);

  return res.status(201).json(new ApiResponse(201, message, "Message sent"));
});

/* ===========================
   GET ROOM MESSAGES
   =========================== */
export const getRoomMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 50, before } = req.query;

  const room = await Room.findById(roomId).select("members");
  if (!room) throw new ApiError(404, "Room not found");

  const isMember = room.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (!isMember) throw new ApiError(403, "Only members can view messages");

  const query = { room: roomId };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await MessageInRoom.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate("sender", "username profilePicture")
    .lean();

  messages.reverse();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messages,
        hasMore: messages.length === parseInt(limit),
        nextCursor: messages.length ? messages[0].createdAt : null,
      },
      "Messages fetched"
    )
  );
});

/* ===========================
   REACT TO ROOM MESSAGE
   =========================== */
export const reactToRoomMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;
  if (!emoji?.trim()) throw new ApiError(400, "Emoji is required");

  const message = await MessageInRoom.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const room = await Room.findById(message.room).select("members");
  const isMember = room.members.some(
    (m) => m.user.toString() === userId.toString()
  );
  if (!isMember) throw new ApiError(403, "Only members can react");

  const existing = message.reactions.find(
    (r) => r.emoji === emoji && r.by.toString() === userId.toString()
  );
  let updated;
  if (existing) {
    updated = await MessageInRoom.findByIdAndUpdate(
      messageId,
      { $pull: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  } else {
    updated = await MessageInRoom.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  }

  emitToRoom(message.room.toString(), "room:reaction:updated", {
    messageId,
    reactions: updated.reactions,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updated.reactions,
        existing ? "Reaction removed" : "Reaction added"
      )
    );
});

/* ===========================
   DELETE ROOM MESSAGE
   =========================== */
export const deleteRoomMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await MessageInRoom.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const room = await Room.findById(message.room).select("members");
  if (!room) throw new ApiError(404, "Room not found");

  const member = room.members.find(
    (m) => m.user.toString() === userId.toString()
  );
  if (!member) throw new ApiError(403, "You are not a member");

  const isSender = message.sender.toString() === userId.toString();
  const isModerator = ["owner", "moderator"].includes(member.role);
  if (!isSender && !isModerator)
    throw new ApiError(403, "Only sender or moderator can delete messages");

  // delete cloudinary media if present
  if (message.media?.publicId) {
    try {
      await cloudinary.uploader.destroy(message.media.publicId);
    } catch (err) {
      console.error("Failed to delete media from cloud:", err);
    }
  }

  await MessageInRoom.findByIdAndDelete(messageId);

  emitToRoom(message.room.toString(), "room:message:deleted", {
    messageId,
    roomId: message.room.toString(),
  });

  return res.status(200).json(new ApiResponse(200, {}, "Message deleted"));
});

// ============================================
// SEARCH ROOMS CONTROLLER
// ============================================
export const searchRooms = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { q, tag, status, roomtype, page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;
  const lim = parseInt(limit);

  const query = { parentCommunity: communityId };

  // Filter by roomTag
  if (tag) {
    query.roomTags = tag;
  }

  // Filter by status
  if (
    status &&
    ["upcoming", "active", "finished", "cancelled"].includes(status)
  ) {
    query.status = status;
  }

  // Filter by roomtype
  if (roomtype && ["Normal", "Trip"].includes(roomtype)) {
    query.roomtype = roomtype;
  }

  // Text search
  if (q?.trim()) {
    query.$text = { $search: q.trim() };
  }

  const rooms = await Room.find(query)
    .populate("createdBy", "username profilePicture")
    .populate("linkedTrip", "title type location")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(lim)
    .lean();

  const total = await Room.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        rooms,
        pagination: {
          total,
          page,
          limit: lim,
          totalPages: Math.ceil(total / lim),
        },
      },
      "Rooms fetched successfully"
    )
  );
});

const canManageRoom = (member) =>
  member && ["owner", "moderator"].includes(member.role);

export const updateRoomSettings = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const {
    addMembers,
    removeMembers,
    changeRoles,
    addExternalLinks,
    removeExternalLinks,
  } = req.body;

  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, "Room not found");

  const myMembership = room.members.find(
    (m) => m.user.toString() === userId.toString()
  );

  const myRole = myMembership.role; // owner | moderator

  if (!canManageRoom(myMembership)) {
    throw new ApiError(403, "You are not allowed to manage this room");
  }

  /* ---------------- ADD MEMBERS ---------------- */
  if (Array.isArray(addMembers)) {
    const existing = new Set(room.members.map((m) => m.user.toString()));

    for (const uid of addMembers) {
      if (!mongoose.Types.ObjectId.isValid(uid)) continue;

      const user = await User.findById(uid).select("_id rooms");
      if (!user) continue;

      const exists = await User.exists({ _id: uid });
      if (!exists) continue; // 🚨 prevents corruption

      if (!existing.has(uid)) {
        room.members.push({
          user: uid,
          role: "member",
          joinedAt: new Date(),
        });

        if (!user.rooms.includes(room._id)) {
          user.rooms.push(room._id);
          await user.save({ validateBeforeSave: false });
        }
      }
    }
  }

  /* ---------------- REMOVE MEMBERS ---------------- */
  if (Array.isArray(removeMembers)) {
    const removedUserIds = [];

    room.members = room.members.filter((m) => {
      const targetUserId = m.user.toString();

      // Owner can never be removed
      if (m.role === "owner") return true;

      // Not selected for removal
      if (!removeMembers.includes(targetUserId)) return true;

      // ===============================
      // PERMISSION RULES
      // ===============================

      // 🔒 Moderator restrictions
      if (myMembership.role === "moderator") {
        // ❌ moderator cannot remove themselves
        if (targetUserId === userId.toString()) return true;

        // ❌ moderator cannot remove other moderators
        if (m.role === "moderator") return true;

        // ❌ moderator cannot remove owner (already covered, but explicit)
        if (m.role === "owner") return true;
      }

      // 🔒 Owner restriction
      if (myMembership.role === "owner") {
        // ❌ owner cannot remove themselves
        if (targetUserId === userId.toString()) return true;
      }

      // ===============================
      // ALLOWED → REMOVE
      // ===============================
      removedUserIds.push(targetUserId);
      return false;
    });

    // ✅ sync reverse relation
    if (removedUserIds.length) {
      await User.updateMany(
        { _id: { $in: removedUserIds } },
        { $pull: { rooms: room._id } }
      );
    }
  }

  /* ---------------- CHANGE ROLES ---------------- */
  if (Array.isArray(changeRoles)) {
    changeRoles.forEach(({ userId: targetUserId, role }) => {
      const member = room.members.find(
        (m) => m.user.toString() === targetUserId
      );

      if (!member) return;

      // Owner role is immutable
      if (member.role === "owner") return;

      // Moderator cannot change roles at all
      if (myRole === "moderator") return;

      // Owner can change member <-> moderator
      member.role = role;
    });
  }

  /* ---------------- ADD / UPDATE EXTERNAL LINKS ---------------- */
  if (Array.isArray(addExternalLinks)) {
    addExternalLinks.forEach(({ name, url }) => {
      const existing = room.externalLinks.find((l) => l.name === name);

      if (existing) {
        existing.url = url;
        existing.addedBy = userId;
        existing.addedAt = new Date();
      } else {
        room.externalLinks.push({
          name,
          url,
          addedBy: userId,
          addedAt: new Date(),
        });
      }
    });
  }

  /* ---------------- REMOVE EXTERNAL LINKS ---------------- */
  if (Array.isArray(removeExternalLinks)) {
    room.externalLinks = room.externalLinks.filter(
      (l) => !removeExternalLinks.includes(l.name)
    );
  }

  await room.save();
  // populate members & creator to match getRoomDetails
  const populatedRoom = await Room.findById(room._id)
    .populate("createdBy", "username profilePicture.url")
    .populate("members.user", "username profilePicture.url")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, populatedRoom, "Room updated successfully"));
});

// helper function for grtting room status
const computeRoomStatus = (room) => {
  if (!room.startDate || !room.endDate) return room.status;

  const now = new Date();
  const start = new Date(room.startDate);
  const end = new Date(room.endDate);

  if (room.status === "cancelled") return "cancelled";

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  if (now > end) return "finished";

  return room.status;
};

export const getRoomDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  let room = await Room.findById(roomId)
    .populate("createdBy", "username profilePicture.url")
    .populate("members.user", "username profilePicture.url");

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  // ensure user is a member
  const isMember = room.members.some(
    (m) => m.user?._id.toString() === userId.toString()
  );

  if (!isMember) {
    throw new ApiError(403, "You are not a member of this room");
  }

  /* ---------------- AUTO STATUS SYNC ---------------- */
  const expectedStatus = computeRoomStatus(room);

  if (expectedStatus !== room.status) {
    room.status = expectedStatus;
    await room.save();
  }

  // convert to plain object AFTER save
  room = room.toObject();

  return res
    .status(200)
    .json(new ApiResponse(200, room, "Room details fetched"));
});
