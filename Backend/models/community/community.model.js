import mongoose, { Schema } from "mongoose";

const TAGS = [
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

const communitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    rules: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        order: { type: Number, default: 0 },
      },
    ],

    tags: {
      type: [String],
      enum: TAGS,
      default: [],
    },

    backgroundImage: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },

    type: {
      type: String,
      enum: ["private_group", "public_group", "regional_hub", "global_hub"],
      default: "public_group",
    },

    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // membership refs (CommunityMembership docs)
    members: [{ type: Schema.Types.ObjectId, ref: "CommunityMembership" }],

    // rooms and trips can be referenced for quick nav
    rooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
    // optional cached pointer to recent trips (ids)
    featuredTrips: [{ type: Schema.Types.ObjectId, ref: "Trip" }],

    // pinned message pattern remains
    pinnedMessages: [
      {
        message: {
          type: Schema.Types.ObjectId,
          ref: "MessageInComm",
          required: true,
        },
        pinnedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        pinnedAt: { type: Date, default: Date.now },
        locked: { type: Boolean, default: true }, // 🔥 IMMUTABLE PIN
        _id: false,
      },
    ],

    // community-specific settings (important)
    settings: {
      allowMembersToAdd: { type: Boolean, default: true }, // default everyone can add members
      allowMemberRooms: { type: Boolean, default: true }, // can members create rooms
    },

    // lightweight recent activities: if you want fast sidebar; keep limited by controller
    // alternatively use Activity collection (recommended for scale)
    recentActivities: [
      {
        actor: { type: Schema.Types.ObjectId, ref: "User" },
        type: { type: String }, // "post","poll","room_created","trip_created","member_added"
        payload: { type: Schema.Types.Mixed }, // store small object {postId, roomId, tripId, text}
        createdAt: { type: Date, default: Date.now },
      },
    ],

    memberCount: { type: Number, default: 1 }, // creator = 1
    roomsLast7DaysCount: { type: Number, default: 0 },

    // join requests etc remain
    joinRequests: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        message: { type: String },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        _id: false,
      },
    ],

    // delete vote fields kept
    deleteVoteStatus: {
      type: String,
      enum: ["inactive", "pending", "passed"],
      default: "inactive",
    },
    deleteCommInitiatedAt: { type: Date, default: null },
    deleteVote: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

communitySchema.index({ name: "text", description: "text", tags: "text" });

export const Community = mongoose.model("Community", communitySchema);
