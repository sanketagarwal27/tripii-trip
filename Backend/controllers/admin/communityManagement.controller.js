import { Community } from "../../models/community/community.model.js";
import { MessageInComm } from "../../models/community/messageInComm.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";

// Helper
const getPostCountForCommunity = async (communityId) => {
  return await MessageInComm.countDocuments({ community: communityId });
};

export const getAllCommunities = asyncHandler(async (req, res) => {
  try {
    const {
      search,
      status,
      type,
      verified,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (status) query.status = status;
    if (type) query.type = type;
    if (verified === "true") query.isVerified = true;
    if (verified === "false") query.isVerified = false;

    const skip = (page - 1) * limit;

    const communities = await Community.find(query)
      .populate("createdBy", "username email profilePicture")
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Community.countDocuments(query);

    // FIX: Use Promise.all to await the async map
    const formattedCommunities = await Promise.all(
      communities.map(async (comm) => {
        const postCount = await getPostCountForCommunity(comm._id);

        return {
          id: comm._id,
          name: comm.name,
          // Safety check in case creator is deleted
          creator: comm.createdBy ? comm.createdBy.username : "Unknown",
          members: comm.members.length,
          posts: postCount,
          reports: comm.reportCount || 0,
          type: comm.type,
          status: comm.status,
          isVerified: comm.isVerified,
          createdAt: comm.createdAt,
          avatar: comm.backgroundImage.url || "",
        };
      })
    );

    res.status(200).json(
      new ApiResponse(
        200,
        {
          communities: formattedCommunities,
          pagination: {
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
          },
        },
        "Fetched Communities Overview"
      )
    );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Error fetching communities");
  }
});

export const verifyCommunity = asyncHandler(async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      throw new ApiError(404, "Community not found !");
    }

    // Toggle the status
    community.isVerified = !community.isVerified;
    await community.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          community,
          `Community Verification Status changed successfully !`
        )
      );
  } catch (error) {
    throw new ApiError(500, "Server error");
  }
});

export const updateCommunityStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body; // Expecting: 'Active', 'Suspended', 'Banned'

    const community = await Community.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!community) {
      throw new ApiError(404, "Community not found !");
    }

    // Optional: Send email to creator explaining the status change

    res
      .status(200)
      .json(
        new ApiResponse(200, community, `Community status changed to ${status}`)
      );
  } catch (error) {
    throw new ApiError(500, "Server Error");
  }
});

export const deleteCommunity = asyncHandler(async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      throw new ApiError(404, "Community not found !");
    }

    // Logic to cleanup related data (posts, comments) would go here
    await community.deleteOne();

    res
      .status(200)
      .json(new ApiResponse(200, null, "Community Deleted Successfully"));
  } catch (error) {
    throw new ApiError(500, "Server Error");
  }
});
