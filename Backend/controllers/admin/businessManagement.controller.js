import { Listing } from "../../models/marketplace/listing.model.js";
import { BusinessListing } from "../../models/marketplace/propertyForm.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import sendEmail from "../../utils/sendEmail.js";

export const approveBusinessListing = asyncHandler(async (req, res) => {
  const { businessListingId } = req.params;

  const business = await BusinessListing.findById(businessListingId);
  if (!business) throw new ApiError(404, "Business listing not found");

  // Create public Listing
  const listing = await Listing.create({
    ownerId: business.userId,
    businessListingId: business._id,
    listingType: business.listingFor.toLowerCase(),
    title: business.businessName,
    description: business.operations?.description,

    address: {
      city: business.address.city,
      state: business.address.state,
      country: business.address.country,
    },

    geoLocation: {
      type: "Point",
      coordinates: [
        business.address.geoLocation.lng,
        business.address.geoLocation.lat,
      ],
    },

    media: {
      coverImage: business.media.coverImage,
      gallery: [
        ...(business.media.exteriorPhotos || []),
        ...(business.media.interiorPhotos || []),
      ],
    },

    isLive: true,
    isBookable: true,
    verificationTier: "verified",
  });

  business.verification.status = "verified";
  business.isLive = true;
  await business.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, listing, "Business approved and listing created")
    );
});

export const rejectBusinessListing = asyncHandler(async (req, res) => {
  const { businessListingId } = req.params;
  const { reason } = req.body;

  const business = await BusinessListing.findById(businessListingId);
  if (!business) throw new ApiError(404, "Business listing not found");

  business.verification.status = "rejected";
  business.verification.rejectionReason = reason;
  await business.save();

  res.status(200).json(new ApiResponse(200, null, "Business listing rejected"));
});

export const pendingWithEmail = asyncHandler(async (req, res) => {
  const { businessListingId } = req.params;
  const { subject, message } = req.body;

  const business = await BusinessListing.findById(businessListingId);
  if (!business) throw new ApiError(404, "Business listing not found");

  business.verification.status = "under_review";
  await business.save();

  await sendEmail({
    email: business.owner.email,
    subject,
    message, // admin-written message
  });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Business marked pending and email sent"));
});

export const getAllBusinessListingsForAdmin = asyncHandler(async (req, res) => {
  const {
    status, // pending | verified | rejected | under_review
    listingFor, // Hostel, Hotel, etc (optional filter)
    search, // businessName / phone / email
  } = req.query;

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

  const listings = await BusinessListing.find(filter)
    .sort({ createdAt: -1 })
    .select(
      "businessName listingFor owner address.city verification createdAt"
    );

  res
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

  res
    .status(200)
    .json(new ApiResponse(200, listing, "Business listing details fetched"));
});

export const getPendingBusinessListings = asyncHandler(async (req, res) => {
  const listings = await BusinessListing.find({
    "verification.status": { $in: ["pending", "under_review"] },
  })
    .sort({ createdAt: -1 })
    .select("businessName listingFor owner verification createdAt");

  res
    .status(200)
    .json(new ApiResponse(200, listings, "Pending business listings fetched"));
});
