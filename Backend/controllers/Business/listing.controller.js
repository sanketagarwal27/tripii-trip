// // listing.controller.js
// import { Listing } from "../models/Listing.js";
// import { BusinessListing } from "../models/BusinessListing.js";

// /* =========================
//    UTILS
// ========================== */
// const normalizeText = (text = "") =>
//   text
//     .toLowerCase()
//     .replace(/[^a-z0-9]/g, "")
//     .trim();

// /* =========================
//    DUPLICATE CHECK LOGIC
// ========================== */
// const runDuplicateCheck = async ({
//   listingId,
//   title,
//   coordinates,
//   ownerPhone,
// }) => {
//   let score = 0;
//   const matchedListingIds = [];

//   const normalizedTitle = normalizeText(title);

//   /* ---- 1. GEO + TITLE MATCH (100m) ---- */
//   const nearbyListings = await Listing.find({
//     _id: { $ne: listingId },
//     geoLocation: {
//       $near: {
//         $geometry: {
//           type: "Point",
//           coordinates,
//         },
//         $maxDistance: 100,
//       },
//     },
//   }).limit(5);

//   for (const l of nearbyListings) {
//     if (normalizeText(l.title) === normalizedTitle) {
//       score += 30;
//       matchedListingIds.push(l._id);
//     }
//   }

//   /* ---- 2. EXACT PIN MATCH (10m) ---- */
//   const exactPinListings = await Listing.find({
//     _id: { $ne: listingId },
//     geoLocation: {
//       $near: {
//         $geometry: {
//           type: "Point",
//           coordinates,
//         },
//         $maxDistance: 10,
//       },
//     },
//   });

//   if (exactPinListings.length > 0) {
//     score += 40;
//     exactPinListings.forEach((l) => matchedListingIds.push(l._id));
//   }

//   /* ---- 3. PHONE NUMBER MATCH (via BusinessListing) ---- */
//   if (ownerPhone) {
//     const businessListings = await BusinessListing.find({
//       "owner.phone": ownerPhone,
//     }).select("_id");

//     if (businessListings.length > 0) {
//       score += 50;

//       const linkedListings = await Listing.find({
//         businessListingId: { $in: businessListings.map((b) => b._id) },
//         _id: { $ne: listingId },
//       });

//       linkedListings.forEach((l) => matchedListingIds.push(l._id));
//     }
//   }

//   /* ---- FINAL STATUS ---- */
//   const status = score >= 60 ? "flagged" : "clear";

//   return {
//     status,
//     score,
//     matchedListingIds: [...new Set(matchedListingIds)],
//   };
// };

// /* =========================
//    CREATE / UPDATE LISTING
// ========================== */
// export const submitListing = async (req, res) => {
//   try {
//     const ownerId = req.user._id;

//     const {
//       listingId, // optional (update)
//       businessListingId,
//       listingType,
//       title,
//       description,
//       address = {},
//       geoLocation,
//       priceRange,
//       media = {},
//       amenities,
//       capacity,
//       operatingHours,
//     } = req.body;

//     /* =========================
//        REQUIRED VALIDATIONS
//     ========================== */
//     if (!businessListingId) {
//       return res.status(400).json({ message: "businessListingId is required" });
//     }

//     if (!listingType || !title) {
//       return res
//         .status(400)
//         .json({ message: "listingType and title are required" });
//     }

//     if (
//       !geoLocation ||
//       !Array.isArray(geoLocation.coordinates) ||
//       geoLocation.coordinates.length !== 2
//     ) {
//       return res
//         .status(400)
//         .json({ message: "Valid geoLocation coordinates required" });
//     }

//     /* =========================
//        BUILD PAYLOAD
//     ========================== */
//     const payload = {
//       ownerId,
//       businessListingId,
//       listingType,
//       title,
//       description,

//       address: {
//         city: address.city,
//         state: address.state,
//         country: address.country || "India",
//       },

//       geoLocation: {
//         type: "Point",
//         coordinates: geoLocation.coordinates,
//       },

//       priceRange,
//       media,
//       amenities,
//       capacity,
//       operatingHours,
//     };

//     /* =========================
//        CREATE / UPDATE
//     ========================== */
//     let listing;

//     if (listingId) {
//       listing = await Listing.findOneAndUpdate(
//         { _id: listingId, ownerId },
//         payload,
//         { new: true, runValidators: true }
//       );
//     } else {
//       listing = await Listing.create(payload);
//     }

//     /* =========================
//        FETCH OWNER PHONE
//     ========================== */
//     const business = await BusinessListing.findById(businessListingId).select(
//       "owner.phone"
//     );

//     /* =========================
//        RUN DUPLICATE CHECK
//     ========================== */
//     const duplicateResult = await runDuplicateCheck({
//       listingId: listing._id,
//       title: listing.title,
//       coordinates: listing.geoLocation.coordinates,
//       ownerPhone: business?.owner?.phone,
//     });

//     listing.duplicateCheck = duplicateResult;
//     await listing.save();

//     return res.status(200).json({
//       success: true,
//       listingId: listing._id,
//       duplicateCheck: duplicateResult,
//       message:
//         duplicateResult.status === "flagged"
//           ? "Listing saved, possible duplicate detected"
//           : "Listing saved successfully",
//     });
//   } catch (error) {
//     console.error("Listing submit error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to submit listing",
//       error: error.message,
//     });
//   }
// };
