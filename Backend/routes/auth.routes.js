import express from "express";
import multer from "multer";

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

const router = express.Router();

/* ================= AUTH ROUTES ================= */

router.post("/google", googleLogin);

router.post("/send-otp", (req, res) => res.send("Disabled in MVP"));
router.post("/verify-otp", (req, res) => res.send("Disabled in MVP"));

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWT, logout);

/* ================= SOCIAL ROUTES ================= */

router.post("/follow/:userId", verifyJWT, followOrUnfollow);
router.get("/suggested-users", verifyJWT, getSuggestedUser);
router.get("/search", verifyJWT, searchUsersWithPagination);
router.get("/profile/:_id", verifyJWT, getProfile);

/* ================= PROFILE ================= */

const upload = multer({ storage: multer.memoryStorage() });

router.put(
  "/edit-profile",
  verifyJWT,
  upload.single("profilePicture"),
  editProfile
);

router.get("/me", verifyJWT, getCurrentUser);

export default router;
