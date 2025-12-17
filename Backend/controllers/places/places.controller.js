import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Place } from "../../models/places/searchedPlaces.model.js";
import { getNewsFromApi } from "./news.controller.js";
import { getHeroImageFromApi } from "./images.controller.js";

const presentInDb = async (place, query2) => {
  try {
    const cachedPlace = await Place.findOne({ place });
    //Cache Hit
    if (cachedPlace && cachedPlace[query2]) {
      console.log(`Cache Hit for ${query2} for ${place}`);
      return { isFound: true, data: cachedPlace };
    }
    //Cache Miss
    else {
      console.log(`Cache Miss for ${query2} for ${place}. Calling the api...`);
      return { isFound: false, data: null };
    }
  } catch (err) {
    console.log("Error in Searching Database: ", err);
  }
};

export const getNews = asyncHandler(async (req, res) => {
  const place = req.query.place;
  if (!place) {
    throw new ApiError(500, "Place parameter not found !");
  }
  const { isFound, data } = await presentInDb(place, "newsData");
  if (isFound && data.newsData) {
    const newsData = data.newsData;
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          newsData,
          `News for ${place} fetched successfully from DB !`
        )
      );
  } else {
    const apiResponse = await getNewsFromApi(place);
    await Place.findOneAndUpdate(
      { place },
      { newsData: apiResponse },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          apiResponse,
          `News from API fetched successfully for ${place}`
        )
      );
  }
});

export const getHeroImage = asyncHandler(async (req, res) => {
  const place = req.query.place;
  if (!place) {
    throw new ApiError(500, "Place parameter not found");
  }
  const { isFound, data } = await presentInDb(place, "heroImageUrl");
  if (isFound && data.heroImageUrl) {
    const heroImageUrl = data.heroImageUrl;
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          heroImageUrl,
          "Hero Image Fetched Successfully from DB!"
        )
      );
  } else {
    const apiResponse = await getHeroImageFromApi(place);
    await Place.findOneAndUpdate(
      { place: place },
      {
        heroImageUrl: apiResponse,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res
      .status(200)
      .json(
        new ApiResponse(200, apiResponse, "Fetched Hero Image Successfully !")
      );
  }
});
