// controllers/business.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import { BusinessListing } from "../models/BusinessListing.js";
import { enqueueRiskEvaluation } from "../jobs/queue.js";

export const submitBusinessListing = asyncHandler(async (req, res) => {
  const listing = await BusinessListing.create({
    userId: req.user._id,
    ...req.body,
    verification: { status: "pending" },
    isLive: false,
    isBookable: false,
  });

  await enqueueRiskEvaluation({ listingId: listing._id });

  res.status(201).json({
    success: true,
    message: "Submitted. Verification in progress.",
  });
});
