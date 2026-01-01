import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Contribution } from "../../models/contribution/contribution.model.js";
import { User } from "../../models/user/user.model.js";
import cloudinary from "../../utils/cloudinary.js";

export const addContribution = asyncHandler(async (req, res) => {
  try {
    const { timeline, tripMeta } = req.body;
    const userId = req.user?._id;
    if (!userId) {
      throw new ApiError(
        400,
        "Please Login to Contribute so that we can reward you !"
      );
    }
    if (!tripMeta || !tripMeta.location) {
      throw new ApiError(400, "Trip Location is required !");
    }
    if (!timeline || !Array.isArray(timeline) || timeline.length === 0) {
      throw new ApiError(400, "No Contribution Added...");
    }
    // Process the array to ensure required Backend fields are present
    const processedPlaces = timeline.map((item) => {
      return {
        userId,
        type: item.type, //Discriminator
        category: item.category, //category for every type

        placeName: item.placeName,
        location: tripMeta.location, //Can be used to group
        address: item.location,
        contactNumber: item.contactNumber,
        contactPerson: item.contactPerson,
        dateOfVisit: item.dateOfVisit || tripMeta?.date,
        description: item.description,
        rating: Number(item.rating),
        images: item.images || [],

        hotelStars: item.hotelStars,
        hostelVibe: item.hostelVibe,
        amenities: item.amenities,
        roomsRating: item.rooms,
        hospitalityRating: item.hospitality,

        cuisine: item.cuisine,
        priceRange: item.priceRange,
        dietary: item.dietary,
        mustTry: item.mustTry,
        foodRating: item.foodRating,
        ambienceRating: item.ambienceRating,
        serviceRating: item.serviceRating,

        timeSpent: item.timeSpent,
        isFree: item.isFree,
        entryCost: item.entryCost,
      };
    });

    const savedContribution = await Contribution.insertMany(processedPlaces);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          pendingContributions: savedContribution.map((doc) => doc._id),
        },
      },
      { new: true }
    );

    return res
      .status(201)
      .json(
        new ApiResponse(201, savedContribution, "Data saved to contributions")
      );
  } catch (error) {
    console.error("Error adding contribution:", error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      500,
      "Error adding your Contribution. Try again later..."
    );
  }
});

export const uploadImages = asyncHandler(async (req, res) => {
  const files = req.files;
  try {
    if (!files || files.length === 0) {
      throw new ApiError(400, "No files Uploaded !");
    }

    //Validate file types and sizes
    const allowedTypes = ["image/jpeg","image/jpg","image/png","image/webp"];
    const maxSize = 5 * 1024 * 1024; //5MB

    for(const file of files) {
      if(!allowedTypes.includes(file.mimetype)) {
        throw new ApiError(400, `Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`)
      }
      if(file.size > maxSize) {
        throw new ApiError(400, `File ${file.originalname} exceeds 5MB limit.`)
      }
    }

    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "place_reviews",
            resource_type: "image",
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
    });
    const imageUrls = await Promise.all(uploadPromises);
    return res
      .status(200)
      .json(new ApiResponse(200, imageUrls, "Images Uploaded Successfully"));
  } catch (err) {
    console.error("Upload Error", err);
    if(err instanceof ApiError) throw err;
    throw new ApiError(500, "Error in uploading files !");
  }
});
