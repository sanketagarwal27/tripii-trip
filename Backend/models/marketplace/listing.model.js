import mongoose, { Schema } from "mongoose";

const ListingSchema = new Schema(
  {
    /* =========================
       OWNERSHIP
    ========================== */
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    businessListingId: {
      type: Schema.Types.ObjectId,
      ref: "BusinessListing",
      required: true,
      index: true,
    },

    /* =========================
       TYPE
    ========================== */
    listingType: {
      type: String,
      enum: [
        "hostel",
        "hotel",
        "homestay",
        "restaurant",
        "cafe",
        "local_guide",
        "activity",
        "transport",
        "travel_agency",
        "resort",
      ],
      required: true,
      index: true,
    },

    /* =========================
       BASIC DISPLAY INFO
    ========================== */
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    /* =========================
       LOCATION (SEARCH & MAP)
    ========================== */
    address: {
      city: String,
      state: String,
      country: { type: String, default: "India" },
    },

    geoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    /* =========================
       PRICING
    ========================== */
    priceRange: {
      min: Number,
      max: Number,
    },

    /* =========================
       MEDIA
    ========================== */
    media: {
      coverImage: String,
      gallery: [String],
      videoUrl: String,
    },

    /* =========================
       AMENITIES / FEATURES
    ========================== */
    amenities: [String],

    /* =========================
       SERVICE / PROPERTY DATA
    ========================== */
    capacity: {
      rooms: Number,
      beds: Number,
      seats: Number,
      maxGroupSize: Number,
    },

    operatingHours: {
      openingTime: String,
      closingTime: String,
    },

    /* =========================
       TRUST & PAYOUT
    ========================== */
    verificationTier: {
      type: String,
      enum: ["basic", "verified"],
      default: "basic",
    },

    payoutStatus: {
      type: String,
      enum: ["disabled", "pending_bank", "active", "on_hold"],
      default: "pending_bank",
      index: true,
    },

    /* =========================
       VISIBILITY CONTROL
    ========================== */
    isLive: { type: Boolean, default: false },
    isBookable: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    priorityScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ListingSchema.index({ geoLocation: "2dsphere" });

export const Listing = mongoose.model("Listing", ListingSchema);
