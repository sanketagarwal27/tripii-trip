import mongoose, { Schema } from "mongoose";

const overviewSchema = new Schema(
  {
    place: {
      type: String,
      required: true,
    },
    wikiData: {
      type: Object,
      required: true,
    },
    aiData: {
      type: Object,
      required: true,
    },
    lastSearched: {
      type: Number,
      required: true,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

export const Overview = mongoose.model("Overview", overviewSchema);
