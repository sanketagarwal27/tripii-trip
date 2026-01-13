import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
  addComment,
  createNormalPost,
  createTripPost,
  deleteComment,
  deletePost,
  getCommentsByPost,
  getContextualPostLikes,
  getFeedPosts,
  getPostById,
  toggleBookmark,
  toggleCommentLike,
  toggleLike,
} from "../controllers/user/post.controller.js";

const router = express.Router();

router.use(verifyJWT);

router.post(
  "/createPost",
  upload.array("media"), // REQUIRED
  createNormalPost
);

router.post(
  "/createTripPost",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "media", maxCount: 20 },
  ]),
  createTripPost
);

router.post("/like/:postId", toggleLike);
router.post("/comment/:postId", addComment);
router.get("/comment/:postId", getCommentsByPost);
router.delete("/deletePost/:postId", deletePost);
router.get("/getPosts", getFeedPosts);
router.get("/getPost/:postId", getPostById);
router.post("/bookMark/:postId", toggleBookmark);
router.post("/comment/like/:commentId", toggleCommentLike);
router.delete("/comment/delete/:commentId", deleteComment);
router.get(
  "/:postId/likes/contextual-likes",
  verifyJWT,
  getContextualPostLikes
);

export default router;
