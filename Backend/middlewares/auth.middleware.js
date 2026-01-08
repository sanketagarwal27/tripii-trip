import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1. Token Extraction
    let token = req.cookies?.accessToken;

    if (!token) {
      const authHeader = req.header("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.replace("Bearer ", "").trim();
      }
    }

    if (!token) {
      throw new ApiError(401, "Access token is required");
    }

    // 2. Verify Token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decodedToken || !decodedToken._id) {
      throw new ApiError(401, "Invalid token structure");
    }

    // 3. Find User
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "User not found - Invalid access token");
    }

    if (user.accountStatus === "banned") {
      const options = {
        httpOnly: true,
        secure: true,
      };
      res.clearCookie("accessToken", options);
      throw new ApiError(
        403,
        "Access denied. Your account has been suspended."
      );
    }

    // --- NEW: CHECK TOKEN VERSION ---
    if (decodedToken.tokenVersion !== user.tokenVersion) {
      throw new ApiError(401, "Session expired (Revoked). Please login again.");
    }

    // 4. Attach User to Request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid access token");
    } else if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired");
    } else if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(401, "Authentication failed");
    }
  }
});
