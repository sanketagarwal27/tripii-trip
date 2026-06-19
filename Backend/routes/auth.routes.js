import express from "express";
import { googleLogin } from "../controllers/user/auth.controller.js";

import {
  register,
  login,
  logout,
  getSuggestedUser,
  followOrUnfollow,
  searchUsersWithPagination,
  getProfile,
  editProfile,
  getCurrentUser,
} from "../controllers/user/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  userApiLimiter,
  profileEditLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.options("/login", (req, res) => res.sendStatus(204));

/* -------------------------------------------------------
   AUTH ROUTES — EXISTING (UNCHANGED)
---------------------------------------------------------*/
router.post("/google", userApiLimiter, googleLogin);

router.post("/send-otp", (req, res) => res.send("Disabled in MVP"));
router.post("/verify-otp", (req, res) => res.send("Disabled in MVP"));

router.post("/register", userApiLimiter, register);
router.post("/login", userApiLimiter, login);
router.post("/logout", verifyJWT, logout);

/* -------------------------------------------------------
   NEW USER SOCIAL ROUTES (ADDED)
---------------------------------------------------------*/

// ✓ follow / unfollow
router.post("/follow/:userId", verifyJWT, followOrUnfollow);

// ✓ suggested users
router.get("/suggested-users", verifyJWT, getSuggestedUser);

// ✓ search users with pagination
router.get("/search", verifyJWT, searchUsersWithPagination);

// ✓ get profile (public + private logic)
router.get("/profile/:_id", verifyJWT, getProfile);

// ✓ edit profile (requires multer for profile image)
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

router.put(
  "/edit-profile",
  verifyJWT,
  profileEditLimiter,
  upload.single("profilePicture"),
  editProfile
);

router.get("/me", verifyJWT, getCurrentUser);

export default router;
