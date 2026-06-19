import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user/user.model.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { AdminOtp } from "../../models/user/adminOtp.model.js";
import sendEmail from "../../utils/sendEmail.js";

export const requestOtp = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // 1. Validations
  const targetUser = await User.findById(userId);
  if (!targetUser) throw new ApiError(404, "User not found");

  if (targetUser.role === "admin") {
    throw new ApiError(400, "User is already an admin");
  }

  // 2. Generate OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // 3. Hash OTP and save to DB
  await AdminOtp.deleteMany({ adminId: req.user._id });

  const hashedOtp = await bcrypt.hash(otp, 10);
  await AdminOtp.create({
    adminId: req.user._id,
    targetUserId: userId,
    otpCode: hashedOtp,
  });
  // 4. Send OTP via Email
  await sendEmail({
    email: req.user.email, // Send to the logged-in Admin
    subject: "Admin Promotion Verification",
    message: `
      <p>Hello Admin,</p>
      <p>You have initiated a request for management of <strong>@${targetUser.username}</strong>'s id.</p>
      <p>Please use the following One-Time Password (OTP) to verify this action:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">
          ${otp}
        </span>
      </div>

      <p>This code is valid for <strong>5 minutes</strong>. If you did not request this, please secure your account immediately.</p>
    `,
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: req.user.email },
        "OTP sent successfully to your email"
      )
    );
});

export const promoteUserToAdmin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { otp } = req.body;

  if (!otp) throw new ApiError(400, "OTP is required");

  // 1. Find the OTP Record
  const otpRecord = await AdminOtp.findOne({
    adminId: req.user._id,
    targetUserId: userId,
  });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const isOtpValid = await bcrypt.compare(otp, otpRecord.otpCode);
  if (!isOtpValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // 2. Perform the Promotion
  const userToPromote = await User.findById(userId);
  if (!userToPromote) throw new ApiError(404, "User not found");

  userToPromote.role = "admin";
  await userToPromote.save();

  // 3. Cleanup: Delete the used OTP
  await AdminOtp.findByIdAndDelete(otpRecord._id);

  res
    .status(200)
    .json(
      new ApiResponse(200, userToPromote, "User successfully promoted to Admin")
    );
});

// export const manuallyVerifyUser = asyncHandler(async (req, res) => {
//   const { userId } = req.params;

//   const user = await User.findById(userId);
//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }
// });

export const toggleUserBan = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);

  if (!user) {
    throw new ApiError(404, "User Not found");
  }

  if (user.role === "admin") {
    throw new ApiError(400, "Cannot ban an admin user");
  }

  // Toggle ban
  if (user.accountStatus !== "banned") {
    user.accountStatus = "banned";
    await sendEmail({
      email: user.email,
      subject: "Account Suspension Notice",
      message: `<p>Dear @${user.username},</p><p>Your account has been suspended due to violations of our community guidelines. If you believe this is a mistake, please contact our support team.</p>`,
    });
  } else {
    user.accountStatus = "active";
    await sendEmail({
      email: user.email,
      subject: "Account Reactivation Notice",
      message: `<p>Dear @${user.username},</p><p>Your account has been reactivated. Please ensure to adhere to our community guidelines to avoid future suspensions. We are sorry for any inconvenience.</p>`,
    });
  }

  user.tokenVersion += 1;

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        `User ${user.name} was ${
          user.accountStatus === "banned" ? "banned" : "activated"
        }. All active sessions revoked.`
      )
    );
});

// Pending -> Add removing all images or profile picture of the user from cloudinary
export const permanentDeleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const otp = req.body.otp;
  if (!otp) {
    throw new ApiError(400, "OTP is required for permanent deletion");
  }
  // 1. Find the OTP Record
  const otpRecord = await AdminOtp.findOne({
    adminId: req.user._id,
    targetUserId: userId,
  });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  const isOtpValid = await bcrypt.compare(otp, otpRecord.otpCode);
  if (!isOtpValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  // 2. Perform Deletion
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User Not found");
  }

  if (user.role === "admin") {
    throw new ApiError(400, "Cannot delete an admin user");
  }

  // Permanently delete the user
  await user.deleteOne();

  // Cleanup: Delete the used OTP
  await AdminOtp.findByIdAndDelete(otpRecord._id);

  await sendEmail({
    email: user.email,
    subject: "Account Deletion Confirmation",
    message: `<p>Dear @${user.username},</p><p>Your account has been permanently deleted from our system for several violations.</p>`,
  });
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        `User ${user.name} was permanently deleted from the system.`
      )
    );
});

export const sendWarning = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { subject, message } = req.body;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User Not found");
  }

  if (!subject || !message) {
    throw new ApiError(
      400,
      "Subject and message are required to send a warning"
    );
  }

  if (user.role === "admin") {
    throw new ApiError(400, "Cannot send warning to an admin user");
  }

  await sendEmail({
    email: user.email,
    subject: subject,
    message: `<p>Warning: Dear @${user.username},</p><p>${message}</p>`,
  });
  res
    .status(200)
    .json(new ApiResponse(200, null, `Warning email sent to ${user.name}`));
});

export const getUserStats = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments();
  const bannedUserCount = await User.countDocuments({
    accountStatus: "banned",
  });
  const newUsersTodayCount = await User.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999)),
    },
  });
  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers: userCount,
        bannedUsers: bannedUserCount,
        newUsersToday: newUsersTodayCount,
      },
      "User count fetched"
    )
  );
});
