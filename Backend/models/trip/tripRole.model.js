import mongoose, { Schema } from "mongoose";

const tripRoleSchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: "Trip", required: true },

    roleName: {
      type: String,
      enum: [
        "Captain",
        "Cameraman",
        "Cook",
        "Navigator",
        "Accountant",
        "Planner",
      ],
      required: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  { timestamps: true }
);

tripRoleSchema.index({ trip: 1, assignedTo: 1, roleName: 1 }, { unique: true });

export const TripRole = mongoose.model("TripRole", tripRoleSchema);
