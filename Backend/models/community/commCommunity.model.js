import mongoose, { Schema } from "mongoose";

const commCommentSchema = new Schema(
  {
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },

    message: {
      type: Schema.Types.ObjectId,
      ref: "MessageInComm",
      required: true,
      index: true,
    },

    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "CommComment",
      default: null,
      index: true,
    },

    depth: {
      type: Number,
      default: 1,
      max: 3, // 🔥 HARD LIMIT
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["text", "image", "gif"],
      default: "text",
    },

    media: {
      url: String,
      publicId: String,
      mimeType: String,
    },

    reactions: [
      {
        emoji: { type: String },
        by: { type: Schema.Types.ObjectId, ref: "User" },
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
  },
  { timestamps: true }
);

commCommentSchema.index({ message: 1, parentComment: 1 });

export const CommComment = mongoose.model("CommComment", commCommentSchema);
