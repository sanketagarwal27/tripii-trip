// controllers/community/community.controller.js
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import cloudinary from "../../utils/cloudinary.js";
import getDataUri from "../../utils/datauri.js";

import { User } from "../../models/user/user.model.js";
import { Community } from "../../models/community/community.model.js";
import { CommunityMembership } from "../../models/community/communityMembership.model.js";
import { Activity } from "../../models/community/activity.model.js";

import { sendNotification } from "../user/notification.controller.js";
import { emitToUser, emitToCommunity } from "../../socket/server.js";
import { Room } from "../../models/community/room.model.js";

/**
 * Upload cover image to the proper community folder.
 * Returns { url, publicId }.
 */
const uploadCoverImageForCommunity = async (file, communityId) => {
  const uri = getDataUri(file);
  const uploaded = await cloudinary.uploader.upload(uri.content, {
    folder: `communities/${communityId}/cover`,
    transformation: [
      { width: 1200, height: 400, crop: "fill", quality: "auto" },
      { fetch_format: "auto" },
    ],
  });
  return { url: uploaded.secure_url, publicId: uploaded.public_id };
};

/**
 * CREATE COMMUNITY
 */
export const createCommunity = asyncHandler(async (req, res) => {
  let {
    name,
    description = "",
    rules = [],
    type = "private_group",
    initialMembers = [],
    settings = {},
    tags = "[]",
  } = req.body;

  const createdBy = req.user._id;

  tags = JSON.parse(tags);

  const ALLOWED_TAGS = [
    "Hiking",
    "Food",
    "Adventure",
    "Photography",
    "Tech",
    "Backpacking",
    "Nightlife",
    "Culture",
  ];

  if (!Array.isArray(tags)) tags = [];

  // Validate tags
  tags = tags.filter((t) => ALLOWED_TAGS.includes(t));

  if (!name?.trim()) throw new ApiError(400, "Community name is required");

  const validTypes = [
    "private_group",
    "public_group",
    "regional_hub",
    "global_hub",
  ];

  if (!validTypes.includes(type))
    throw new ApiError(400, "Invalid community type");

  let parsedRules = [];

  try {
    const rawRules = typeof rules === "string" ? JSON.parse(rules) : rules;

    if (Array.isArray(rawRules)) {
      parsedRules = rawRules
        .filter((r) => r?.title?.trim())
        .slice(0, 20) // hard limit
        .map((r, i) => ({
          title: r.title.trim(),
          description: r.description?.trim() || "",
          order: i,
        }));
    }
  } catch (err) {
    parsedRules = [];
  }

  const community = await Community.create({
    name: name.trim(),
    description: description.trim(),
    rules: parsedRules,
    type,
    createdBy,
    backgroundImage: null,
    tags,
    settings: {
      allowMembersToAdd: settings.allowMembersToAdd !== false,
      allowMemberRooms: settings.allowMemberRooms !== false,
    },
  });

  // ADMIN membership
  const adminMembership = await CommunityMembership.create({
    community: community._id,
    user: createdBy,
    displayName: req.user.username,
    role: "admin",
  });

  const memberDocs = [adminMembership];

  // Add initial members (safe limit)
  if (Array.isArray(initialMembers) && initialMembers.length > 0) {
    // limit to avoid DoS / huge inserts
    const ids = Array.from(new Set(initialMembers)).slice(0, 200);
    // remove creator id if present
    const filtered = ids.filter((id) => id !== createdBy.toString());

    if (filtered.length > 0) {
      const validUsers = await User.find({
        _id: { $in: filtered },
      }).select("_id username");

      if (validUsers.length > 0) {
        const newMemberDocs = validUsers.map((user) => ({
          community: community._id,
          user: user._id,
          displayName: user.username,
          role: "member",
        }));

        const createdMemberships = await CommunityMembership.insertMany(
          newMemberDocs
        );
        memberDocs.push(...createdMemberships);
      }
    }
  }

  // attach membership ids to community and save
  community.members = memberDocs.map((m) => m._id);
  await community.save();

  // Update user.communities for all members
  const userIds = memberDocs.map((m) => m.user);
  if (userIds.length > 0) {
    await User.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { communities: community._id } }
    );
  }

  // If cover file was provided, upload it now into the correct folder and update community
  const coverFile = req.files?.coverImage?.[0];
  if (coverFile) {
    try {
      const coverImage = await uploadCoverImageForCommunity(
        coverFile,
        community._id
      );
      community.backgroundImage = coverImage;
      await community.save();
    } catch (err) {
      // Upload failure shouldn't block community creation — log and continue
      console.error("Cover upload failed:", err);
    }
  }

  // Create activity
  const activity = await Activity.create({
    community: community._id,
    actor: createdBy,
    type: "community_created",
    payload: {
      action: "community_created",
      communityName: community.name,
    },
  });

  // Prepare notify list (skip creator)
  const notifyList = memberDocs.filter(
    (m) => m.user.toString() !== createdBy.toString()
  );

  // Send notifications in parallel but don't fail request on single notification error.
  await Promise.allSettled(
    notifyList.map(async (m) => {
      try {
        const notification = await sendNotification({
          recipient: m.user,
          sender: createdBy,
          type: "community_invite",
          message: `${req.user.username} added you to "${community.name}"`,
          community: community._id,
          metadata: {
            communityId: community._id,
            communityName: community.name,
          },
        });

        // If user is online, emit a lightweight real-time event to them (sendNotification also tries to emit)
        try {
          emitToUser(m.user.toString(), "notification:new", notification);
        } catch (emitErr) {
          // non-fatal
        }
      } catch (err) {
        console.error("Notification error for user", m.user.toString(), err);
      }
    })
  );

  // Final populate for response
  const populatedCommunity = await Community.findById(community._id)
    .populate("createdBy", "username profilePicture")
    .populate({
      path: "members",
      populate: { path: "user", select: "username profilePicture" },
    });

  // Broadcast community created event to the community room (members who join that room)
  try {
    emitToCommunity(community._id.toString(), "community:created", {
      community: populatedCommunity,
      activity,
    });
  } catch (err) {
    // non-fatal
    console.error("emitToCommunity failed:", err);
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, populatedCommunity, "Community created successfully")
    );
});

/**
 * UPDATE COMMUNITY SETTINGS
 */
export const updateCommunitySettings = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
    role: "admin",
  });

  if (!membership)
    throw new ApiError(403, "Only admins can update community settings");

  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, "Community not found");

  const { name, description, type, settings } = req.body;

  if (name) community.name = name.trim();
  if (description !== undefined) community.description = description.trim();
  if (
    type &&
    ["private_group", "public_group", "regional_hub", "global_hub"].includes(
      type
    )
  ) {
    community.type = type;
  }

  if (settings && typeof settings === "object") {
    community.settings = { ...community.settings, ...settings };
  }

  // Handle cover image update
  const coverFile = req.files?.coverImage?.[0];
  if (coverFile) {
    if (!coverFile.mimetype.startsWith("image/")) {
      throw new ApiError(400, "Cover must be an image");
    }

    // Delete old cover if exists
    if (community.backgroundImage?.publicId) {
      try {
        await cloudinary.uploader.destroy(community.backgroundImage.publicId);
      } catch (err) {
        console.error("Failed to delete old cover:", err);
      }
    }

    try {
      const newCover = await uploadCoverImageForCommunity(
        coverFile,
        communityId
      );
      community.backgroundImage = newCover;
    } catch (err) {
      console.error("New cover upload failed:", err);
    }
  }

  await community.save();

  // Activity log
  await Activity.create({
    community: communityId,
    actor: userId,
    type: "settings_updated",
    payload: {
      action: "settings_updated",
      changes: { name, description, type, settings },
    },
  });

  // Emit update to community members (real-time)
  try {
    emitToCommunity(communityId.toString(), "community:updated", {
      communityId,
      name: community.name,
      description: community.description,
      backgroundImage: community.backgroundImage,
      settings: community.settings,
    });
  } catch (err) {
    console.error("emitToCommunity error:", err);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, community, "Community updated successfully"));
});

/**
 * GET COMMUNITY PROFILE
 */
export const getCommunityProfile = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const community = await Community.findById(communityId)
    .select(
      `
        name
        description
        backgroundImage.url
        rules
        type
        visibility
        createdBy
        updatedAt
        memberCount
        roomsLast7DaysCount
        rooms
        featuredTrips
        tags
        pinnedMessages
      `
    )
    .populate("createdBy", "username profilePicture bio")
    .populate({
      path: "members",
      populate: { path: "user", select: "username profilePicture bio" },
      options: { limit: 50 },
    })
    .populate(
      "featuredTrips",
      "title startDate endDate createdBy type coverPhoto.url"
    )
    .populate({
      path: "pinnedMessages.message",
      select: `
        type
        content
        media.url
        media.publicId
        media.mimeType
        poll.question
        poll.options
        poll.totalVotes
        poll.allowMultipleVotes
        poll.expiresAt
        reactions
        commentCount
        helpfulCount
        sender
        senderDisplayName
        senderDisplayProfile
        createdAt
        updatedAt
      `,
      populate: {
        path: "sender",
        select: "username profilePicture",
      },
    })
    .populate({
      path: "pinnedMessages.pinnedBy",
      select: "username profilePicture",
    })
    .lean();

  if (!community) throw new ApiError(404, "Community not found");

  const isPublic = ["public_group", "regional_hub", "global_hub"].includes(
    community.type
  );

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  }).lean();

  if (!isPublic && !membership) {
    throw new ApiError(
      403,
      "You must join this private community to view content"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...community,
        rules: community.rules || [],
        pinnedMessages: community.pinnedMessages || [],
        isPublic,
        isMember: !!membership,
        currentUserRole: membership?.role || null,

        // permissions
        canPost: !!membership,
        canCreateRoom: !!membership,
        canReact: !!membership,
        canVote: !!membership,

        totalMembers: community.memberCount,
        roomsLast7Days: community.roomsLast7DaysCount,
      },
      "Community profile fetched"
    )
  );
});

/**
 * GET USER'S COMMUNITIES
 */

export const getUserCommunities = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1) Fetch memberships
  const memberships = await CommunityMembership.find({ user: userId })
    .select("community role createdAt")
    .lean();

  if (!memberships.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "User communities fetched"));
  }

  const communityIds = memberships.map((m) => m.community);

  // 2) Fetch communities with lastActivityAt
  const communities = await Community.find({ _id: { $in: communityIds } })
    .select(
      `
      name
      description
      backgroundImage.url
      type
      createdBy
      memberCount
      roomsLast7DaysCount
      tags
      members
      lastActivityAt
      createdAt
      `
    )
    .populate("createdBy", "username profilePicture.url")
    .lean();

  const memMap = new Map(memberships.map((m) => [String(m.community), m]));

  // 3) Merge membership data
  const final = communities.map((c) => {
    const m = memMap.get(String(c._id));
    return {
      ...c,
      userRole: m.role,
      joinedAt: m.createdAt,
    };
  });

  // 🔥 SORT BY LAST ACTIVITY (NOT updatedAt)
  final.sort((a, b) => {
    const aTime = new Date(a.lastActivityAt || a.createdAt);
    const bTime = new Date(b.lastActivityAt || b.createdAt);
    return bTime - aTime; // Descending order (most recent first)
  });

  return res
    .status(200)
    .json(new ApiResponse(200, final, "User communities fetched"));
});

/**
 * SEARCH COMMUNITIES
 */
export const searchCommunities = asyncHandler(async (req, res) => {
  const { q, type, tag, page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const skip = (page - 1) * limit;
  const lim = parseInt(limit);

  const query = {};

  // TYPE FILTER (default: only public-visible communities)
  query.type = type
    ? type
    : { $in: ["public_group", "regional_hub", "global_hub"] };

  // TAG FILTER (exact match or via search by query)
  if (tag) {
    query.tags = tag;
  }

  // 🔥 FLEXIBLE SEARCH (prefix + substring on name, tags, description)
  if (q?.trim()) {
    const cleaned = q.trim();
    const prefix = new RegExp("^" + cleaned, "i");
    const contains = new RegExp(cleaned, "i");

    query.$or = [
      { name: prefix }, // Starts with word
      { name: contains }, // Contains word
      { description: contains },
      { tags: contains },
    ];
  }

  // 1️⃣ QUERY COMMUNITIES
  const communities = await Community.find(query)
    .select(
      "name description tags backgroundImage.url type createdBy updatedAt memberCount roomsLast7DaysCount"
    )
    .populate("createdBy", "username profilePicture")
    .skip(skip)
    .limit(lim)
    .lean();

  // If no communities, return early
  if (!communities.length) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { communities: [], pagination: { total: 0, page, limit: lim } },
          "Communities fetched"
        )
      );
  }

  // 2️⃣ CHECK USER MEMBERSHIP FOR EACH RESULT
  const communityIds = communities.map((c) => c._id);

  const memberships = await CommunityMembership.find({
    community: { $in: communityIds },
    user: userId,
  }).select("community role");

  const memMap = new Map(memberships.map((m) => [String(m.community), m.role]));

  const enriched = communities.map((c) => ({
    ...c,
    isMember: memMap.has(String(c._id)),
    userRole: memMap.get(String(c._id)) || null,
  }));

  // 3️⃣ COUNT FOR PAGINATION
  const total = await Community.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        communities: enriched,
        pagination: {
          total,
          page,
          limit: lim,
          totalPages: Math.ceil(total / lim),
        },
      },
      "Communities fetched"
    )
  );
});

//for searching my community

export const searchMyCommunities = asyncHandler(async (req, res) => {
  const { q = "", searchBy = "name", page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const skip = (page - 1) * limit;
  const lim = parseInt(limit);

  const cleaned = q.trim();

  // Base match: communities user belongs to
  const matchStage = {
    "memberships.user": new mongoose.Types.ObjectId(userId),
  };

  // 🔥 Add search filters
  if (cleaned) {
    const regex = new RegExp(cleaned, "i");

    if (searchBy === "tag") {
      matchStage.tags = { $in: [regex] };
    } else {
      matchStage.$or = [
        { name: regex },
        { description: regex },
        { tags: regex },
      ];
    }
  }

  const pipeline = [
    // Join membership
    {
      $lookup: {
        from: "communitymemberships",
        localField: "_id",
        foreignField: "community",
        as: "memberships",
      },
    },

    // Filter by user membership + search
    { $match: matchStage },

    // Sort
    { $sort: { updatedAt: -1 } },

    // Pagination
    { $skip: skip },
    { $limit: lim },

    // Join createdBy info
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "creator",
      },
    },
    { $unwind: "$creator" },

    // Final project
    {
      $project: {
        name: 1,
        description: 1,
        tags: 1,
        type: 1,
        backgroundImage: 1,
        createdBy: "$creator.username",
        creatorProfile: "$creator.profilePicture",
        memberCount: 1,
        roomsLast7DaysCount: 1,
      },
    },
  ];

  const communities = await Community.aggregate(pipeline);

  // Count pipeline
  const countPipeline = [
    {
      $lookup: {
        from: "communitymemberships",
        localField: "_id",
        foreignField: "community",
        as: "memberships",
      },
    },
    { $match: matchStage },
    { $count: "total" },
  ];

  const countResult = await Community.aggregate(countPipeline);
  const total = countResult[0]?.total || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        communities,
        pagination: {
          total,
          limit: lim,
          page,
          totalPages: Math.ceil(total / lim),
        },
      },
      "My communities fetched"
    )
  );
});

// Add this to your community controller file

export const getSimilarCommunities = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const { limit = 10 } = req.query;
  const userId = req.user._id;

  // 1️⃣ GET THE CURRENT COMMUNITY
  const currentCommunity = await Community.findById(communityId)
    .select("tags type")
    .lean();

  if (!currentCommunity) {
    throw new ApiError(404, "Community not found");
  }

  // If no tags, return empty
  if (!currentCommunity.tags || currentCommunity.tags.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { communities: [] }, "No tags to match"));
  }

  // 2️⃣ FIND COMMUNITIES WITH MATCHING TAGS
  const similarCommunities = await Community.find({
    _id: { $ne: communityId }, // Exclude current community
    tags: { $in: currentCommunity.tags }, // Match any tag
    type: { $in: ["public_group", "regional_hub", "global_hub"] }, // Only public communities
  })
    .select(
      "name tags backgroundImage.url type memberCount roomsLast7DaysCount lastActivityAt"
    )
    .sort({ memberCount: -1, roomsLast7DaysCount: -1, lastActivityAt: -1 })
    .limit(parseInt(limit))
    .lean();

  // 3️⃣ CHECK USER MEMBERSHIP FOR EACH RESULT
  const communityIds = similarCommunities.map((c) => c._id);

  const memberships = await CommunityMembership.find({
    community: { $in: communityIds },
    user: userId,
  }).select("community role");

  const memMap = new Map(memberships.map((m) => [String(m.community), m.role]));

  // 4️⃣ ENRICH WITH MEMBERSHIP STATUS
  const enriched = similarCommunities.map((c) => ({
    ...c,
    isMember: memMap.has(String(c._id)),
    userRole: memMap.get(String(c._id)) || null,
  }));

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { communities: enriched },
        "Similar communities fetched"
      )
    );
});

// Route to add in your routes file:
// router.get("/similarCommunities/:communityId", isAuthenticated, getSimilarCommunities);

/**
 * SUGGESTED COMMUNITIES
 */
export const suggestedCommunities = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const myMemberships = await CommunityMembership.find({ user: userId }).select(
    "community"
  );

  const joinedIds = myMemberships.map((m) => m.community.toString());

  const suggestions = await Community.find({
    _id: { $nin: joinedIds },
    type: { $in: ["public_group", "regional_hub", "global_hub"] },
  })
    .select(
      "name description backgroundImage.url type tags members memberCount roomsLast7DaysCount"
    )
    .lean();

  suggestions.forEach((c) => {
    c.memberCount = c.memberCount ?? (c.members?.length || 0);
  });

  return res
    .status(200)
    .json(new ApiResponse(200, suggestions, "Suggested communities"));
});

/**
 * DELETE COMMUNITY (admin only)
 */
export const deleteCommunity = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
    role: "admin",
  });
  if (!membership)
    throw new ApiError(403, "Only admins can delete the community");

  const community = await Community.findById(communityId);
  if (!community) throw new ApiError(404, "Community not found");

  // Delete cover image
  if (community.backgroundImage?.publicId) {
    try {
      await cloudinary.uploader.destroy(community.backgroundImage.publicId);
    } catch (err) {
      console.error("Failed to delete cover image:", err);
    }
  }

  // Get all members
  const allMembers = await CommunityMembership.find({ community: communityId });
  const memberUserIds = allMembers.map((m) => m.user);

  // Remove community from users
  await User.updateMany(
    { _id: { $in: memberUserIds } },
    { $pull: { communities: communityId } }
  );

  // Delete all memberships
  await CommunityMembership.deleteMany({ community: communityId });

  // Delete all activities
  await Activity.deleteMany({ community: communityId });

  // Delete community
  await Community.findByIdAndDelete(communityId);

  // Notify all members (real-time)
  try {
    emitToCommunity(communityId.toString(), "community:deleted", {
      communityId,
    });
  } catch (err) {
    // fallback per-user emit
    memberUserIds.forEach((memberId) => {
      try {
        emitToUser(memberId.toString(), "community:deleted", { communityId });
      } catch (e) {}
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Community deleted successfully"));
});
