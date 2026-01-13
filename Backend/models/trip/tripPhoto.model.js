import mongoose, { Schema } from "mongoose";

const tripPhotoSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },

    image: {
      url: String,
      publicId: String,
    },

    caption: String,

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    location: {
      name: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    /* 🔑 VISIBILITY CONTROL */
    visibility: {
      type: String,
      enum: ["local", "global"],
      default: "local",
      index: true,
    },

    /* ❤️ LIKE SYSTEM (COUNT ONLY) */
    likesCount: {
      type: Number,
      default: 0,
    },

    /* ⬇️ DOWNLOAD CONTROL */
    allowDownload: {
      type: Boolean,
      default: true,
    },

    autoPosted: {
      type: Boolean,
      default: false,
    },

    downloadCount: {
      type: Number,
      default: 0,
    },

    downloadHistory: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        downloadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export const TripPhoto = mongoose.model("TripPhoto", tripPhotoSchema);

// trip wallet jaisa ye koi ek place nhi h , jitna photo hoga ye utna hoga (jis sab ka trip me trip id hoga , ye expense ke jaisa h , ye photo submit krte time bnta h , but wallet nhi bnta expense ke time , expense ke time bs expense bnta h.)
