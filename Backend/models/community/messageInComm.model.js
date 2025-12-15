import mongoose, { Schema } from "mongoose";

const commMessageSchema = new Schema(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["text", "image", "gif", "document", "poll"],
      default: "text",
    },

    content: { type: String, default: "" },

    media: {
      url: String,
      publicId: String,
      mimeType: String,
      originalName: String,

      uploadState: {
        type: String,
        enum: ["uploading", "uploaded", "failed"],
        default: "uploaded",
      },
    },

    // Poll embedded
    poll: {
      question: { type: String },
      options: [
        {
          id: { type: Number },
          text: { type: String },
          votes: [{ type: Schema.Types.ObjectId, ref: "User" }],
        },
      ],
      allowMultipleVotes: { type: Boolean, default: false },
      createdBy: { type: Schema.Types.ObjectId, ref: "User" },
      expiresAt: { type: Date },
      totalVotes: { type: Number, default: 0 },
    },

    // Reply reference with preview (like WhatsApp)
    replyTo: {
      messageId: { type: Schema.Types.ObjectId, ref: "MessageInComm" },
      senderName: { type: String },
      content: { type: String }, // First 100 characters
      type: { type: String }, // "text", "image", "gif", etc.
      media: {
        url: String, // Only for image/gif preview
      },
    },

    // Textual sender identity for display
    senderDisplayName: { type: String },
    senderDisplayProfile: { type: String },

    seenBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        seenAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    reactions: [
      {
        emoji: { type: String, required: true },
        by: { type: Schema.Types.ObjectId, ref: "User", required: true },
        _id: false,
      },
    ],

    helpful: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        _id: false,
      },
    ],

    helpfulCount: {
      type: Number,
      default: 0,
      index: true,
    },
    commentCount: {
      type: Number,
      default: 0,
      index: true,
    },

    reports: [
      {
        reason: {
          type: String,
          enum: ["spam", "inappropriate", "harassment", "fake", "other"],
        },
        by: { type: Schema.Types.ObjectId, ref: "User" },
        _id: false,
      },
    ],

    // Mentions
    mentions: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        context: { type: String },
        _id: false,
      },
    ],

    // AI analysis (optional)
    ai: {
      sentiment: { type: Number, default: 0 },
      keywords: [{ type: String }],
      topic: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

// MessageInComm schema
commMessageSchema.index({ community: 1, createdAt: -1 });
commMessageSchema.index({ community: 1, commentCount: -1 });
commMessageSchema.index({ community: 1, helpfulCount: -1 });
commMessageSchema.index({ community: 1, "helpful.user": 1, createdAt: -1 });

export const MessageInComm = mongoose.model("MessageInComm", commMessageSchema);
