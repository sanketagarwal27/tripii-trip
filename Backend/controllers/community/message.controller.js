// controllers/community/messages.controller.js
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import cloudinary from "../../utils/cloudinary.js";
import getDataUri from "../../utils/datauri.js";

import { Community } from "../../models/community/community.model.js";
import { CommunityMembership } from "../../models/community/communityMembership.model.js";
import { MessageInComm } from "../../models/community/messageInComm.model.js";

import { sendNotification } from "../user/notification.controller.js";
import {
  emitToCommunity,
  emitToMessage,
  emitToUser,
} from "../../socket/server.js";
import { rollbackPointsForModel } from "../../points/rollbackPoints.js";
import { awardPoints } from "../../points/awardPoints.js";
import { CommComment } from "../../models/community/CommCommunity.model.js";
import { Notification } from "../../models/user/notification.model.js";
import { Activity } from "../../models/community/activity.model.js";
import { User } from "../../models/user/user.model.js";

/**
 * Upload media helper
 */
const uploadMedia = async (file, communityId) => {
  const uri = getDataUri(file);

  const isImage = file.mimetype.startsWith("image/");

  const result = await cloudinary.uploader.upload(uri.content, {
    folder: `communities/${communityId}/media`,
    resource_type: "auto",

    // 🔥 CRITICAL: resize + compress at upload time
    transformation: isImage
      ? [
          {
            width: 1280, // limit resolution
            crop: "limit",
            quality: "auto:eco", // stronger compression
            fetch_format: "auto", // webp/avif when possible
          },
        ]
      : undefined,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    mimeType:
      result.resource_type === "image"
        ? `image/${result.format}`
        : file.mimetype,
    originalName: file.originalname,
    size: result.bytes, // 🔥 compressed size
  };
};

/**
 * SEND MESSAGE IN COMMUNITY
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;
  const { content = "", gifUrl, replyTo, mentions = [] } = req.body;
  const file = req.files?.media?.[0];

  // 🔥 FIX: Parse poll from FormData
  let poll = null;
  if (req.body.poll) {
    try {
      poll =
        typeof req.body.poll === "string"
          ? JSON.parse(req.body.poll)
          : req.body.poll;
    } catch (err) {
      throw new ApiError(400, "Invalid poll format");
    }
  }

  const membership = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!membership) throw new ApiError(403, "Only members can send messages");

  if (!content && !file && !gifUrl && !poll)
    throw new ApiError(400, "Message must contain text, media, GIF, or poll");

  const messageData = {
    community: communityId,
    sender: userId,
    content: content?.trim() || "",
    senderDisplayName: membership.displayName || req.user.username,
    senderDisplayProfile: req.user.profilePicture?.url || "",
    mentions: Array.isArray(mentions) ? mentions : [],
  };

  // ---------- REPLY ----------
  if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
    const parent = await MessageInComm.findById(replyTo)
      .populate("sender", "username")
      .lean();

    if (parent && parent.community.toString() === communityId) {
      messageData.replyTo = {
        messageId: replyTo,
        senderName:
          parent.senderDisplayName || parent.sender?.username || "Unknown User",
        content: parent.content?.slice(0, 100) || "",
        type: parent.type,
        media:
          parent.type === "image" || parent.type === "gif"
            ? { url: parent.media?.url }
            : null,
      };
    }
  }

  // ---------- POLL ----------
  if (poll) {
    const {
      question,
      options = [],
      allowMultipleVotes = false,
      expiresInHours = 24,
    } = poll;

    if (!question?.trim()) throw new ApiError(400, "Poll question required");
    if (!Array.isArray(options) || options.length < 2)
      throw new ApiError(400, "Poll needs at least 2 options");

    messageData.type = "poll";
    messageData.poll = {
      question: question.trim(),
      options: options.map((t, i) => ({
        id: i,
        text: t.trim(),
        votes: [],
      })),
      allowMultipleVotes,
      createdBy: userId,
      expiresAt: new Date(Date.now() + expiresInHours * 3600 * 1000),
      totalVotes: 0,
    };
  }

  // ---------- MEDIA (OPTIMISTIC) ----------
  else if (file) {
    messageData.type = file.mimetype.startsWith("image/")
      ? "image"
      : "document";

    messageData.media = {
      uploadState: "uploading",
    };
  }

  // ---------- GIF ----------
  else if (gifUrl) {
    messageData.type = "gif";
    messageData.media = { url: gifUrl };
  }

  // ---------- TEXT ----------
  else {
    messageData.type = "text";
  }

  // ---------- CREATE MESSAGE IMMEDIATELY ----------
  const message = await MessageInComm.create(messageData);
  await message.populate("sender", "username profilePicture");

  const emitPayload = {
    ...message.toObject(),
    sender: {
      _id: message.sender._id,
      username: message.sender.username,
      profilePicture: message.sender.profilePicture,
      displayName: message.senderDisplayName,
    },
  };

  // 🔥 Emit immediately
  emitToCommunity(communityId.toString(), "community:message:new", emitPayload);

  await Community.findByIdAndUpdate(
    communityId,
    { lastActivityAt: new Date() },
    { new: true }
  );

  // ---------- MENTION NOTIFICATIONS (SAFE ADD-ON) ----------
  try {
    if (Array.isArray(mentions) && mentions.length > 0) {
      const uniqueMentionIds = new Set();

      for (const m of mentions) {
        const mentionedUserId = typeof m === "string" ? m : m?.user || m?._id;

        if (
          mentionedUserId &&
          mentionedUserId.toString() !== userId.toString()
        ) {
          uniqueMentionIds.add(mentionedUserId.toString());
        }
      }

      for (const mentionedUserId of uniqueMentionIds) {
        await sendNotification({
          recipient: mentionedUserId,
          sender: userId,
          type: "mention",
          message: `${req.user.username} mentioned you in a community`,
          community: communityId,
          metadata: {
            messageId: message._id,
          },
        });
      }
    }
  } catch (err) {
    console.error("Mention notification error:", err);
  }

  // ---------- BACKGROUND MEDIA UPLOAD ----------
  if (file) {
    uploadMedia(file, communityId)
      .then(async (uploaded) => {
        await MessageInComm.findByIdAndUpdate(message._id, {
          media: {
            ...uploaded,
            uploadState: "uploaded",
          },
        });

        emitToCommunity(communityId.toString(), "community:message:updated", {
          _id: message._id,
          media: {
            ...uploaded,
            uploadState: "uploaded",
          },
        });
      })
      .catch(async (err) => {
        console.error("Media upload failed:", err);

        await MessageInComm.findByIdAndUpdate(message._id, {
          media: { uploadState: "failed" },
        });

        emitToCommunity(communityId.toString(), "community:message:updated", {
          _id: message._id,
          media: { uploadState: "failed" },
        });
      });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, emitPayload, "Message sent"));
});

/**
 * GET MESSAGES
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;
  const { limit = 500, before } = req.query;

  const member = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  const community = await Community.findById(communityId);

  if (!member && community.type == "private_group")
    throw new ApiError(403, "Only members can view messages");

  const query = { community: communityId };
  if (before) query.createdAt = { $lt: new Date(before) };

  const messages = await MessageInComm.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate("sender", "username profilePicture")
    .lean();

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

/**
 * REACT TO MESSAGE
 */
export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!emoji?.trim()) throw new ApiError(400, "Emoji required");

  const message = await MessageInComm.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const member = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });
  if (!member) throw new ApiError(403, "Only members can react");

  const exists = message.reactions.some(
    (r) => r.emoji === emoji && r.by.toString() === userId.toString()
  );

  let updated;
  if (exists) {
    updated = await MessageInComm.findByIdAndUpdate(
      messageId,
      { $pull: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  } else {
    updated = await MessageInComm.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { emoji, by: userId } } },
      { new: true }
    );
  }

  emitToCommunity(message.community.toString(), "community:message:reaction", {
    messageId,
    reactions: updated.reactions,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updated.reactions,
        exists ? "Reaction removed" : "Reaction added"
      )
    );
});

export const toggleMessageHelpful = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await MessageInComm.findById(messageId).populate("sender");
  if (!message) throw new ApiError(404, "Message not found");

  const exists = message.helpful.some(
    (h) => h.user.toString() === userId.toString()
  );

  console.log(`🔄 Toggle helpful for message ${messageId} by user ${userId}`);
  console.log(`   Current state: ${exists ? "removing" : "adding"}`);
  console.log(`   Message author: ${message.sender._id}`);

  if (exists) {
    // ========== REMOVING HELPFUL ==========
    message.helpful = message.helpful.filter(
      (h) => h.user.toString() !== userId.toString()
    );
    message.helpfulCount = Math.max(0, message.helpfulCount - 1); // 🔥 Prevent negative

    // Only rollback if the user is NOT the message author (can't earn points from self)
    if (message.sender._id.toString() !== userId.toString()) {
      console.log(`   ⏪ Rolling back points for author ${message.sender._id}`);

      // 🔥 Use specific rollback with actorId to only remove THIS user's helpful action
      await rollbackPointsForModel(
        "MessageInComm",
        messageId,
        userId,
        "message_helpful_received"
      );
    } else {
      console.log(`   ⏭️ Skipping rollback (user is author)`);
    }
  } else {
    // ========== ADDING HELPFUL ==========
    message.helpful.push({ user: userId });
    message.helpfulCount++;

    // Only award if the user is NOT the message author
    if (message.sender._id.toString() !== userId.toString()) {
      console.log(`   ⏩ Awarding points to author ${message.sender._id}`);

      await awardPoints(message.sender._id, "message_helpful_received", {
        model: "MessageInComm",
        modelId: messageId,
        actorId: userId,
      });

      // Send notification
      const notif = await sendNotification({
        recipient: message.sender._id,
        sender: userId,
        type: "community_message_upvote",
        message: `${req.user.username} marked your message as helpful`,
        community: message.community,
        metadata: {
          messageId,
        },
      });

      emitToUser(message.sender._id, "notification", notif);
    } else {
      console.log(`   ⏭️ Skipping award (user is author)`);
    }
  }

  await message.save();

  // Emit socket event to update count in real-time
  emitToCommunity(message.community.toString(), "community:message:helpful", {
    messageId,
    helpfulCount: message.helpfulCount,
  });

  console.log(`✅ Helpful toggled. New count: ${message.helpfulCount}`);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        helpful: !exists,
        helpfulCount: message.helpfulCount,
      },
      "Helpful updated"
    )
  );
});

export const createComment = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content, parentCommentId, gifUrl } = req.body;
  const userId = req.user._id;
  const file = req.files?.media?.[0];

  const message = await MessageInComm.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  if (!content?.trim() && !file && !gifUrl)
    throw new ApiError(400, "Comment must contain text, media, or GIF");

  let depth = 1;
  let parent = null;

  if (parentCommentId) {
    parent = await CommComment.findById(parentCommentId);
    if (!parent) throw new ApiError(404, "Parent comment not found");
    if (parent.depth >= 3) throw new ApiError(400, "Max depth reached");
    depth = parent.depth + 1;
  }

  const commentData = {
    community: message.community,
    message: messageId,
    parentComment: parentCommentId || null,
    depth,
    author: userId,
    content: content?.trim() || "",
  };

  // Handle media upload
  if (file) {
    const uploaded = await uploadMedia(file, message.community);
    commentData.media = uploaded;
  } else if (gifUrl) {
    commentData.media = { url: gifUrl };
  }

  const comment = await CommComment.create(commentData);

  await comment.populate("author", "username profilePicture");

  const updatedMessage = await MessageInComm.findByIdAndUpdate(
    messageId,
    { $inc: { commentCount: 1 } },
    { new: true }
  ).select("_id commentCount community");

  emitToCommunity(
    message.community.toString(),
    "community:message:commentCount",
    {
      messageId,
      commentCount: updatedMessage.commentCount,
    }
  );

  if (message.sender.toString() !== userId.toString()) {
    const notif = await sendNotification({
      recipient: message.sender,
      sender: userId,
      type: "community_message_comment",
      message: `${req.user.username} commented on your message`,
      community: message.community,
      metadata: {
        messageId,
        commentId: comment._id,
      },
    });
    emitToUser(message.sender, "notification", notif);
  }

  if (parent && parent.author.toString() !== userId.toString()) {
    const notif = await sendNotification({
      recipient: parent.author,
      sender: userId,
      type: "reply",
      message: `${req.user.username} replied to your comment`,
      community: message.community,
      metadata: {
        messageId,
        commentId: comment._id,
        parentCommentId,
      },
    });
    emitToUser(parent.author, "notification", notif);
  }

  emitToMessage(messageId.toString(), "community:comment:new", { comment });

  return res.status(201).json(new ApiResponse(201, comment, "Comment added"));
});

export const reactToComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  const comment = await CommComment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const exists = comment.reactions.some(
    (r) => r.emoji === emoji && r.by.toString() === userId.toString()
  );

  if (exists) {
    comment.reactions = comment.reactions.filter(
      (r) => !(r.emoji === emoji && r.by.toString() === userId.toString())
    );
  } else {
    comment.reactions.push({ emoji, by: userId });
  }

  await comment.save();

  emitToCommunity(comment.community.toString(), "community:comment:reaction", {
    commentId,
    reactions: comment.reactions,
  });

  // In reactToComment function, add this line after emitToCommunity:
  emitToMessage(comment.message.toString(), "community:comment:reaction", {
    commentId,
    reactions: comment.reactions,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment.reactions, "Reaction updated"));
});

export const getMessageComments = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { limit = 100, before } = req.query;

  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    throw new ApiError(400, "Invalid message id");
  }

  const query = { message: messageId };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const comments = await CommComment.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate("author", "username profilePicture")
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        comments,
        hasMore: comments.length === parseInt(limit),
        nextCursor: comments.length
          ? comments[comments.length - 1].createdAt
          : null,
      },
      "Comments fetched"
    )
  );
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  /* ---------------- FIND MESSAGE ---------------- */
  const message = await MessageInComm.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  /* ---------------- MEMBERSHIP CHECK ---------------- */
  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Only community members can delete messages");
  }

  /* ---------------- PIN PROTECTION ---------------- */
  const community = await Community.findById(message.community).select(
    "pinnedMessages"
  );

  const isPinned = community?.pinnedMessages?.some(
    (p) => p.message.toString() === messageId.toString()
  );

  if (isPinned) {
    throw new ApiError(403, "Pinned messages cannot be deleted");
  }

  /* ---------------- PERMISSION CHECK ---------------- */
  const isSender = message.sender.toString() === userId.toString();
  const isAdmin = membership.role === "admin";
  const isModerator = membership.role === "moderator";

  if (!isSender && !isAdmin && !isModerator) {
    throw new ApiError(403, "You are not allowed to delete this message");
  }

  /* ---------------- DELETE MESSAGE MEDIA ---------------- */
  if (message.media?.publicId) {
    try {
      await cloudinary.uploader.destroy(message.media.publicId, {
        resource_type: message.media.mimeType?.startsWith("image")
          ? "image"
          : "raw",
      });
    } catch (err) {
      console.error("Message media deletion failed:", err);
    }
  }

  /* ---------------- DELETE COMMENTS (CASCADE) ---------------- */
  const comments = await CommComment.find({ message: messageId });

  for (const c of comments) {
    if (c.media?.publicId) {
      try {
        await cloudinary.uploader.destroy(c.media.publicId, {
          resource_type: c.media.mimeType?.startsWith("image")
            ? "image"
            : "raw",
        });
      } catch (err) {
        console.error("Comment media deletion failed:", err);
      }
    }
  }

  // delete all comments in one go
  await CommComment.deleteMany({ message: messageId });

  /* ---------------- DELETE MESSAGE ---------------- */
  await MessageInComm.findByIdAndDelete(messageId);

  /* ---------------- SOCKET EVENT ---------------- */
  emitToCommunity(message.community.toString(), "community:message:deleted", {
    messageId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Message and its comments deleted"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const comment = await CommComment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  const membership = await CommunityMembership.findOne({
    community: comment.community,
    user: userId,
  });

  if (!membership) {
    throw new ApiError(403, "Not a community member");
  }

  const isAuthor = comment.author.toString() === userId.toString();
  const isAdmin = membership.role === "admin";

  // 🔥 Get message to check if user is message author
  const message = await MessageInComm.findById(comment.message);
  const isMessageAuthor =
    message && message.sender.toString() === userId.toString();

  if (!isAuthor && !isAdmin && !isMessageAuthor) {
    throw new ApiError(403, "Not allowed to delete this comment");
  }

  await CommComment.findByIdAndDelete(commentId);

  const updatedMessage = await MessageInComm.findByIdAndUpdate(
    comment.message,
    { $inc: { commentCount: -1 } },
    { new: true }
  ).select("_id commentCount community");

  emitToCommunity(comment.community.toString(), "community:comment:deleted", {
    commentId,
    messageId: comment.message,
  });
  // In deleteComment function, add this line after CommComment.findByIdAndDelete:
  emitToMessage(comment.message.toString(), "community:comment:deleted", {
    commentId,
    messageId: comment.message,
  });
  if (updatedMessage) {
    emitToCommunity(
      comment.community.toString(),
      "community:message:commentCount",
      {
        messageId: updatedMessage._id,
        commentCount: Math.max(0, updatedMessage.commentCount),
      }
    );
  }

  return res.status(200).json(new ApiResponse(200, {}, "Comment deleted"));
});

// export const toggleCommentHelpful = asyncHandler(async (req, res) => {
//   const { commentId } = req.params;
//   const userId = req.user._id;

//   const comment = await CommComment.findById(commentId).populate("author");
//   if (!comment) throw new ApiError(404, "Comment not found");

//   const exists = comment.helpful.some(
//     (h) => h.user.toString() === userId.toString()
//   );

//   if (exists) {
//     comment.helpful = comment.helpful.filter(
//       (h) => h.user.toString() !== userId.toString()
//     );
//     comment.helpfulCount--;

//     if (comment.author._id.toString() !== userId.toString()) {
//       await rollbackPointsForModel(
//         "CommComment",
//         commentId,
//         userId,
//         "comment_helpful_received"
//       );
//     }
//   } else {
//     comment.helpful.push({ user: userId });
//     comment.helpfulCount++;

//     if (comment.author._id.toString() !== userId.toString()) {
//       await awardPoints(comment.author._id, "comment_helpful_received", {
//         model: "CommComment",
//         modelId: commentId,
//         actorId: userId,
//       });

//       const notif = await sendNotification({
//         recipient: comment.author._id,
//         sender: userId,
//         type: "community_comment_upvote",
//         message: `${req.user.username} marked your comment as helpful`,
//         community: comment.community,
//         metadata: {
//           commentId,
//           messageId: comment.message,
//         },
//       });

//       emitToUser(comment.author._id, "notification", notif);
//     }
//   }

//   await comment.save();

//   emitToCommunity(comment.community.toString(), "community:comment:helpful", {
//     commentId,
//     helpfulCount: comment.helpfulCount,
//   });

//   return res
//     .status(200)
//     .json(new ApiResponse(200, { helpful: !exists }, "Helpful updated"));
// });

/**
 * PIN / UNPIN MESSAGE
 */
export const togglePinMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await MessageInComm.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  const user = await User.findById(userId);

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });

  if (!membership || !["admin", "moderator"].includes(membership.role)) {
    throw new ApiError(403, "Only admins or moderators can pin messages");
  }

  const community = await Community.findById(message.community);

  if (!Array.isArray(community.pinnedMessages)) {
    community.pinnedMessages = [];
  }

  const pinIndex = community.pinnedMessages.findIndex(
    (p) => p.message.toString() === messageId
  );

  // 🔁 TOGGLE LOGIC
  if (pinIndex !== -1) {
    // 🔓 UNPIN
    community.pinnedMessages.splice(pinIndex, 1);
    await community.save();

    await Activity.findOneAndDelete({
      community: message.community,
      type: "message_pinned",
      "payload.messageId": messageId,
    });

    emitToCommunity(
      message.community.toString(),
      "community:message:unpinned",
      {
        messageId,
        unpinnedBy: user.username,
      }
    );

    return res.status(200).json(new ApiResponse(200, {}, "Message unpinned"));
  }

  // 📌 PIN
  community.pinnedMessages.push({
    message: messageId,
    pinnedBy: userId,
    pinnedAt: new Date(),
  });

  await community.save();

  // 🔥 CREATE ACTIVITY
  await Activity.create({
    community: message.community,
    actor: userId,
    type: "message_pinned",
    payload: {
      messageId,
      content: message.content, // optional but useful for UI
    },
    createdAt: new Date(),
  });

  emitToCommunity(message.community.toString(), "community:message:pinned", {
    messageId,
    pinnedBy: user.username,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Message pinned"));
});

/**
 * VOTE ON POLL
 */
export const voteOnPoll = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { optionIds } = req.body;
  const userId = req.user._id;

  if (!Array.isArray(optionIds) || !optionIds.length)
    throw new ApiError(400, "Select at least one option");

  const message = await MessageInComm.findById(messageId);
  if (!message || !message.poll) throw new ApiError(404, "Poll not found");

  const membership = await CommunityMembership.findOne({
    community: message.community,
    user: userId,
  });
  if (!membership) throw new ApiError(403, "Only members can vote");

  if (message.poll.expiresAt && new Date() > message.poll.expiresAt)
    throw new ApiError(400, "Poll expired");

  const numeric = optionIds.map((n) => parseInt(n));

  // 🔥 ALWAYS REMOVE PREVIOUS VOTES FIRST (allows changing vote)
  message.poll.options.forEach((o) => {
    o.votes = (o.votes || []).filter((v) => v.toString() !== userId.toString());
  });

  // 🔥 ADD NEW VOTES
  // For single-vote polls: only first option will be added
  // For multi-vote polls: all selected options will be added
  const votesToAdd = message.poll.allowMultipleVotes ? numeric : [numeric[0]]; // Only take first selection for single-vote polls

  votesToAdd.forEach((id) => {
    const option = message.poll.options.find((o) => o.id === id);
    if (option) {
      option.votes.push(userId);
    }
  });

  // 🔥 CALCULATE UNIQUE VOTERS
  const uniqueVoters = new Set();
  message.poll.options.forEach((o) => {
    (o.votes || []).forEach((v) => uniqueVoters.add(v.toString()));
  });
  message.poll.totalVotes = uniqueVoters.size;

  message.markModified("poll");
  await message.save();

  // 🔥 UPDATE COMMUNITY ACTIVITY
  await Community.findByIdAndUpdate(
    message.community,
    { lastActivityAt: new Date() },
    { new: true }
  );

  emitToCommunity(message.community.toString(), "community:poll:updated", {
    messageId,
    poll: message.poll,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, message.poll, "Vote recorded"));
});

/**
 * MARK MESSAGE SEEN
 */
export const markMessageSeen = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const msg = await MessageInComm.findById(messageId);
  if (!msg) throw new ApiError(404, "Message not found");

  const isSeen = msg.seenBy.some(
    (s) => s.user.toString() === userId.toString()
  );
  if (!isSeen) {
    msg.seenBy.push({ user: userId, seenAt: new Date() });
    await msg.save();
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Message marked as seen"));
});

/**
 * REPORT MESSAGE
 */
export const reportMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const valid = ["spam", "inappropriate", "harassment", "fake", "other"];
  if (!valid.includes(reason)) throw new ApiError(400, "Invalid reason");

  const msg = await MessageInComm.findById(messageId);
  if (!msg) throw new ApiError(404, "Message not found");

  const membership = await CommunityMembership.findOne({
    community: msg.community,
    user: userId,
  });
  if (!membership) throw new ApiError(403, "Only members can report");

  const exists = msg.reports.some((r) => r.by.toString() === userId.toString());
  if (exists) throw new ApiError(409, "Already reported");

  msg.reports.push({ reason, by: userId });
  await msg.save();

  // notify admins if >=3 reports
  if (msg.reports.length >= 3) {
    const admins = await CommunityMembership.find({
      community: msg.community,
      role: "admin",
    }).select("user");

    admins.forEach((admin) => {
      emitToUser(admin.user.toString(), "community:message:reported", {
        messageId,
        reportCount: msg.reports.length,
      });
    });
  }

  return res.status(200).json(new ApiResponse(200, {}, "Message reported"));
});

export const markAllAsSeen = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    throw new ApiError(400, "Invalid community id");
  }

  // optional: verify membership
  const member = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!member) {
    throw new ApiError(403, "Not a community member");
  }

  // Mark unseen notifications related to this community as seen
  await Notification.updateMany(
    {
      recipient: userId,
      community: communityId,
      isSeen: false,
    },
    { $set: { isSeen: true } }
  );

  // 🔔 socket → only to user
  emitToUser(userId.toString(), "community:seen", {
    communityId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "All messages marked as seen"));
});

export const getPinnedMessage = asyncHandler(async (req, res) => {
  const { communityId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    throw new ApiError(400, "Invalid community id");
  }

  const community = await Community.findById(communityId)
    .select("pinnedMessage")
    .populate({
      path: "pinnedMessage.message",
      populate: { path: "sender", select: "username profilePicture" },
    })
    .populate("pinnedMessage.pinnedBy", "username profilePicture")
    .lean();

  if (!community || !community.pinnedMessage?.message) {
    return res
      .status(200)
      .json(new ApiResponse(200, { pinnedMessage: null }, "No pinned message"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { pinnedMessage: community.pinnedMessage },
        "Pinned message fetched"
      )
    );
});

export const getMyHelpfulMessages = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const userId = req.user._id;

  const member = await CommunityMembership.findOne({
    community: communityId,
    user: userId,
  });

  if (!member) {
    throw new ApiError(403, "Not a community member");
  }

  const messages = await MessageInComm.find({
    community: communityId,
    "helpful.user": userId,
  })
    .sort({ createdAt: -1 }) // newest helpful first
    .populate("sender", "username profilePicture")
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, { messages }, "Helpful messages fetched"));
});
