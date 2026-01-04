import mongoose, { Schema } from "mongoose";

const SafetySchema = new Schema(
  {
    place: {
      type: String,
      required: true,
    },
    aiData: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true }
);

SafetySchema.index({ updatedAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const Safety = mongoose.model("Safety", SafetySchema);
