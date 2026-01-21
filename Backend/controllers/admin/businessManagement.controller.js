// controllers/admin/businessManagement.controller.js

import { Listing } from "../../models/marketplace/listing.model.js";
import { BusinessListing } from "../../models/marketplace/propertyForm.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendEmail from "../../utils/sendEmail.js";
import { runBusinessDuplicateCheck } from "../../jobs/duplicateCheck.business.job.js";

const getLatLngFromBusiness = (business) => {
  // Convert to plain JS object to bypass Mongoose getters/virtuals
  const bizObj = business.toObject ? business.toObject() : business;
  const geo = bizObj?.address?.geoLocation;

  // const a = geo?.lat;
  // const b = geo?.lng;

  // console.log("🧭 GEO RAW LAT LNG:", { a, b });

  // console.log("🧭 RAW GEO FROM OBJ:", geo);

  let lat = null;
  let lng = null;

  // 1. Check for GeoJSON coordinates array [lng, lat]
  if (Array.isArray(geo?.coordinates) && geo.coordinates.length >= 2) {
    lng = geo.coordinates[0];
    lat = geo.coordinates[1];
  }

  // 2. Check for flat properties (lat/lng or latitude/longitude)
  // We check this even if the above failed
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    lat = geo?.lat ?? geo?.latitude;
    lng = geo?.lng ?? geo?.longitude;
  }

  // 3. Fallback: Check if the coordinates are strings and convert them
  if (typeof lat === "string") lat = parseFloat(lat);
  if (typeof lng === "string") lng = parseFloat(lng);

  console.log("🧭 RESOLVED:", { lat, lng });

  // 🚨 FINAL VALIDATION
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(
      400,
      `Location error: Received lat:${lat}, lng:${lng}. Check if these fields exist in your BusinessListing schema.`
    );
  }

  return { lat, lng };
};

export const approveBusinessListing = asyncHandler(async (req, res) => {
  const { businessListingId } = req.params;

  const business = await BusinessListing.findById(businessListingId);
  if (!business) throw new ApiError(404, "Business listing not found");

  // 1. Get the resolved coordinates
  const { lat, lng } = getLatLngFromBusiness(business);

  // 2. FIX: Standardize the business document structure before saving
  // This satisfies the "coordinates is required" validation error
  business.address.geoLocation = {
    type: "Point",
    coordinates: [lng, lat], // [Longitude, Latitude] per GeoJSON spec
  };

  // Run duplicate check
  const duplicateResult = await runBusinessDuplicateCheck({
    businessListingId: business._id,
    businessName: business.businessName,
    listingFor: business.listingFor,
    phone: business.owner.phone,
    lat,
    lng,
  });

  if (duplicateResult.status === "confirmed") {
    throw new ApiError(
      400,
      "Cannot approve: High confidence duplicate detected. Please review manually."
    );
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(
      500,
      "Internal error: resolved coordinates are invalid."
    );
  }

  // Create public Listing
  const listing = await Listing.create({
    ownerId: business.userId,
    businessListingId: business._id,
    listingType: business.listingFor.toLowerCase().replace(/ /g, "_"),
    title: business.businessName,
    description: business.operations?.description,

    address: {
      city: business.address.city,
      state: business.address.state,
      country: business.address.country,
    },

    geoLocation: {
      type: "Point",
      coordinates: [lng, lat],
    },

    media: {
      coverImage: business.media.coverImage,
      gallery: [
        ...(business.media.exteriorPhotos || []),
        ...(business.media.interiorPhotos || []),
        ...(business.media.roomsOrDiningPhotos || []),
      ],
      videoUrl: business.media.videoWalkthroughUrl,
    },

    amenities: business.operations?.amenities || [],

    capacity: {
      rooms: business.operations?.numberOfRooms,
      beds: business.operations?.numberOfBeds,
      seats: business.operations?.seatingCapacity,
      maxGroupSize: business.serviceDetails?.maxGroupSize,
    },

    operatingHours: {
      openingTime: business.operations?.openingTime,
      closingTime: business.operations?.closingTime,
    },

    priceRange: business.operations?.priceRange,

    isLive: true,
    isBookable: true,
    verificationTier: "verified",
  });

  business.verification.status = "verified";
  business.verification.verifiedAt = new Date();
  business.verification.manuallyReviewedBy = req.user._id;
  business.isLive = true;
  await business.save();

  // Send approval email
  await sendEmail({
    email: business.owner.email,
    subject: "🎉 Your Business Listing is Approved!",
    message: `
      Dear ${business.owner.fullName},
      
      Congratulations! Your business listing "${business.businessName}" has been approved and is now live on our platform.
      
      You can start managing your listing and accepting bookings.
      
      Thank you for partnering with us!
      
      Best regards,
      Admin Team
    `,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { listing, business },
        "Business approved and listing created"
      )
    );
});

export const rejectBusinessListing = asyncHandler(async (req, res) => {
  const { businessListingId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new ApiError(400, "Rejection reason is required");
  }

  const business = await BusinessListing.findById(businessListingId);
  if (!business) throw new ApiError(404, "Business listing not found");

  business.verification.status = "rejected";
  business.verification.rejectionReason = reason;
  business.verification.manuallyReviewedBy = req.user._id;
  await business.save();

  // Send rejection email
  await sendEmail({
    email: business.owner.email,
    subject: "Business Listing Review Update",
    message: `
      Dear ${business.owner.fullName},
      
      After careful review, we regret to inform you that your business listing "${business.businessName}" could not be approved at this time.
      
      Reason: ${reason}
      
      If you believe this is an error or would like to resubmit with corrections, please contact our support team.
      
      Best regards,
      Admin Team
    `,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, business, "Business listing rejected"));
});

export const pendingWithEmail = asyncHandler(async (req, res) => {
  const { businessListingId } = req.params;
  const { subject, message } = req.body;

  if (!subject || !message) {
    throw new ApiError(400, "Subject and message are required");
  }

  const business = await BusinessListing.findById(businessListingId);
  if (!business) throw new ApiError(404, "Business listing not found");

  business.verification.status = "under_review";
  business.verification.manuallyReviewedBy = req.user._id;
  await business.save();

  await sendEmail({
    email: business.owner.email,
    subject,
    message: `
      Dear ${business.owner.fullName},
      
      ${message}
      
      Your listing status has been updated to "Under Review". Please take the necessary actions and we'll review your submission again.
      
      Best regards,
      Admin Team
    `,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, business, "Business marked pending and email sent")
    );
});

export const getAllBusinessListingsForAdmin = asyncHandler(async (req, res) => {
  const { status, listingFor, search } = req.query;

  const filter = {};

  if (status) {
    filter["verification.status"] = status;
  }

  if (listingFor) {
    filter.listingFor = listingFor;
  }

  if (search) {
    filter.$or = [
      { businessName: { $regex: search, $options: "i" } },
      { "owner.phone": { $regex: search, $options: "i" } },
      { "owner.email": { $regex: search, $options: "i" } },
    ];
  }

  const listings = await BusinessListing.find(filter).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, listings, "Business listings fetched for admin")
    );
});

export const getBusinessListingByIdForAdmin = asyncHandler(async (req, res) => {
  const { businessListingId } = req.params;

  const listing = await BusinessListing.findById(businessListingId);

  if (!listing) {
    throw new ApiError(404, "Business listing not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, listing, "Business listing details fetched"));
});

export const getPendingBusinessListings = asyncHandler(async (req, res) => {
  const listings = await BusinessListing.find({
    "verification.status": { $in: ["pending", "under_review"] },
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, listings, "Pending business listings fetched"));
});

// Run duplicate check on existing listing
export const runDuplicateCheckManually = asyncHandler(async (req, res) => {
  const { businessListingId } = req.params;

  const business = await BusinessListing.findById(businessListingId);
  if (!business) throw new ApiError(404, "Business listing not found");

  const { lat, lng } = getLatLngFromBusiness(business);

  const duplicateResult = await runBusinessDuplicateCheck({
    businessListingId: business._id,
    businessName: business.businessName,
    listingFor: business.listingFor,
    phone: business.owner.phone,
    lat,
    lng,
  });

  business.duplicateCheck = result;
  await business.save();

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Duplicate check completed"));
});
