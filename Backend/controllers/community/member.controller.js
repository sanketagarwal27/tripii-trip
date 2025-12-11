// controllers/community/members.controller.js
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import { User } from "../../models/user/user.model.js";
import { Community } from "../../models/community/community.model.js";
import { CommunityMembership } from "../../models/community/communityMembership.model.js";
import { Activity } from "../../models/community/activity.model.js";

import { sendNotification } from "../user/notification.controller.js";
import { emitToUser, emitToCommunity } from "../../socket/server.js";

/**
 * JOIN PUBLIC COMMUNITY
 */
export const joinPublicCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;
  const { displayName } = req.body;

  if (!displayName?.trim()) throw new ApiError(400, "Display name is required");

  const community = await Community.findById(communityId).select("type name");
  if (!community) throw new ApiError(404, "Community not found");

  if (community.type !== "public_group") {
    throw new ApiError(403, "This is not a public community");
  }

  const existing = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });
  if (existing) throw new ApiError(409, "You are already a member");

  const membership = await CommunityMembership.create({
    community: communityId,
    user: userId,
    displayName: displayName.trim(),
    role: "member",
  });

  // Attach membership to community.members
  await Community.findByIdAndUpdate(communityId, {
    $push: { members: membership._id },
  });

  // Add community to user
  await User.findByIdAndUpdate(userId, {
    $addToSet: { communities: communityId },
  });

  // Activity
  await Activity.create({
    community: communityId,
    actor: userId,
    type: "member_added",
    payload: { userId, action: "joined" },
  });

  // Emit to community (members listening in)
  try {
    const populated = await membership.populate(
      "user",
      "username profilePicture"
    );
    emitToCommunity(communityId.toString(), "member:joined", {
      membership: populated,
    });
  } catch (e) {
    // non-fatal
  }

  return res
    .status(200)
    .json(new ApiResponse(200, membership, "Joined community successfully"));
});

/**
 * ADD MEMBERS (by existing members if allowed, or admin)
 */
export const addMembers = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  let { members = [] } = req.body;
  const adderId = req.user._id;

  if (!Array.isArray(members) || members.length === 0)
    throw new ApiError(400, "Members list is required");

  // Load community + settings
  const community = await Community.findById(communityId).select(
    "name settings memberCount"
  );
  if (!community) throw new ApiError(404, "Community not found");

  // Verify adder is a member
  const adderMembership = await CommunityMembership.findOne({
    community: communityId,
    user: adderId,
  });
  if (!adderMembership)
    throw new ApiError(403, "You must be a member to add others");

  // Permissions
  if (
    !community.settings?.allowMembersToAdd &&
    adderMembership.role !== "admin"
  ) {
    throw new ApiError(403, "Only admins can add members");
  }

  // Clean & limit input
  members = [...new Set(members.map(String))].slice(0, 200);

  // Remove: already members + the adder himself
  const existing = await CommunityMembership.find({
    community: communityId,
    user: { $in: members },
  }).select("user");

  const existingSet = new Set(existing.map((e) => e.user.toString()));
  const toAdd = members.filter(
    (id) => !existingSet.has(id) && id !== adderId.toString()
  );

  if (toAdd.length === 0) throw new ApiError(409, "No new users to add");

  // Validate user accounts
  const users = await User.find({ _id: { $in: toAdd } }).select(
    "username profilePicture"
  );
  if (!users.length) throw new ApiError(404, "No valid users found");

  // Build membership docs
  const docs = users.map((u) => ({
    community: communityId,
    user: u._id,
    displayName: u.username,
    role: "member",
  }));

  // Bulk insert
  const createdMemberships = await CommunityMembership.insertMany(docs);

  // Update community.members array
  await Community.updateOne(
    { _id: communityId },
    {
      $push: { members: { $each: createdMemberships.map((m) => m._id) } },
      $inc: { memberCount: createdMemberships.length }, // 🔥 ATOMIC counter update
    }
  );

  // Update user.communities
  const newUserIds = createdMemberships.map((m) => m.user);
  await User.updateMany(
    { _id: { $in: newUserIds } },
    { $addToSet: { communities: communityId } }
  );

  // Activity log
  await Activity.create({
    community: communityId,
    actor: adderId,
    type: "member_added",
    payload: { count: newUserIds.length },
  });

  // Notifications (parallel, non-blocking)
  await Promise.allSettled(
    createdMemberships.map(async (m) => {
      try {
        const notif = await sendNotification({
          recipient: m.user,
          sender: adderId,
          type: "community_invite",
          message: `${req.user.username} added you to "${community.name}"`,
          community: communityId,
          metadata: { communityId },
        });

        emitToUser(m.user.toString(), "notification:new", notif);
      } catch (err) {
        console.error("Notification failed:", m.user.toString(), err);
      }
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { added: createdMemberships.length },
        "Members added successfully"
      )
    );
});

/**
 * REMOVE MEMBER (admin only)
 */
export const removeMember = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { targetUserId } = req.body;
  const adminId = req.user._id;

  if (!targetUserId) throw new ApiError(400, "targetUserId required");

  const adminMembership = await CommunityMembership.findOne({
    community: communityId,
    user: adminId,
    role: "admin",
  });

  if (!adminMembership)
    throw new ApiError(403, "Only admins can remove members");

  if (adminId.toString() === targetUserId.toString())
    throw new ApiError(400, "You cannot remove yourself");

  // Delete membership
  const deleted = await CommunityMembership.findOneAndDelete({
    community: communityId,
    user: targetUserId,
  });

  if (!deleted) throw new ApiError(404, "Member not found");

  // Update community + user
  await Community.updateOne(
    { _id: communityId },
    {
      $pull: { members: deleted._id },
      $inc: { memberCount: -1 }, // 🔥 ATOMIC decrement
    }
  );

  await User.updateOne(
    { _id: targetUserId },
    { $pull: { communities: communityId } }
  );

  // Activity log
  await Activity.create({
    community: communityId,
    actor: adminId,
    type: "member_removed",
    payload: { removedUser: targetUserId },
  });

  // Notify
  try {
    const comm = await Community.findById(communityId).select("name");

    const notif = await sendNotification({
      recipient: targetUserId,
      sender: adminId,
      type: "community_removed",
      message: `You were removed from "${comm.name}"`,
      community: communityId,
    });

    emitToUser(targetUserId.toString(), "notification:new", notif);
    emitToUser(targetUserId.toString(), "community:removed", { communityId });
  } catch (err) {
    console.error("Notification error:", err);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Member removed successfully"));
});

/**
 * LEAVE COMMUNITY
 */
export const leaveCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });
  if (!membership)
    throw new ApiError(404, "You are not a member of this community");

  // If only admin, block leave
  if (membership.role === "admin") {
    const adminCount = await CommunityMembership.countDocuments({
      community: communityId,
      role: "admin",
    });
    if (adminCount === 1) {
      throw new ApiError(
        400,
        "You are the only admin. Transfer admin role first or delete the community"
      );
    }
  }

  await CommunityMembership.findByIdAndDelete(membership._id);
  await Community.findByIdAndUpdate(communityId, {
    $pull: { members: membership._id },
  });
  await User.findByIdAndUpdate(userId, { $pull: { communities: communityId } });

  await Activity.create({
    community: communityId,
    actor: userId,
    type: "community_left",
    payload: { action: "left" },
  });

  // emit to community that a member left
  try {
    emitToCommunity(communityId.toString(), "member:left", {
      userId,
      communityId,
    });
  } catch (err) {
    // ignore
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Left community successfully"));
});

/**
 * CHANGE MEMBER ROLE (admin only)
 */
export const changeMemberRole = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { role, targetUserId } = req.body; // "admin" | "member"
  const adminId = req.user._id;

  if (!["admin", "member"].includes(role))
    throw new ApiError(400, "Invalid role. Must be 'admin' or 'member'");

  const adminMembership = await CommunityMembership.findOne({
    community: communityId,
    user: adminId,
    role: "admin",
  });
  if (!adminMembership) throw new ApiError(403, "Only admins can change roles");

  if (adminId.toString() === targetUserId)
    throw new ApiError(400, "You cannot change your own role");

  const membership = await CommunityMembership.findOneAndUpdate(
    { community: communityId, user: targetUserId },
    { role },
    { new: true }
  ).populate("user", "username profilePicture");

  if (!membership) throw new ApiError(404, "Member not found");

  await Activity.create({
    community: communityId,
    actor: adminId,
    type: "role_changed",
    payload: {
      targetUser: targetUserId,
      newRole: role,
      action: "role_changed",
    },
  });

  // notify the user about role change
  try {
    const community = await Community.findById(communityId).select("name");
    const notification = await sendNotification({
      recipient: targetUserId,
      sender: adminId,
      type: "role_changed",
      message: `Your role in "${community.name}" was changed to ${role}`,
      community: communityId,
      metadata: { communityId, newRole: role },
    });

    emitToUser(targetUserId.toString(), "notification:new", notification);
    emitToUser(targetUserId.toString(), "role:updated", { communityId, role });
  } catch (err) {
    console.error("Failed to notify role change:", err);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, membership, "Role updated successfully"));
});

/**
 * GET COMMUNITY MEMBERS
 */
export const getCommunityMembers = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { page = 1, limit = 50, role, search } = req.query;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });
  if (!membership) throw new ApiError(403, "Only members can view member list");

  const query = { community: communityId };
  if (role && ["admin", "member"].includes(role)) query.role = role;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let membersQuery = CommunityMembership.find(query)
    .populate("user", "username profilePicture bio")
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const members = await membersQuery;

  // in-memory search filter on populated fields
  let filtered = members;
  if (search?.trim()) {
    const s = search.trim().toLowerCase();
    filtered = members.filter(
      (m) =>
        m.user?.username?.toLowerCase().includes(s) ||
        (m.displayName && m.displayName.toLowerCase().includes(s))
    );
  }

  const total = await CommunityMembership.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        members: filtered,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Members fetched successfully"
    )
  );
});

/**
 * UPDATE DISPLAY NAME
 */
export const updateDisplayName = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { displayName } = req.body;
  const userId = req.user._id;

  if (!displayName?.trim()) throw new ApiError(400, "Display name is required");

  const membership = await CommunityMembership.findOneAndUpdate(
    { community: communityId, user: userId },
    { displayName: displayName.trim() },
    { new: true }
  ).populate("user", "username profilePicture");

  if (!membership)
    throw new ApiError(404, "You are not a member of this community");

  return res
    .status(200)
    .json(
      new ApiResponse(200, membership, "Display name updated successfully")
    );
});
