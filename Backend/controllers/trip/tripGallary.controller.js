import cloudinary from "cloudinary";
import mongoose from "mongoose";
import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

import { Trip } from "../../models/trip/trip.model.js";
import { PhotoLike } from "../../models/trip/tripPhotoLike.model.js";
import { emitToTrip } from "../../socket/server.js";
import { TripPhoto } from "../../models/trip/tripPhoto.model.js";
import { EVENTS } from "../../socket/events.js";
import { optimizeImageBuffer } from "../../utils/sharpImage.js";
import getDataUri from "../../utils/datauri.js";

const uploadTripGalleryPhoto = async (file, tripId, userId) => {
  if (!file) return null;

  // 🔥 Sharp preprocessing
  const optimizedBuffer = await optimizeImageBuffer(file.buffer, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 80,
  });

  // convert buffer → data uri (same as before)
  const uri = getDataUri({
    buffer: optimizedBuffer,
    mimetype: "image/jpeg",
  });

  const uploaded = await cloudinary.uploader.upload(uri.content, {
    folder: `trips/${tripId}/gallery/${userId}`,
    resource_type: "image",
    overwrite: false,
    transformation: {
      quality: "auto",
      fetch_format: "auto",
    },
  });

  return {
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

/**
 * ✅ FIXED: Upload photos with proper population
 */
export const uploadTripPhotosBatch = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;
  const { caption, location } = req.body;
  const files = req.files;

  if (!files || !files.length) {
    throw new ApiError(400, "No photos provided");
  }

  const trip = await Trip.findById(tripId);
  if (!trip) throw new ApiError(404, "Trip not found");

  const isActiveParticipant = trip.participants.some(
    (p) => p.user.toString() === userId.toString() && p.status === "active"
  );

  if (!isActiveParticipant && !trip.createdBy.equals(userId)) {
    throw new ApiError(403, "Not authorized to upload photos");
  }

  const createdPhotos = [];

  for (const file of files) {
    const uploadedImage = await uploadTripGalleryPhoto(file, tripId, userId);

    if (!uploadedImage) continue;

    // ✅ Parse location properly
    const locationData =
      typeof location === "string" ? JSON.parse(location) : location;

    const photo = await TripPhoto.create({
      trip: tripId,
      uploadedBy: userId,
      caption: caption || "",
      location: locationData,
      image: uploadedImage,
      visibility: "local",
      allowDownload: true,
    });

    createdPhotos.push(photo);
  }

  // ✅ CRITICAL: Populate uploadedBy before returning
  const populatedPhotos = await TripPhoto.find({
    _id: { $in: createdPhotos.map((p) => p._id) },
  })
    .populate("uploadedBy", "username avatar")
    .lean();

  // ✅ Emit to other trip members (not to self)
  emitToTrip(tripId, EVENTS.TRIP_PHOTO_UPLOADED, {
    photos: populatedPhotos,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { photos: populatedPhotos },
        "Photos uploaded successfully"
      )
    );
});

/**
 * ✅ FIXED: Get local gallery with populated user
 */
export const getMyLocalGallery = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  const photos = await TripPhoto.find({
    trip: tripId,
    uploadedBy: userId,
    visibility: "local",
  })
    .populate("uploadedBy", "username avatar")
    .sort({ createdAt: -1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, { photos }, "Local gallery fetched"));
});

/**
 * ✅ FIXED: Push photos to global with proper cleanup
 */
export const pushPhotosToGlobal = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;
  const { photoIds } = req.body;

  if (!Array.isArray(photoIds) || !photoIds.length) {
    throw new ApiError(400, "Photo IDs required");
  }

  // ✅ Verify ownership
  const photos = await TripPhoto.find({
    _id: { $in: photoIds },
    uploadedBy: userId,
    trip: tripId,
    visibility: "local",
  });

  if (photos.length !== photoIds.length) {
    throw new ApiError(400, "Some photos not found or not owned by you");
  }

  // ✅ Update visibility
  await TripPhoto.updateMany(
    {
      _id: { $in: photoIds },
      uploadedBy: userId,
      trip: tripId,
      visibility: "local",
    },
    { $set: { visibility: "global" } }
  );

  const updatedPhotos = await TripPhoto.find({
    _id: { $in: photoIds },
  })
    .populate("uploadedBy", "username avatar")
    .lean();

  emitToTrip(tripId, EVENTS.TRIP_PHOTO_PUSHED, {
    photos: updatedPhotos,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { modified: photos.length },
        "Photos pushed to global gallery"
      )
    );
});

/**
 * ✅ FIXED: Get global gallery with likes and populated user
 */
export const getGlobalTripGallery = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId = req.user._id;

  const photos = await TripPhoto.find({
    trip: tripId,
    visibility: "global",
  })
    .populate("uploadedBy", "username avatar")
    .sort({ createdAt: -1 })
    .lean();

  // ✅ Check which photos current user has liked
  const likedPhotoIds = await PhotoLike.find({
    user: userId,
    photo: { $in: photos.map((p) => p._id) },
  }).distinct("photo");

  const likedSet = new Set(likedPhotoIds.map(String));

  const response = photos.map((p) => ({
    ...p,
    isLikedByMe: likedSet.has(String(p._id)),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, { photos: response }, "Global gallery fetched"));
});

/**
 * ✅ Like photo
 */
export const likeTripPhoto = asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const userId = req.user._id;

  // ✅ Prevent duplicate likes
  const existing = await PhotoLike.findOne({
    photo: photoId,
    user: userId,
  });

  if (existing) {
    return res.status(200).json(new ApiResponse(200, null, "Already liked"));
  }

  await PhotoLike.create({
    photo: photoId,
    user: userId,
  });

  await TripPhoto.updateOne({ _id: photoId }, { $inc: { likesCount: 1 } });

  return res.status(200).json(new ApiResponse(200, null, "Photo liked"));
});

/**
 * ✅ Unlike photo
 */
export const unlikeTripPhoto = asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const userId = req.user._id;

  const deleted = await PhotoLike.deleteOne({
    photo: photoId,
    user: userId,
  });

  if (deleted.deletedCount) {
    await TripPhoto.updateOne({ _id: photoId }, { $inc: { likesCount: -1 } });
  }

  return res.status(200).json(new ApiResponse(200, null, "Photo unliked"));
});

/**
 * ✅ Toggle download permission
 */
export const togglePhotoDownload = asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const userId = req.user._id;
  const { allowDownload } = req.body;

  const photo = await TripPhoto.findById(photoId);
  if (!photo) throw new ApiError(404, "Photo not found");

  if (!photo.uploadedBy.equals(userId)) {
    throw new ApiError(403, "Only owner can change download permission");
  }

  photo.allowDownload = !!allowDownload;
  await photo.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, { allowDownload }, "Download permission updated")
    );
});

/**
 * ✅ FIXED: Delete photo with proper permissions
 */
export const deleteTripPhoto = asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(photoId)) {
    throw new ApiError(400, "Invalid photo id");
  }

  const photo = await TripPhoto.findById(photoId);
  if (!photo) throw new ApiError(404, "Photo not found");

  const trip = await Trip.findById(photo.trip).select("createdBy");
  if (!trip) throw new ApiError(404, "Trip not found");

  const isOwner = photo.uploadedBy.equals(userId);
  const isTripOwner = trip.createdBy.equals(userId);

  /* ---------------- PERMISSION RULES ---------------- */
  if (photo.visibility === "local") {
    if (!isOwner) {
      throw new ApiError(403, "Only photo owner can delete local photos");
    }
  } else {
    if (!isOwner && !isTripOwner) {
      throw new ApiError(
        403,
        "Only photo owner or trip owner can delete global photos"
      );
    }
  }

  /* ---------------- CLOUDINARY DELETE ---------------- */
  if (photo.image?.publicId) {
    try {
      await cloudinary.uploader.destroy(photo.image.publicId, {
        resource_type: "image",
      });
    } catch (err) {
      console.error("Cloudinary delete failed:", err);
    }
  }

  /* ---------------- CLEANUP DB ---------------- */
  await PhotoLike.deleteMany({ photo: photoId });
  await photo.deleteOne();

  /* ---------------- SOCKET EVENT ---------------- */
  emitToTrip(photo.trip, EVENTS.TRIP_PHOTO_DELETED, {
    tripId: photo.trip,
    photoId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { photoId }, "Photo deleted successfully"));
});

/**
 * ✅ Download photo (permission checked)
 */
export const downloadTripPhoto = asyncHandler(async (req, res) => {
  const { photoId } = req.params;
  const userId = req.user._id;

  const photo = await TripPhoto.findById(photoId);
  if (!photo) throw new ApiError(404, "Photo not found");

  const trip = await Trip.findById(photo.trip);
  if (!trip) throw new ApiError(404, "Trip not found");

  const isParticipant =
    trip.participants.includes(userId) || trip.createdBy.equals(userId);

  if (!isParticipant) {
    throw new ApiError(403, "Not authorized to download photo");
  }

  if (!photo.allowDownload) {
    throw new ApiError(403, "Downloads are disabled for this photo");
  }

  // ✅ Optional: Track download count
  // await TripPhoto.updateOne({ _id: photoId }, { $inc: { downloads: 1 } });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        downloadUrl: photo.image.url,
      },
      "Download authorized"
    )
  );
});
