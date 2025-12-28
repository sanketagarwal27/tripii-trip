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
  },
  { timestamps: true }
);

export const Overview = mongoose.model("Overview", overviewSchema);
