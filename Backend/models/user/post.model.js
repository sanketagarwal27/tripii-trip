import mongoose, { Schema } from "mongoose";

/* ============================================================
   MEDIA SCHEMA  → supports images, GIFs, videos
============================================================ */
const mediaSchema = new Schema(
  {
    url: String,
    publicId: String,
    type: {
      type: String,
      enum: ["image", "gif", "video"],
      default: "image",
    },
  },
  { _id: false }
);

/* ============================================================
   VISITED PLACE SCHEMA
============================================================ */
const visitedPlaceSchema = new Schema(
  {
    placeId: {
      type: Schema.Types.ObjectId,
      ref: "FamousPlace",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, maxlength: 700 },
  },
  { _id: false }
);

const postSchema = new Schema(
  {
    /* ============================================================
       POST TYPE
    ============================================================ */
    type: {
      type: String,
      enum: ["normal", "trip"],
      required: true,
    },

    /* ============================================================
       NORMAL POST
    ============================================================ */
    caption: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    media: [mediaSchema], // multiple files → images, GIFs, videos

    /* ============================================================
       AUTHOR
    ============================================================ */
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],

    /* ============================================================
       TRIP POST (only applicable if type === "trip")
    ============================================================ */
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    tripMeta: {
      coverPhoto: {
        url: String,
        publicId: String,
      },

      selectedGalleryPhotos: [
        {
          type: Schema.Types.ObjectId,
          ref: "TripPhoto",
        },
      ],

      experience: { type: String, maxlength: 5000 }, // optional

      hiddenGems: [{ type: String, maxlength: 500 }], // optional

      planningSummary: {
        type: String,
        maxlength: 3000,
      }, // optional

      visitedPlaces: [visitedPlaceSchema], // mandatory rating

      famousPlaces: [
        {
          type: Schema.Types.ObjectId,
          ref: "FamousPlace",
        },
      ],

      expenseHistory: [
        {
          category: String,
          amount: Number,
          currency: { type: String, default: "INR" },
          description: String,
          _id: false,
        },
      ], // optional + anonymous version

      tripMembersSnapshot: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          username: String,
          profilePicture: String,
          _id: false,
        },
      ],

      scams: { type: String, maxlength: 5000 },
    },

    /* ============================================================
       ANALYTICS
    ============================================================ */
    analytics: {
      views: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
    },

    /* ============================================================
       AI
    ============================================================ */
    ai: {
      keywords: [{ type: String }],
      locationTags: [{ type: String }],
      summary: String,
      sentiment: { type: Number, default: 0, min: -1, max: 1 },

      searchVector: String, // embedding
    },
  },

  { timestamps: true }
);

postSchema.index({ type: 1 });
postSchema.index({ tripId: 1 });
postSchema.index({ author: 1 });

export const Post = mongoose.model("Post", postSchema);
