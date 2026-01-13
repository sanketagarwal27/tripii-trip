// Backend/controllers/Business/ListBusinessForm.controller.js
import { runBusinessDuplicateCheck } from "../../jobs/duplicateCheck.business.job.js";
import { BusinessListing } from "../../models/marketplace/propertyForm.model.js";

/**
 * CREATE OR UPDATE FULL BUSINESS LISTING FORM
 * - Accepts partial or full payload
 * - Saves whatever is provided
 * - Fails only on schema-required fields
 */
export const submitBusinessListingForm = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      listingId, // optional (for update)
      listingFor,
      businessName,
      legalBusinessName,
      legalEntityType,
      yearEstablished,

      owner = {},
      address = {},
      legalDocuments = {},
      propertyAuthorization = {},
      bankDetails = {},
      media = {},
      operations = {},
      serviceDetails = {},
      onlinePresence = {},

      termsAccepted,
    } = req.body;

    /* =========================
       BASIC HARD VALIDATIONS
    ========================== */
    if (!listingFor) {
      return res.status(400).json({ message: "listingFor is required" });
    }

    if (!businessName) {
      return res.status(400).json({ message: "businessName is required" });
    }

    if (!owner.fullName || !owner.phone || !owner.email) {
      return res
        .status(400)
        .json({ message: "Owner name, phone and email are required" });
    }

    if (!owner.governmentId?.idType || !owner.governmentId?.idNumber) {
      return res
        .status(400)
        .json({ message: "Government ID type and number are required" });
    }

    if (
      !address.fullAddress ||
      !address.city ||
      !address.state ||
      !address.pincode
    ) {
      return res.status(400).json({ message: "Complete address is required" });
    }

    if (
      address.geoLocation?.lat === undefined ||
      address.geoLocation?.lng === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Map location (lat, lng) is required" });
    }

    if (!media.coverImage) {
      return res.status(400).json({ message: "Cover image is required" });
    }

    if (!onlinePresence.googleBusinessUrl) {
      return res
        .status(400)
        .json({ message: "Google Business URL is required" });
    }

    if (termsAccepted !== true) {
      return res
        .status(400)
        .json({ message: "You must accept terms and conditions" });
    }

    /* =========================
       BUILD SAFE PAYLOAD
    ========================== */
    const payload = {
      userId,
      listingFor,
      businessName,
      legalBusinessName,
      legalEntityType,
      yearEstablished,

      owner: {
        fullName: owner.fullName,
        role: owner.role || "owner",
        phone: owner.phone,
        email: owner.email,
        governmentId: {
          idType: owner.governmentId.idType,
          idNumber: owner.governmentId.idNumber,
          idDocumentUrl: owner.governmentId.idDocumentUrl,
          selfieUrl: owner.governmentId.selfieUrl,
        },
      },

      address: {
        fullAddress: address.fullAddress,
        city: address.city,
        state: address.state,
        country: address.country || "India",
        pincode: address.pincode,
        landmark: address.landmark,
        geoLocation: {
          lat: address.geoLocation.lat,
          lng: address.geoLocation.lng,
        },
        addressProofUrl: address.addressProofUrl,
      },

      legalDocuments,
      propertyAuthorization,
      bankDetails,

      media: {
        coverImage: media.coverImage,
        exteriorPhotos: media.exteriorPhotos || [],
        interiorPhotos: media.interiorPhotos || [],
        roomsOrDiningPhotos: media.roomsOrDiningPhotos || [],
        kitchenPhotos: media.kitchenPhotos || [],
        videoWalkthroughUrl: media.videoWalkthroughUrl,
      },

      operations,
      serviceDetails,
      onlinePresence,

      termsAccepted: true,
    };

    /* =========================
       CREATE OR UPDATE
    ========================== */
    let listing;

    if (listingId) {
      listing = await BusinessListing.findOneAndUpdate(
        { _id: listingId, userId },
        payload,
        { new: true, runValidators: true }
      );
    } else {
      listing = await BusinessListing.create(payload);
    }

    /* =========================
   DUPLICATE CHECK (AUTO)
========================== */
    const duplicateResult = await runBusinessDuplicateCheck({
      businessListingId: listing._id,
      businessName: listing.businessName,
      phone: listing.owner.phone,
      lat: listing.address.geoLocation.lat,
      lng: listing.address.geoLocation.lng,
    });

    listing.duplicateCheck = duplicateResult;
    await listing.save();

    return res.status(200).json({
      success: true,
      listingId: listing._id,
      message: "Business listing saved successfully",
    });
  } catch (error) {
    console.error("Business listing submit error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to submit business listing",
      error: error.message,
    });
  }
};
