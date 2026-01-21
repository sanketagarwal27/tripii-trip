import { BusinessListing } from "../models/marketplace/propertyForm.model.js";
import { Listing } from "../models/marketplace/listing.model.js";

/* =========================
   UTILS
========================= */
const normalizeText = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

/* =========================
   DUPLICATE CHECK
========================= */
export const runBusinessDuplicateCheck = async ({
  businessListingId,
  businessName,
  listingFor,
  phone,
  lat,
  lng,
}) => {
  try {
    let score = 0;
    const matches = [];

    const normalizedName = normalizeText(businessName);

    /* =========================
       1️⃣ PHONE MATCH (ONCE ONLY)
       Strong but not decisive
       +40
    ========================= */
    if (phone) {
      const phoneMatches = await BusinessListing.find({
        "owner.phone": phone,
        _id: { $ne: businessListingId },
      }).select("_id businessName listingFor");

      if (phoneMatches.length > 0) {
        score += 40;

        phoneMatches.forEach((b) =>
          matches.push({
            id: b._id.toString(),
            type: "submission",
            reason: "same_phone",
            name: b.businessName,
            listingFor: b.listingFor,
          })
        );

        console.log(`📞 Phone match found: ${phoneMatches.length}`);
      }
    }

    /* =========================
       2️⃣ SAME NAME + SAME TYPE + NEAR GEO (100m)
       Strong signal
       +40
    ========================= */
    if (lat && lng) {
      const nearbySubmissions = await BusinessListing.find({
        _id: { $ne: businessListingId },
        listingFor,
        "address.geoLocation": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 100,
          },
        },
      }).select("_id businessName listingFor");

      nearbySubmissions.forEach((b) => {
        if (normalizeText(b.businessName) === normalizedName) {
          score += 40;
          matches.push({
            id: b._id.toString(),
            type: "submission",
            reason: "same_name_same_type_nearby",
            name: b.businessName,
            listingFor: b.listingFor,
          });

          console.log(`📍 Same name & type nearby: ${b.businessName}`);
        }
      });

      const nearbyListings = await Listing.find({
        listingType: listingFor.toLowerCase().replace(/ /g, "_"),
        geoLocation: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 100,
          },
        },
      }).select("_id title listingType");

      nearbyListings.forEach((l) => {
        if (normalizeText(l.title) === normalizedName) {
          score += 40;
          matches.push({
            id: l._id.toString(),
            type: "listing",
            reason: "same_name_same_type_nearby",
            name: l.title,
            listingFor: listingFor,
          });

          console.log(`📍 Same name & type in live listing: ${l.title}`);
        }
      });
    }

    /* =========================
       3️⃣ EXACT PIN (10m) + SAME TYPE
       Weak booster
       +20
    ========================= */
    if (lat && lng) {
      const exactPinMatches = await BusinessListing.find({
        _id: { $ne: businessListingId },
        listingFor,
        "address.geoLocation": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 10,
          },
        },
      }).select("_id businessName listingFor");

      if (exactPinMatches.length > 0) {
        score += 20;

        exactPinMatches.forEach((b) =>
          matches.push({
            id: b._id.toString(),
            type: "submission",
            reason: "exact_pin_same_type",
            name: b.businessName,
            listingFor: b.listingFor,
          })
        );

        console.log(
          `🎯 Exact pin match (same type): ${exactPinMatches.length}`
        );
      }
    }

    /* =========================
       4️⃣ DIFFERENT BUSINESS TYPE PENALTY
       Prevent false positives
       −40
    ========================= */
    const differentTypeMatches = matches.filter(
      (m) => m.listingFor && m.listingFor !== listingFor
    );

    if (differentTypeMatches.length > 0) {
      score -= 40;
      console.log("➖ Different business type penalty applied");
    }

    /* =========================
       FINAL SCORE NORMALIZATION
    ========================= */
    score = Math.max(0, Math.min(score, 100));

    let status = "clear";
    if (score >= 80) status = "confirmed";
    else if (score >= 50) status = "flagged";

    console.log(`🔍 Duplicate check result: ${status} (score: ${score})`);

    // Remove duplicate IDs
    const uniqueMatches = Array.from(
      new Map(matches.map((m) => [m.id, m])).values()
    );

    return {
      status,
      score,
      matchedListingIds: uniqueMatches,
    };
  } catch (error) {
    console.error("❌ Duplicate check error:", error);

    return {
      status: "clear",
      score: 0,
      matchedListingIds: [],
      error: error.message,
    };
  }
};
