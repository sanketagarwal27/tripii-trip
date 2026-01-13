import { BusinessListing } from "../models/marketplace/propertyForm.model.js";

const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

export const runBusinessDuplicateCheck = async ({
  businessListingId,
  businessName,
  phone,
  lat,
  lng,
}) => {
  let score = 0;
  const matchedBusinessIds = [];

  const normalizedName = normalizeText(businessName);

  /* 1️⃣ PHONE MATCH (strongest) */
  if (phone) {
    const phoneMatches = await BusinessListing.find({
      "owner.phone": phone,
      _id: { $ne: businessListingId },
    }).select("_id");

    if (phoneMatches.length) {
      score += 50;
      phoneMatches.forEach((b) => matchedBusinessIds.push(b._id));
    }
  }

  /* 2️⃣ NAME + GEO (100m) */
  const nearbyBusinesses = await BusinessListing.find({
    _id: { $ne: businessListingId },
    "address.geoLocation": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: 100,
      },
    },
  });

  nearbyBusinesses.forEach((b) => {
    if (normalizeText(b.businessName) === normalizedName) {
      score += 30;
      matchedBusinessIds.push(b._id);
    }
  });

  /* 3️⃣ EXACT PIN (10m) */
  const exactPinMatches = await BusinessListing.find({
    _id: { $ne: businessListingId },
    "address.geoLocation": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        $maxDistance: 10,
      },
    },
  });

  if (exactPinMatches.length) {
    score += 40;
    exactPinMatches.forEach((b) => matchedBusinessIds.push(b._id));
  }

  return {
    status: score >= 60 ? "flagged" : "clear",
    score,
    matchedBusinessIds: [...new Set(matchedBusinessIds)],
  };
};
