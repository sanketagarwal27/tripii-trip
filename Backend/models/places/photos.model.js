// Creating it to save the photos to DB permanently
import mongoose, { Schema } from "mongoose";

const photoSchema = new Schema(
  {
    place: {
      type: String,
      required: true,
    },
    photos: [
      {
        raw_url: {
          type: String,
          required: true,
        },
        small_url: {
          type: String,
          required: true,
        },
        alt_description: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Photo = mongoose.model("Photo", photoSchema);
