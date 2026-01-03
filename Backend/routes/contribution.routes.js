import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addContribution,
  getUserContributions,
  uploadImages,
} from "../controllers/contribution/contribution.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/add").post(verifyJWT, addContribution);
router
  .route("/upload-photos")
  .post(verifyJWT, upload.array("photos", 5), uploadImages);

router.route("/get").get(verifyJWT, getUserContributions);
// router.route("/get-drafts").get(verifyJWT, getDrafts);
// router.route("/get-submitted").get(verifyJWT, getSubmittedContributions);
export default router;
