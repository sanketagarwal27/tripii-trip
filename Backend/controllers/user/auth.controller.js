import { OAuth2Client } from "google-auth-library";
import { User } from "../../models/user/user.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { generateAccessAndRefreshToken } from "./user.controller.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = asyncHandler(async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account found. Please signup first to set a password.",
      });
    }

    if (!user.googleId) {
      user.googleId = googleId;
      user.authProviders.push({
        provider: "google",
        providerId: googleId,
      });
      await user.save();
    }

    // ✅ Use generateAccessAndRefreshToken helper
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    // ✅ Get fresh user profile
    const profile = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      })
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            user: profile, // ✅ NOW DEFINED
            accessToken,
            refreshToken,
          },
          "Login successful"
        )
      );
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Google login failed" });
  }
});
