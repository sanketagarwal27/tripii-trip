import mongoose, { Schema } from "mongoose";

const searchedPlacesSchema = new Schema(
  {
    place: {
      type: String,
      required: true,
    },
    newsData: {
      //Storing the NewsAPI response
      type: Object,
      required: true,
    },
    heroImageUrl: {
      //Storing the Unsplash full image url
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

searchedPlacesSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 21600 });

export const Place = mongoose.model("Place", searchedPlacesSchema);
