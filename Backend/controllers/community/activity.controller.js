// controllers/community/activities.controller.js
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Activity } from "../../models/community/activity.model.js";
import { CommunityMembership } from "../../models/community/communityMembership.model.js";
import { Community } from "../../models/community/community.model.js";

/**
 * GET COMMUNITY ACTIVITIES
 * Fetches activity feed for a community with pagination
 */
export const getCommunityActivities = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;
  const { page = 1, limit = 50, type } = req.query;

  // Verify membership
  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });
  const community = await Community.findById(communityId);

  if (!membership && community.type === "private_group") {
    throw new ApiError(403, "Only members can view activities");
  }

  const query = { community: communityId };

  // Filter by activity type if provided
  if (type) {
    const validTypes = ["poll", "room_created", "trip_created", "member_added"];
    if (validTypes.includes(type)) {
      query.type = type;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const activities = await Activity.find(query)
    .populate("actor", "username profilePicture.url")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Activity.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        activities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Activities fetched"
    )
  );
});

/**
 * GET ACTIVITY TIMELINE
 * Daily breakdown of activities (for charts/graphs)
 */
export const getActivityTimeline = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;
  const { days = 30 } = req.query;

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only members can view timeline");
  }

  const timeThreshold = new Date(
    Date.now() - parseInt(days) * 24 * 60 * 60 * 1000
  );

  const timeline = await Activity.aggregate([
    {
      $match: {
        community: communityId,
        createdAt: { $gte: timeThreshold },
      },
    },
    {
      $group: {
        _id: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          type: "$type",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        activities: {
          $push: {
            type: "$_id.type",
            count: "$count",
          },
        },
        totalCount: { $sum: "$count" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, timeline, "Activity timeline fetched"));
});
