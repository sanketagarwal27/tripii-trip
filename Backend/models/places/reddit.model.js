import mongoose, { Schema } from "mongoose";

const redditOpinionSchema = new Schema(
  {
    place: {
      type: String,
      required: true,
    },
    sentiment: {
      type: String,
      enum: ["positive", "negative", "mixed"],
    },
    positives: [String],
    negatives: [String],
    warnings: [String],
    tips: [String],
    postCount: Number,
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Reddit = mongoose.model("Reddit", redditOpinionSchema);
