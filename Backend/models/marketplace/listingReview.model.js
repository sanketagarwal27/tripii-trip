import mongoose, { Schema } from "mongoose";

const ListingReviewSchema = new Schema(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: String,

    images: [String],

    isVerifiedBooking: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ListingReview = mongoose.model(
  "ListingReview",
  ListingReviewSchema
);
