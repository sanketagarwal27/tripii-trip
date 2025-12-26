import mongoose, { Schema } from "mongoose";

const ROOM_TAGS = [
  "Adventure",
  "Backpacking",
  "Hiking",
  "Photography",
  "Food",
  "City",
  "State",
  "Friends",
  "Nature",
  "Sports",
  "Games",
  "Culture",
  "Tech",
  "Education",
  "Nightlife",
];

const roomSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    parentCommunity: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    roombackgroundImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["owner", "moderator", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],

    roomtype: {
      type: String,
      enum: ["Normal", "Trip"],
      required: true,
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    linkedTrip: { type: Schema.Types.ObjectId, ref: "Trip", default: null },

    isEphemeral: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    autoDeleteAfterEnd: { type: Boolean, default: true },

    messages: [{ type: Schema.Types.ObjectId, ref: "MessageInRoom" }],
    pinnedMessage: { type: Schema.Types.ObjectId, ref: "MessageInRoom" },

    // User-defined search tags
    roomTags: {
      type: [String],
      enum: ROOM_TAGS,
      default: [],
    },

    // Auto-managed status based on dates
    status: {
      type: String,
      enum: ["upcoming", "active", "finished", "cancelled"],
      default: "upcoming",
      index: true,
    },

    // External links attached to a room (drive, docs, map, etc.)
    externalLinks: [
      {
        name: {
          type: String,
          required: true, // e.g. "Itinerary", "Google Drive", "Bookings"
          trim: true,
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
        addedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
roomSchema.index({ parentCommunity: 1, createdAt: -1 });
roomSchema.index({ roomTags: 1 });
roomSchema.index({ status: 1, startDate: 1 });
roomSchema.index({ name: "text", description: "text" });
roomSchema.index({ parentCommunity: 1, status: 1, lastActivityAt: -1 });
roomSchema.index({ "members.user": 1 });

export const Room = mongoose.model("Room", roomSchema);
export { ROOM_TAGS };
