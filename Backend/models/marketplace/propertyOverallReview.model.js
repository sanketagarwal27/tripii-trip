import mongoose, { Schema } from "mongoose";

const ListingStatsSchema = new Schema({
  listingId: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    unique: true,
  },

  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  totalBookings: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
});

export const ListingStats = mongoose.model("ListingStats", ListingStatsSchema);
