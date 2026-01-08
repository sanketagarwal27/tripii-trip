import mongoose, { Schema } from "mongoose";

const tripActivitySchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    type: {
      type: String,
      enum: [
        "trip_created",
        "plan_added",
        "plan_updated",
        "checklist_added",
        "checklist_completed",
        "expense_added",
        "expense_updated",
        "expense_deleted",
        "photo_uploaded",
        "settlement_payer_confirmed",
        "settlement_receiver_confirmed",
        "settlement_completed",
        "trip_published_in_community",
        "member_joined",
        "member_left",
        "role_assigned",
        "role_completed",
      ],
    },

    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },

    targetId: { type: Schema.Types.ObjectId },
    targetModel: String,

    description: String,
  },
  { timestamps: true }
);

export const TripActivity = mongoose.model("TripActivity", tripActivitySchema);
