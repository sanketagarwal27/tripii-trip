import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
  {
    community: { type: Schema.Types.ObjectId, ref: "Community", index: true },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "poll",
        "room_created",
        "trip_created",
        "member_added",
        "member_joined",
        "member_removed",
        "community_created",
        "settings_updated",
        "community_left",
        "role_changed",
        "message_pinned",
      ],
      required: true,
    },
    payload: { type: Schema.Types.Mixed }, // { postId, roomId, tripId, text, etc }
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

activitySchema.index({ community: 1, createdAt: -1 });
export const Activity = mongoose.model("Activity", activitySchema);
