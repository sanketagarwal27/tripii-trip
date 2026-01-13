// controllers/user/post.controller.js
import mongoose from "mongoose";

import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";

import cloudinary from "../../utils/cloudinary.js";
import sharp from "sharp";

// MODELS
import { Post } from "../../models/user/post.model.js";
import { Comment } from "../../models/user/comment.model.js";
import { User } from "../../models/user/user.model.js";
import { Trip } from "../../models/trip/trip.model.js";

// POINTS & LEVEL ENGINE
import { awardPoints } from "../../points/awardPoints.js";
import { rollbackPointsForModel } from "../../points/rollbackPoints.js";

// REALTIME SOCKET
// Your socket server file is socket/server.js — import named export helpers from there
import { emitToUser } from "../../socket/server.js";

// NOTIFICATIONS (same folder)
import { sendNotification } from "./notification.controller.js";
import { getCommentReward } from "../../points/diminishingCommentReward.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

/**
 * Utility: normalize multer files structure
 * Accepts:
 *  - req.files as array (multer.array)
 *  - req.files as object of arrays (multer.fields)
 *  - req.file as single file (multer.single)
 */
const normalizeFiles = (req) => {
  if (!req) return [];
  if (req.files && Array.isArray(req.files)) return req.files;
  if (req.file) return [req.file];
  if (req.files && typeof req.files === "object") {
    // merge all field arrays into a single array
    return Object.keys(req.files).reduce((acc, k) => {
      const arr = Array.isArray(req.files[k]) ? req.files[k] : [req.files[k]];
      return acc.concat(arr);
    }, []);
  }
  return [];
};

/**
 * Upload media files to Cloudinary. Resizes non-gif images.
 * Returns array of { url, publicId, type } where type is "image" | "video" | "gif"
 */
const uploadMediaFiles = async (files) => {
  const results = [];

  for (const file of files) {
    const mimetype = file.mimetype || "";
    const isImage = mimetype.startsWith("image/");
    const isVideo = mimetype.startsWith("video/");
    const isGif = mimetype.includes("gif") || mimetype === "image/gif";

    let buffer = file.buffer;

    // Resize images only (not gifs)
    if (isImage && !isGif) {
      buffer = await sharp(file.buffer)
        .resize({ width: 1200, height: 1200, fit: "inside" })
        .jpeg({ quality: 80 })
        .toBuffer();
    }

    const resource_type = isVideo ? "video" : "image";
    const cloud = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${buffer.toString("base64")}`,
      { resource_type }
    );

    results.push({
      url: cloud.secure_url,
      publicId: cloud.public_id,
      type: isVideo ? "video" : isGif ? "gif" : "image",
    });
  }

  return results;
};

export const createNormalPost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { caption } = req.body;

  const uploadedFiles = normalizeFiles(req);

  if (!caption?.trim() && uploadedFiles.length === 0) {
    throw new ApiError(400, "Write something or add a media file.");
  }

  let media = [];

  // Upload media only if files exist
  if (uploadedFiles.length > 0) {
    media = await uploadMediaFiles(uploadedFiles);
  }

  const post = await Post.create({
    type: "normal",
    caption: caption?.trim() || "",
    media, // may be empty []
    author: userId,
  });

  await User.findByIdAndUpdate(userId, { $push: { posts: post._id } });

  // Award points — still valid for both text-only & media posts
  const points = await awardPoints(userId, "post_created", {
    model: "Post",
    modelId: post._id,
    actorId: userId,
  });

  const updatedUser = await User.findById(userId).select("-password");

  const newPost = await Post.findById(post._id).populate("author");
  return res
    .status(200)
    .json(new ApiResponse(200, { post: newPost, updatedUser }, "..."));
});

export const createTripPost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    tripId,
    experience,
    travelTips, // unified field (instead of hiddenGems)
    planningSummary,
    visitedPlaces, // expected: [{ placeId?, name, rating }]
    famousPlaces, // optional array of ids/names
    expenseHistory, // optional anonymized expense summary
    selectedGalleryPhotos = [], // array of cloud publicIds or tripPhoto ids (frontend decides)
  } = req.body;

  if (!tripId || !mongoose.Types.ObjectId.isValid(tripId)) {
    throw new ApiError(400, "Invalid trip ID");
  }

  const trip = await Trip.findById(tripId).populate(
    "participants",
    "username profilePicture"
  );
  if (!trip) throw new ApiError(404, "Trip not found");

  // visitedPlaces rating enforcement (you said rating necessary)
  if (!Array.isArray(visitedPlaces) || visitedPlaces.length === 0) {
    throw new ApiError(400, "Visited places with ratings are required");
  }

  const files = normalizeFiles(req); // merges all uploaded files
  // split cover vs others if client sent fields; fallback to first image as cover
  const mediaFiles = req.files && req.files.media ? req.files.media : files;
  const coverFile =
    req.files && req.files.cover && req.files.cover[0]
      ? req.files.cover[0]
      : null;

  const media = await uploadMediaFiles(
    Array.isArray(mediaFiles) ? mediaFiles : []
  );
  let coverPhoto = null;
  if (coverFile) {
    coverPhoto = (await uploadMediaFiles([coverFile]))[0];
  }

  // trip members snapshot
  const snapshot = (trip.participants || []).map((u) => ({
    userId: u._id,
    username: u.username,
    profilePicture: u.profilePicture?.url || "",
  }));

  const post = await Post.create({
    type: "trip",
    author: userId,
    media,
    tripId,
    tripMeta: {
      experience: experience || "",
      travelTips: Array.isArray(travelTips)
        ? travelTips
        : travelTips
        ? [travelTips]
        : [],
      planningSummary: planningSummary || "",
      visitedPlaces,
      famousPlaces: Array.isArray(famousPlaces)
        ? famousPlaces
        : famousPlaces
        ? [famousPlaces]
        : [],
      expenseHistory: expenseHistory || null,
      coverPhoto,
      selectedGalleryPhotos,
      tripMembersSnapshot: snapshot,
    },
  });

  await User.findByIdAndUpdate(userId, { $push: { tripPosts: post._id } });

  const points = await awardPoints(userId, "post_created", {
    model: "Post",
    modelId: post._id,
    actorId: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { post, points }, "Trip post created"));
});

export const toggleLike = asyncHandler(async (req, res) => {
  const userId = req.user._id; // liker
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId))
    throw new ApiError(400, "Invalid post ID");

  const post = await Post.findById(postId).populate("author");
  if (!post) throw new ApiError(404, "Post not found");

  const hasLiked = post.likes.some(
    (l) => l.user.toString() === userId.toString()
  );

  // -------------------------------
  // UNLIKE CASE
  // -------------------------------
  if (hasLiked) {
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $pull: { likes: { user: userId } } },
      { new: true }
    );

    // rollback EXACT XP log caused by THIS liker
    await rollbackPointsForModel(
      "Post",
      postId,
      userId, // actorId
      "post_like_received" // activity
    );

    const updatedUser = await User.findById(userId).select("-password");
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          liked: false,
          likes: updatedPost.likes,
          updatedUser,
        },
        "Post unliked"
      )
    );
  }

  // -------------------------------
  // LIKE CASE
  // -------------------------------
  const updatedPost = await Post.findOneAndUpdate(
    {
      _id: postId,
      "likes.user": { $ne: userId },
    },
    {
      $push: { likes: { user: userId, likedAt: new Date() } },
    },
    { new: true }
  );

  try {
    // Award XP only if liker != post author
    if (post.author._id.toString() !== userId.toString()) {
      await awardPoints(post.author._id, "post_like_received", {
        model: "Post",
        modelId: postId,
        actorId: userId,
      });

      const notif = await sendNotification({
        recipient: post.author._id,
        sender: userId,
        type: "like", // ensure this matches your Notification enum
        post: postId,
        message: `${req.user.username} liked your post`,
      });

      emitToUser(post.author._id, "notification", notif);
    }
  } catch (err) {
    console.error("🔥 ERROR IN LIKE POINTS/NOTIFICATION:", err);
  }

  const updatedUser = await User.findById(userId).select("-password");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        liked: true,
        likes: updatedPost.likes,
        userId,
        updatedUser,
      },
      "Post liked"
    )
  );
});

export const addComment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;
  const { text, parentCommentId } = req.body;

  if (!text?.trim()) throw new ApiError(400, "Comment text required");
  if (!mongoose.Types.ObjectId.isValid(postId))
    throw new ApiError(400, "Invalid post ID");

  const post = await Post.findById(postId).populate("author");
  if (!post) throw new ApiError(404, "Post not found");

  // ⭐ Create Comment FIRST (safe)
  const comment = await Comment.create({
    text: text.trim(),
    post: postId,
    author: userId,
    parentComment: parentCommentId || null,
  });

  await post.updateOne({ $push: { comments: comment._id } });

  // ⭐ WRAP XP + NOTIFICATION SO IT NEVER BREAKS THE RESPONSE
  try {
    // Comment reward to post owner
    const xpToOwner = await getCommentReward(userId, postId);

    if (xpToOwner > 0) {
      await awardPoints(post.author._id, "post_comment_received", {
        forceXP: xpToOwner,
        model: "Post",
        modelId: postId,
        actorId: userId,
      });
    }

    // Send notification
    if (post.author._id.toString() !== userId.toString()) {
      const notif = await sendNotification({
        sender: userId,
        recipient: post.author._id,
        type: "comment",
        post: postId,
        message: `${req.user.username} commented on your post`,
      });

      emitToUser(post.author._id, "notification", notif);
    }
  } catch (err) {
    console.error("⚠ Notification or XP error:", err.message);
    // DO NOT throw — user comment should still succeed
  }

  const populated = await Comment.findById(comment._id).populate(
    "author",
    "username profilePicture"
  );

  return res.status(201).json(new ApiResponse(201, populated, "Comment added"));
});

export const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  // 1. Ensure post exists
  const postExists = await Post.exists({ _id: postId });
  if (!postExists) throw new ApiError(404, "Post not found");

  // 2. Fetch comments (sorted + populated)
  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("author", "username profilePicture")
    .lean();

  // 3. Count total comments
  const total = await Comment.countDocuments({ post: postId });

  // 4. OPTIONAL: Group nested replies
  const grouped = [];
  const map = {};

  comments.forEach((c) => {
    c.replies = [];
    map[c._id] = c;
  });

  comments.forEach((c) => {
    if (c.parentComment) {
      if (map[c.parentComment]) {
        map[c.parentComment].replies.push(c);
      }
    } else {
      grouped.push(c);
    }
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments: grouped,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalComments: total,
        },
      },
      "Comments fetched"
    )
  );
});

export const deletePost = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  // ------------------------------
  // 1. Verify post ownership
  // ------------------------------
  const post = await Post.findOne({ _id: postId, author: userId });
  if (!post) throw new ApiError(404, "Post not found or unauthorized");

  // ------------------------------
  // 2. Delete media from Cloudinary
  // ------------------------------
  for (const m of post.media || []) {
    try {
      await cloudinary.uploader.destroy(m.publicId, {
        resource_type: m.type === "video" ? "video" : "image",
      });
    } catch (err) {
      console.error("Cloudinary destroy error:", err);
    }
  }

  // Trip cover photo (if present)
  if (post.tripMeta?.coverPhoto?.publicId) {
    try {
      await cloudinary.uploader.destroy(post.tripMeta.coverPhoto.publicId, {
        resource_type: "image",
      });
    } catch (err) {
      console.error("Cover destroy error:", err);
    }
  }

  await Comment.deleteMany({ post: postId });

  await User.findByIdAndUpdate(userId, { $pull: { posts: postId } });

  await rollbackPointsForModel("Post", postId);

  await post.deleteOne();

  const updatedUser = await User.findById(userId).select("-password");
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        updatedUser,
      },
      "Post deleted successfully"
    )
  );
});

export const getFeedPosts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const { page = 1, limit = 100 } = req.query;
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("author", "username profilePicture.url")
    .lean();

  posts.forEach((p) => {
    p.commentCount = p.comments?.length || 0;
    delete p.comments;
  });

  const total = await Post.countDocuments();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
        },
      },
      "Feed posts"
    )
  );
});

export const getPostById = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const post = await Post.findById(postId)
    .populate("author", "username profilePicture")
    .populate({
      path: "comments",
      populate: { path: "author", select: "username profilePicture" },
    })
    .populate({
      path: "tripId",
      populate: { path: "participants", select: "username profilePicture" },
    });

  if (!post) throw new ApiError(404, "Post not found");
  return res.status(200).json(new ApiResponse(200, post));
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { postId } = req.params;
  if (!postId || !mongoose.Types.ObjectId.isValid(postId))
    throw new ApiError(400, "Invalid post ID");

  const postExists = await Post.exists({ _id: postId });
  if (!postExists) throw new ApiError(404, "Post not found");

  const user = await User.findById(userId);
  const exists = user.bookmarks.some((b) => b.toString() === postId.toString());
  if (exists) user.bookmarks.pull(postId);
  else user.bookmarks.push(postId);

  await user.save();
  return res.status(200).json(new ApiResponse(200, { bookmarked: !exists }));
});

//like for comment
export const toggleCommentLike = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const alreadyLiked = comment.likes.includes(userId);

  if (alreadyLiked) {
    // Unlike
    comment.likes.pull(userId);
    comment.likeCount = Math.max(0, comment.likeCount - 1);
  } else {
    // Like
    comment.likes.push(userId);
    comment.likeCount += 1;

    // Send notification to author (if not same person)
    if (comment.author.toString() !== userId.toString()) {
      const notif = await sendNotification({
        sender: userId,
        recipient: comment.author,
        type: "comment_like",
        comment: comment._id,
        message: `${req.user.username} liked your comment`,
      });

      emitToUser(comment.author, "notification", notif);
    }
  }

  await comment.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        likes: comment.likes,
        likeCount: comment.likeCount,
      },
      "Comment like toggled"
    )
  );
});

// controllers/user/post.controller.js

export const deleteComment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { commentId } = req.params;

  // 1. Fetch comment
  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  // 2. Fetch the parent post
  const post = await Post.findById(comment.post);
  if (!post) throw new ApiError(404, "Post not found");

  // 3. Permission check
  const isCommentOwner = comment.author.toString() === userId.toString();
  const isPostOwner = post.author.toString() === userId.toString();

  if (!isCommentOwner && !isPostOwner) {
    throw new ApiError(403, "You cannot delete this comment");
  }

  // 4. Soft delete main comment
  comment.isDeleted = true;
  comment.text = "This comment was deleted.";
  comment.deletedBy = userId;
  await comment.save();

  // 5. Soft delete replies (depth = 2)
  await Comment.updateMany(
    { parentComment: commentId },
    {
      $set: {
        isDeleted: true,
        text: "This reply was deleted.",
        deletedBy: userId,
      },
    }
  );

  // 6. Remove comment from Post.comments array
  await Post.updateOne({ _id: post._id }, { $pull: { comments: commentId } });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export const getContextualPostLikes = asyncHandler(async (req, res) => {
  const viewerId = req.user._id;
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));

  const skip = (pageNum - 1) * limitNum;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid post ID");
  }

  const result = await Post.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(postId) } },

    // viewer relations
    {
      $lookup: {
        from: "users",
        let: { viewerId: new mongoose.Types.ObjectId(viewerId) },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$viewerId"] } } },
          {
            $project: {
              relations: { $setUnion: ["$followers", "$following"] },
            },
          },
        ],
        as: "viewer",
      },
    },
    { $unwind: "$viewer" },

    // flatten likes
    { $unwind: "$likes" },

    // only contextual likes
    {
      $match: {
        $expr: { $in: ["$likes.user", "$viewer.relations"] },
      },
    },

    // sort by like time
    { $sort: { "likes.likedAt": -1 } },

    // paginate
    { $skip: skip },
    { $limit: parseInt(limit) },

    // join user
    {
      $lookup: {
        from: "users",
        localField: "likes.user",
        foreignField: "_id",
        pipeline: [{ $project: { username: 1, "profilePicture.url": 1 } }],
        as: "user",
      },
    },
    { $unwind: "$user" },

    // final shape
    {
      $project: {
        _id: "$user._id",
        username: "$user.username",
        profilePicture: "$user.profilePicture",
        likedAt: "$likes.likedAt",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, { users: result }, "Contextual likes fetched"));
});
