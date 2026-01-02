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
    weatherData: {
      type: Object,
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
    lastSearched: {
      type: Date,
      default: Date.now,
    },
    dataRefreshedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

searchedPlacesSchema.index(
  { lastSearched: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

export const Place = mongoose.model("Place", searchedPlacesSchema);
