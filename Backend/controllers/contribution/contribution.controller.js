import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Contribution } from "../../models/contribution/contribution.model.js";
import { User } from "../../models/user/user.model.js";

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
          contributions: savedContribution,
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
    throw new ApiError(
      500,
      "Error adding your Contribution. Try again later..."
    );
  }
});
