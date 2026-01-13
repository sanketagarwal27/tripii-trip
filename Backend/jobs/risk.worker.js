// jobs/risk.worker.js
import { Worker } from "bullmq";
import { BusinessListing } from "../models/BusinessListing.js";
import { calculateRiskScore } from "../services/riskScore.service.js";

new Worker(
  "risk-evaluation",
  async (job) => {
    const listing = await BusinessListing.findById(job.data.listingId);
    if (!listing) return;

    const result = await calculateRiskScore(listing);

    listing.verification.riskScore = result.score;
    listing.verification.reasons = result.reasons;

    if (result.score >= 75) {
      listing.verification.status = "verified";
      listing.isLive = true;
      listing.isBookable = true;
    } else if (result.score >= 50) {
      listing.verification.status = "under_review";
    } else {
      listing.verification.status = "rejected";
    }

    await listing.save();
  },
  { connection: new Redis(process.env.REDIS_URL) }
);

// whole jobs is for risk evaluation queueing in after filling business listing form but currently not in use due to no verification requirements
