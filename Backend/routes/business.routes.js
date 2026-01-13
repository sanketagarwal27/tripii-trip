import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { submitBusinessListingForm } from "../controllers/Business/ListBusinessForm.controller.js";

const router = express.Router();

/**
 * All business listing routes require authentication
 */
router.use(verifyJWT);

/**
 * CREATE or UPDATE business listing form
 * - Multipart because media/images may be uploaded
 * - Handles both new submission & edit (via listingId)
 */
router.post(
  "/listingformsubmit",
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "exteriorPhotos", maxCount: 10 },
    { name: "interiorPhotos", maxCount: 10 },
    { name: "roomsOrDiningPhotos", maxCount: 10 },
    { name: "kitchenPhotos", maxCount: 10 },
    { name: "documents", maxCount: 10 }, // optional future use
  ]),
  submitBusinessListingForm
);

export default router;
