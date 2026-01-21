// Backend/controllers/Business/ListBusinessForm.controller.js

import { runBusinessDuplicateCheck } from "../../jobs/duplicateCheck.business.job.js";
import { BusinessListing } from "../../models/marketplace/propertyForm.model.js";

import sharp from "sharp";
import path from "path";
import cloudinary from "../../utils/cloudinary.js";
import DataURIParser from "datauri/parser.js";

const parser = new DataURIParser();

/* ======================================================
   INLINE CLOUDINARY UPLOADER (BUFFER BASED)
====================================================== */
const uploadToCloudinary = async (
  file,
  { folder, maxWidth = 1600, maxHeight = 1600, quality = 80, publicId } = {}
) => {
  if (!file?.buffer) {
    throw new Error("uploadToCloudinary: file.buffer missing");
  }

  console.log("🖼 Optimizing image:", {
    name: file.originalname,
    sizeKB: Math.round(file.size / 1024),
    folder,
  });

  const optimizedBuffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  const ext = path.extname(file.originalname).replace(".", "") || "jpeg";
  const dataUri = parser.format(ext, optimizedBuffer);

  const uploaded = await cloudinary.uploader.upload(dataUri.content, {
    folder,
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
    transformation: [{ fetch_format: "auto" }],
  });

  console.log("✅ Cloudinary upload success:", uploaded.secure_url);

  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

/* ======================================================
   MAIN CONTROLLER
====================================================== */
export const submitBusinessListingForm = async (req, res) => {
  try {
    console.log("📥 Incoming business listing request");

    const userId = req.user._id;

    console.log("👤 User:", userId.toString());
    console.log("📦 Body keys:", Object.keys(req.body));
    console.log("📂 Files received:", Object.keys(req.files || {}));

    const {
      listingId,
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
      operations = {},
      serviceDetails = {},
      onlinePresence = {},

      termsAccepted,
    } = req.body;

    if (!listingFor || listingFor === "null") {
      return res.status(400).json({
        message: "Invalid or missing listingFor",
        received: listingFor,
      });
    }

    /* ================= HARD VALIDATIONS ================= */

    if (!listingFor)
      return res.status(400).json({ message: "listingFor is required" });
    if (!businessName)
      return res.status(400).json({ message: "businessName is required" });

    if (!owner.fullName || !owner.phone || !owner.email) {
      return res.status(400).json({
        message: "Owner name, phone and email are required",
      });
    }

    if (!owner.governmentId?.idType || !owner.governmentId?.idNumber) {
      return res.status(400).json({
        message: "Government ID type and number are required",
      });
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
      return res.status(400).json({
        message: "Map location (lat, lng) is required",
      });
    }

    if (!req.files?.coverImage?.length) {
      return res.status(400).json({ message: "Cover image is required" });
    }

    if (!onlinePresence.googleBusinessUrl) {
      return res.status(400).json({
        message: "Google Business URL is required",
      });
    }

    const accepted = termsAccepted === true || termsAccepted === "true";
    if (!accepted) {
      return res.status(400).json({
        message: "You must accept terms and conditions",
      });
    }

    /* ================= FILE VALIDATIONS ================= */

    if (!req.files?.documents?.length) {
      return res.status(400).json({
        message: "Cancelled cheque is required",
      });
    }

    /* ================= FILE UPLOADS ================= */

    console.log("⬆ Uploading cancelled cheque...");
    const cancelledChequeUpload = await uploadToCloudinary(
      req.files.documents[0],
      { folder: `business/${userId}/bank` }
    );

    console.log("⬆ Uploading cover image...");
    const coverImageUpload = await uploadToCloudinary(req.files.coverImage[0], {
      folder: `business/${userId}/cover`,
      maxHeight: 600,
      publicId: "cover",
    });

    console.log("⬆ Uploading exterior photos...");
    const exteriorUploads = await Promise.all(
      (req.files.exteriorPhotos || []).map((file) =>
        uploadToCloudinary(file, {
          folder: `business/${userId}/exterior`,
        })
      )
    );

    console.log("⬆ Uploading interior photos...");
    const interiorUploads = await Promise.all(
      (req.files.interiorPhotos || []).map((file) =>
        uploadToCloudinary(file, {
          folder: `business/${userId}/interior`,
        })
      )
    );

    /* ================= BUILD PAYLOAD ================= */

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
        governmentId: owner.governmentId,
      },

      address: {
        fullAddress: address.fullAddress,
        city: address.city,
        state: address.state,
        country: address.country || "India",
        pincode: address.pincode,
        landmark: address.landmark || "",

        // ✅ GeoJSON format
        geoLocation: {
          type: "Point",
          coordinates: [
            Number(address.geoLocation.lng), // longitude first
            Number(address.geoLocation.lat), // latitude second
          ],
        },

        addressProofUrl: address.addressProofUrl || "",
      },

      legalDocuments,
      propertyAuthorization,

      bankDetails: {
        accountHolderName: bankDetails.accountHolderName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        cancelledChequeUrl: cancelledChequeUpload.url,
      },

      media: {
        coverImage: coverImageUpload.url,
        exteriorPhotos: exteriorUploads.map((f) => f.url),
        interiorPhotos: interiorUploads.map((f) => f.url),
      },

      operations,
      serviceDetails,
      onlinePresence,

      termsAccepted: true,
    };

    console.log("🧱 Final payload ready");

    /* ================= SAVE ================= */

    const listing = listingId
      ? await BusinessListing.findOneAndUpdate(
          { _id: listingId, userId },
          payload,
          { new: true, runValidators: true }
        )
      : await BusinessListing.create(payload);

    console.log("💾 Listing saved:", listing._id.toString());

    /* ================= DUPLICATE CHECK ================= */

    const duplicateResult = await runBusinessDuplicateCheck({
      businessListingId: listing._id,
      businessName: listing.businessName,
      phone: listing.owner.phone,
      lng: listing.address.geoLocation.coordinates[0], // ✅ Get from array
      lat: listing.address.geoLocation.coordinates[1], // ✅ Get from array
    });

    listing.duplicateCheck = duplicateResult;
    await listing.save();

    console.log("🔍 Duplicate check:", duplicateResult.status);

    return res.status(200).json({
      success: true,
      listingId: listing._id,
      message: "Business listing saved successfully",
    });
  } catch (error) {
    console.error("❌ Business listing submit error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit business listing",
      error: error.message,
    });
  }
};
