import mongoose, { Schema } from "mongoose";

const overviewSchema = new Schema(
  {
    place: {
      type: String,
      required: true,
    },
    lat: {
      type: String,
      required: true,
    },
    lon: {
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
    weatherData: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

overviewSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 21600 });

export const Overview = mongoose.model("Overview", overviewSchema);
