import { User } from "../../models/user/user.model.js";
import { emitToUser } from "../../socket/server.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import cloudinary from "../../utils/cloudinary.js";
import getDataUri from "../../utils/datauri.js";
import { sendNotification } from "./notification.controller.js";

export const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error);
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

export const register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, "Username, email and password are required");
  }

  // Check duplicates
  const existing = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
  });

  if (existing) {
    throw new ApiError(400, "Username or email already exists");
  }

  // Create user
  const user = new User({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
    authProviders: [
      { provider: "email", providerId: `email:${email.toLowerCase()}` },
    ],
  });

  // Skip OTP in MVP
  if (process.env.DISABLE_OTP === "true") {
    user.emailVerified = true;
  }

  await user.save();

  const createdUser = await User.findById(user._id).select("-password");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

export const login = asyncHandler(async (req, res) => {
  console.log("BODY RECEIVED:", req.body);

  const { identifier, password } = req.body;

  if (!identifier || !password) {
    throw new ApiError(400, "Identifier and password are required");
  }

  const user = await User.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() },
    ],
  });

  if (!user) throw new ApiError(400, "User not found");

  if (!user.emailVerified && process.env.DISABLE_OTP !== "true") {
    throw new ApiError(403, "Verify your email first");
  }

  const valid = await user.isPasswordcorrect(password);

  if (!valid) throw new ApiError(400, "Incorrect password");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const profile = await User.findById(user._id)
    .select("-password -refreshToken")
    .populate({
      path: "following",
      select: "username profilePicture.url",
    });

  return res
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "lax",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    })
    .status(200)
    .json(
      new ApiResponse(200, {
        user: profile,
        accessToken,
        refreshToken,
      })
    );
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logout Successfully"));
});

export const getSuggestedUser = asyncHandler(async (req, res) => {
  try {
    const suggestedUser = await User.find({
      followers: { $ne: req.user._id },
    })
      .select("-password -refreshToken")
      .limit(10);

    // Check if array is empty, not if it's falsy
    if (suggestedUser.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, { users: [] }, "No suggested users found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { users: suggestedUser },
          "Suggested users fetched successfully"
        )
      );
  } catch (error) {
    console.error("error in suggestion part: ", error);
    // Make sure to send a response in case of error
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal server error"));
  }
});

export const followOrUnfollow = asyncHandler(async (req, res) => {
  const followerId = req.user._id; // who is following
  const targetId = req.params.userId; // who is being followed

  if (!targetId) {
    throw new ApiError(400, "Target user ID missing");
  }

  if (followerId.toString() === targetId.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const follower = await User.findById(followerId);
  const target = await User.findById(targetId);

  if (!follower || !target) {
    throw new ApiError(404, "User not found");
  }

  const isAlreadyFollowing = follower.following.includes(targetId);

  /* ----------------------------------------------------------
     UNFOLLOW
  ----------------------------------------------------------- */
  if (isAlreadyFollowing) {
    await Promise.all([
      User.updateOne({ _id: followerId }, { $pull: { following: targetId } }),
      User.updateOne({ _id: targetId }, { $pull: { followers: followerId } }),
    ]);

    const updatedUser = await User.findById(req.user._id);

    return res
      .status(200)
      .json(new ApiResponse(200, { updatedUser }, "Unfollowed successfully"));
  }

  /* ----------------------------------------------------------
     FOLLOW
  ----------------------------------------------------------- */

  await Promise.all([
    User.updateOne({ _id: followerId }, { $addToSet: { following: targetId } }),
    User.updateOne({ _id: targetId }, { $addToSet: { followers: followerId } }),
  ]);

  /* ----------------------------------------------------------
     SEND NOTIFICATION (Uses your existing system)
  ----------------------------------------------------------- */
  const notification = await sendNotification({
    recipient: targetId,
    sender: followerId,
    type: "follow",
    message: `${follower.username} started following you`,
    metadata: { followerId },
  });

  /* ----------------------------------------------------------
     REALTIME NOTIFICATION TO USER
  ----------------------------------------------------------- */
  emitToUser(targetId, "notification", notification);

  const updatedUser = await User.findById(req.user._id)
    .select("-password -refreshToken")
    .populate("following", "username profilePicture.url")
    .populate("followers", "username profilePicture.url");

  return res
    .status(200)
    .json(new ApiResponse(200, { updatedUser }, "Followed successfully"));
});

export const searchUsersWithPagination = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { query, page = 1, limit = 10 } = req.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password -refreshToken")
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments({
      _id: { $ne: userId },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers,
        hasMore: skip + users.length < totalUsers,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error searching users",
      error: error.message,
    });
  }
});

export const getProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.params._id;
    const { _id: requestingUserId } = req.user; // Get the requesting user's ID

    if (!userId) {
      throw new ApiError(400, "User is not valid");
    }

    // Check if the requesting user is viewing their own profile
    const isOwnProfile = requestingUserId.toString() === userId.toString();

    const userProfile = await User.findById(userId)
      .select("-password -refreshToken -aiChatHistory")
      .populate({
        path: "posts",
        options: { sort: { createdAt: -1 } },
      });

    if (!userProfile) {
      throw new ApiError(404, "User not found");
    }

    // Only populate bookmarks if viewing own profile
    if (isOwnProfile) {
      await userProfile.populate({
        path: "bookmarks",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "tripId",
          select: "location startDate endDate participants",
        },
      });
    } else {
      // Set bookmarks to empty array or undefined for other users
      userProfile.bookmarks = [];
    }

    return res
      .status(200)
      .json(new ApiResponse(200, userProfile, "Profile fetched successfully"));
  } catch (error) {
    console.error("Error in getProfile:", error);
    throw new ApiError(500, error.message || "Failed to fetch user profile");
  }
});

export const editProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, bio, address, privacy } = req.body;
    const profilePicture = req.file;

    const user = await User.findById(userId)
      .select("-password -refreshToken -aiChatHistory")
      .populate({
        path: "posts",
        select: "type caption media createdAt",
        options: { sort: { createdAt: -1 } },
      });
    if (!user) throw new ApiError(404, "User not found");

    // Handle profile picture update
    if (profilePicture) {
      // Delete old image if exists
      if (user.profilePicture?.publicId) {
        await cloudinary.uploader
          .destroy(user.profilePicture.publicId)
          .catch((error) => console.error("Old image deletion failed:", error));
      }

      // Upload new image
      const fileUri = getDataUri(profilePicture);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        folder: `users/${userId}`,
        transformation: [
          { width: 500, height: 500, crop: "fill", quality: "auto" },
          { fetch_format: "auto" },
        ],
      });

      user.profilePicture = {
        url: cloudResponse.secure_url,
        publicId: cloudResponse.public_id,
      };
    }

    // Update other fields
    if (address !== undefined) user.address = address;
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (privacy !== undefined) {
      user.privacy = privacy === "true" || privacy === true; //now any other thing than "true" or true is consider false
    }

    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Profile updated successfully"));
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Profile update failed"
    );
  }
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -refreshToken")
    .populate({
      path: "following",
      select: "username profilePicture.url",
    })
    .populate({
      path: "followers",
      select: "username profilePicture.url",
    });

  res.status(200).json(new ApiResponse(200, user, "User fetched"));
});
