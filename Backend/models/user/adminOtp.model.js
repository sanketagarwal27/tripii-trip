// models/AdminOtp.js
import mongoose from "mongoose";

const adminOtpSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  otpCode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300,
  },
});

export const AdminOtp = mongoose.model("AdminOtp", adminOtpSchema);
