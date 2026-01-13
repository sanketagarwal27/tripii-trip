// services/riskScore.service.js
import { verifyPAN } from "./pan.service.js";
import { verifyBank } from "./bank.service.js";
import { matchNames } from "../utils/nameMatch.js";

export const calculateRiskScore = async (listing) => {
  let score = 50;
  const reasons = [];

  const pan = await verifyPAN(listing.legalDocuments.panCardNumber);
  const bank = await verifyBank(listing.bankDetails);

  if (pan.valid) {
    score += 15;
    reasons.push("PAN valid");
  }

  const nameMatchScore = matchNames(pan.name, bank.accountName);
  if (nameMatchScore > 0.85) {
    score += 15;
    reasons.push("PAN & Bank name match");
  } else {
    score -= 25;
    reasons.push("PAN & Bank mismatch");
  }

  if (listing.media?.coverImage) score += 5;
  if (listing.media?.exteriorPhotos?.length >= 2) score += 5;

  if (
    ["Travel Package Agency", "Adventure Activity Provider"].includes(
      listing.listingFor
    )
  ) {
    score -= 15;
  }

  return { score, reasons };
};

// whole jobs is for risk evaluation queueing in after filling business listing form but currently not in use due to no verification requirements
