import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    /* ------------------------------------------------------
       WHO RECEIVES THIS NOTIFICATION
    ------------------------------------------------------ */
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ------------------------------------------------------
       WHO TRIGGERED IT (optional: system notifications 
       like XP rewards won't have sender)
    ------------------------------------------------------ */
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    /* ------------------------------------------------------
       TYPE OF NOTIFICATION
    ------------------------------------------------------ */
    type: {
      type: String,
      enum: [
        // SOCIAL
        "like",
        "comment",
        "comment_like",
        "reply",
        "follow",
        "mention",

        // REELS
        "reel_like",
        "reel_comment",

        // COMMUNITY
        "community_post",
        "community_comment",
        "community_join",
        "room_added",

        // TRIPS
        "trip_invite",
        "trip_join_request",
        "trip_member_added",
        "trip_completed",

        // WALLET / PAYMENTS
        "expense_added",
        "settlement_requested",
        "payment_confirmed",
        "settlement_completed",

        // XP / TRUST
        "xp_reward",
        "trust_reward",
        "level_up",

        // SYSTEM
        "system_message",
      ],
      required: true,
    },

    /* ------------------------------------------------------
       GENERIC MESSAGE (always present)
    ------------------------------------------------------ */
    message: {
      type: String,
      required: true,
      trim: true,
    },

    /* ------------------------------------------------------
       OPTIONAL TARGET MODELS 
       (One notification can relate to only ONE of these)
    ------------------------------------------------------ */
    post: { type: Schema.Types.ObjectId, ref: "Post" },
    reel: { type: Schema.Types.ObjectId, ref: "Reels" },
    comment: { type: Schema.Types.ObjectId, ref: "Comment" },
    community: { type: Schema.Types.ObjectId, ref: "Community" },
    room: { type: Schema.Types.ObjectId, ref: "Room" },
    trip: { type: Schema.Types.ObjectId, ref: "Trip" },
    wallet: { type: Schema.Types.ObjectId, ref: "TripWallet" },
    settlement: { type: Schema.Types.ObjectId, ref: "Settlement" },

    /* ------------------------------------------------------
       METADATA (FLEXIBLE)
    ------------------------------------------------------ */
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    /* ------------------------------------------------------
       STATUS CONTROLS
    ------------------------------------------------------ */
    isRead: { type: Boolean, default: false },
    isSeen: { type: Boolean, default: false },

    /* ------------------------------------------------------
       IMPORTANT FOR REAL-TIME DELIVERY
    ------------------------------------------------------ */
    delivered: { type: Boolean, default: false }, // via socket
    clicked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ------------------------------------------------------
   ⚡ SUPER IMPORTANT INDEXES (FAST PERFORMANCE)
------------------------------------------------------ */
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
