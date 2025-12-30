import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Place } from "../../models/places/searchedPlaces.model.js";
import { Photo } from "../../models/places/photos.model.js";
import { Overview } from "../../models/places/overview.model.js";
import { Safety } from "../../models/places/scams.model.js";
import { getNewsFromApi } from "./news.controller.js";
import {
  getCoordinates,
  getWeather,
  getWikiOverview,
  getAiOverview,
} from "./overview.controller.js";
import { getAiScams } from "./scams.controller.js";
import { getHeroImageFromApi, getImagesFromApi } from "./images.controller.js";

/* -------------------------------------------------
 * CACHE CHECK
 * ------------------------------------------------- */
const presentInDb = async (place, field) => {
  try {
    const cachedPlace = await Place.findOne({ place });
    if (cachedPlace && cachedPlace[field]) {
      cachedPlace.lastSearched = Date.now();
      await cachedPlace.save();
      console.log(`✅ Cache hit: ${field} for ${place}`);
      return { isFound: true, data: cachedPlace };
    }
    return { isFound: false, data: null };
  } catch (err) {
    console.error("DB error:", err);
    return { isFound: false, data: null };
  }
};

/* -------------------------------------------------
 * GET PLACE NEWS
 * ------------------------------------------------- */
export const getNews = asyncHandler(async (req, res) => {
  const placeRaw = req.query.place;
  if (!placeRaw) {
    throw new ApiError(400, "Place parameter is required");
  }

  const place = placeRaw.trim().toLowerCase();

  const { isFound, data } = await presentInDb(place, "newsData");

  // 🔁 CACHE HIT
  if (isFound && data.newsData) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, data.newsData, `Place news fetched from cache`)
      );
  }
  //Cache Miss
  console.log(`Cache Miss for News for ${place}`);

  // 🌍 API FETCH + FILTER
  const apiResponse = await getNewsFromApi(place);

  // 💾 CACHE FILTERED DATA
  await Place.findOneAndUpdate(
    { place },
    { newsData: apiResponse },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, apiResponse, `Place news fetched successfully`));
});

/* -------------------------------------------------
 * GET HERO IMAGE
 * ------------------------------------------------- */
export const getHeroImage = asyncHandler(async (req, res) => {
  const placeRaw = req.query.place;
  if (!placeRaw) {
    throw new ApiError(400, "Place parameter is required");
  }

  const place = placeRaw.trim().toLowerCase();

  const { isFound, data } = await presentInDb(place, "heroImageUrl");

  if (isFound && data.heroImageUrl) {
    return res
      .status(200)
      .json(new ApiResponse(200, data.heroImageUrl, "Hero image from cache"));
  }

  const apiResponse = await getHeroImageFromApi(place);

  await Place.findOneAndUpdate(
    { place },
    { heroImageUrl: apiResponse },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, apiResponse, "Hero image fetched successfully"));
});

const getWeatherData = async (place) => {
  place = place.trim().toLowerCase();

  const { isFound, data } = await presentInDb(place, "weatherData");

  // Cache Hit
  if (isFound && data.weatherData) {
    return data.weatherData;
  }
  // Cache Miss
  console.log(`Cache Miss for weather data of ${place}. Calling APIs...`);
  try {
    const coords = await getCoordinates(place);
    if (!coords) {
      console.error("Coordinates not found for ", place);
      return null;
    }
    const weatherData = await getWeather(coords.lat, coords.lon);
    weatherData.summary = `Expect a high of ${weatherData.high} and low of ${weatherData.low} currently`;
    if (weatherData) {
      await Place.findOneAndUpdate(
        { place },
        { lat: coords.lat, lon: coords.lon, weatherData: weatherData },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      return weatherData;
    } else return null;
  } catch (err) {
    console.error("Weather Data Error: ", err);
    return null;
  }
};

/* -------------------------------------------------
 * GET PLACE PHOTOS
 * ------------------------------------------------- */
export const getPhotos = asyncHandler(async (req, res) => {
  const place = req.query.place;
  if (!place) {
    throw new ApiError(500, "Cannot find Place parameter");
  }
  const cachedPhotos = await Photo.findOne({ place: place });
  //Cache Hit
  if (cachedPhotos) {
    console.log(`✅ Cache hit: Photos for ${place}`);
    const response = cachedPhotos.photos;
    return res
      .status(200)
      .json(
        new ApiResponse(200, response, "Photos Fetched Successfully from DB!")
      );
  }
  //Cache Miss
  console.log(`Cache Miss for photos for ${place}. Calling API...`);
  const apiResponse = await getImagesFromApi(place);
  const photos = [];
  apiResponse.response?.results.forEach((pic) => {
    photos.push({
      raw_url: pic?.urls.raw,
      small_url: pic.urls.small,
      alt_description: pic?.alt_description,
    });
  });
  await Photo.findOneAndUpdate(
    { place: place },
    {
      $set: {
        photos: photos,
      },
    },
    { new: true, upsert: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, photos, "Fetched Photos successfully !"));
});

/* -------------------------------------------------
 * GET PLACE OVERVIEW
 * ------------------------------------------------- */
export const getOverview = asyncHandler(async (req, res) => {
  const place = req.query.place;
  const cachedPlace = await Overview.findOne({ place: place });
  const weatherData = await getWeatherData(place);
  //Cache Hit
  if (cachedPlace) {
    console.log(`✅ Cache hit: Overview for ${place}`);
    cachedPlace.lastSearched = Date.now();
    await cachedPlace.save();
    const finalData = {
      location: {
        name: cachedPlace.place,
      },
      content: {
        wiki: cachedPlace.wikiData,
        ai: cachedPlace.aiData,
        weather: weatherData,
      },
    };
    return res
      .status(200)
      .json(new ApiResponse(200, finalData, "Got Overview from DB"));
  }
  //Cache Miss
  else {
    console.log(`Cache Miss for Overview of ${place}. Calling APIs...`);
    try {
      const [wikiData, aiData] = await Promise.all([
        getWikiOverview(place),
        getAiOverview(place),
      ]);

      const finalData = {
        location: {
          name: place,
        },
        content: {
          wiki: wikiData,
          ai: aiData,
          weather: {
            summary: `Expect a high of ${weatherData.high}°C and low of ${weatherData.low}°C currently`,
            high: weatherData.high,
            low: weatherData.low,
            conditionCode: weatherData.code,
          },
        },
      };
      //Save To DB
      await Overview.findOneAndUpdate(
        { place: place },
        {
          place: place,
          wikiData: finalData.content.wiki,
          aiData: finalData.content.ai,
        },
        { upsert: true, new: true }
      );
      return res
        .status(200)
        .json(
          new ApiResponse(200, finalData, "Fetched Overview Data from APIs")
        );
    } catch (err) {
      console.error("Error in Generating Overview: ", err);
    }
  }
});

/* -------------------------------------------------
 * GET PLACE SCAMS
 * ------------------------------------------------- */
export const getScams = asyncHandler(async (req, res) => {
  const place = req.query.place;
  if (!place) {
    throw new ApiError(500, "Place parameter not found !");
  }
  const cachedPlace = await Safety.findOne({ place });
  // Cache Hit
  if (cachedPlace) {
    console.log(`✅ Cache hit: Scams for ${place}`);
    const response = cachedPlace.aiData;
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          response,
          "Safety details found successfully from DB !"
        )
      );
  }
  // Cache Miss
  else {
    console.log(`Cache Miss for Scams of ${place}. Calling APIs...`);
    try {
      const finalAiData = await getAiScams(place);
      if (!finalAiData) {
        throw new ApiError(500, "Error in getting AI data");
      }
      await Safety.findOneAndUpdate(
        { place },
        {
          place: place,
          aiData: finalAiData,
        },
        { upsert: true, new: true }
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            finalAiData,
            "Safety Details fetched successfully from AI..."
          )
        );
    } catch (error) {
      console.log("Error in calling API: ", error);
    }
  }
});

/* -------------------------------------------------
 * GET SUGGESTED PLACES
 * ------------------------------------------------- */
export const getSuggestedPlaces = asyncHandler(async (req, res) => {
  try {
    const places = await Place.find()
      .sort({ updatedAt: -1 })
      .limit(15)
      .select("-newsData -lat -lon -weatherData")
      .lean();

    const overview = await Overview.find().sort({ updatedAt: -1 }).lean();

    places.forEach((placeObj) => {
      const words = placeObj.place.split(", ");
      const capitalizedWords = words.map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      });
      placeObj.place = capitalizedWords.join(", ");
      const matchingOverview = overview.find(
        (item) => item.place.toLowerCase() === placeObj.place.toLowerCase()
      );
      if (matchingOverview) {
        placeObj.overview = matchingOverview;
      } else {
        placeObj.overview = null;
      }
    });

    res
      .status(200)
      .json(new ApiResponse(200, places, "Places Fetched Successfully!"));
  } catch (error) {
    console.log("Error getting suggested Places: ", error);
    throw new ApiError(500, "Error getting Suggested Places !");
  }
});
