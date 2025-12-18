import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Place } from "../../models/places/searchedPlaces.model.js";
import { Photo } from "../../models/places/photos.model.js";
import { Overview } from "../../models/places/overview.model.js";
import { getNewsFromApi } from "./news.controller.js";
import {
  getCoordinates,
  getWeather,
  getWikiOverview,
  getAiOverview,
} from "./overview.controller.js";
import { getHeroImageFromApi, getImagesFromApi } from "./images.controller.js";

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

export const getPhotos = asyncHandler(async (req, res) => {
  const place = req.query.place;
  if (!place) {
    throw new ApiError(500, "Cannot find Place parameter");
  }
  const cachedPhotos = await Photo.findOne({ place: place });
  //Cache Hit
  if (cachedPhotos) {
    console.log(`Cache hit for photos of ${place}`);
    const response = cachedPhotos.photos;
    return res
      .status(200)
      .json(
        new ApiResponse(200, response, "Photos Fetched Successfully from DB!")
      );
  }
  //Cache Miss
  console.log(`Cache miss for photos for ${place}. Calling API...`);
  const apiResponse = await getImagesFromApi(place);
  const photos = [];
  for (let i = 0; i < 30; i++) {
    photos.push({
      raw_url: apiResponse.response.results[i].urls.raw,
      small_url: apiResponse.response.results[i].urls.small,
      alt_description: apiResponse.response.results[i].alt_description,
    });
  }
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

export const getOverview = asyncHandler(async (req, res) => {
  const place = req.query.place;
  const cachedPlace = await Overview.findOne({ place: place });
  //Cache Hit
  if (cachedPlace) {
    console.log(`Cache hit for Overview for ${place}`);
    const finalData = {
      location: {
        name: cachedPlace.place,
        lat: cachedPlace.lat,
        lon: cachedPlace.lon,
      },
      content: {
        wiki: cachedPlace.wikiData,
        ai: cachedPlace.aiData,
        weather: cachedPlace.weatherData,
      },
    };
    res
      .status(200)
      .json(new ApiResponse(200, finalData, "Got Overview from DB"));
  }
  //Cache Miss
  else {
    console.log(`Cache Miss for Overview of ${place}`);
    try {
      const coords = await getCoordinates(place);
      if (!coords) {
        throw new ApiError(404, "Place Not Found !");
      }
      const [weatherData, wikiData, aiData] = await Promise.all([
        getWeather(coords.lat, coords.lon, coords.timezone),
        getWikiOverview(place),
        getAiOverview(place),
      ]);

      const finalData = {
        location: {
          name: place,
          lat: coords.lat,
          lon: coords.lon,
        },
        content: {
          wiki: wikiData,
          ai: aiData,
          weather: {
            summary: `Expect a high of ${weatherData.high}°C and low of ${weatherData.low}°C`,
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
          lat: finalData.location.lat,
          lon: finalData.location.lon,
          wikiData: finalData.content.wiki,
          aiData: finalData.content.ai,
          weatherData: finalData.content.weather,
        },
        { upsert: true, new: true }
      );
      res
        .status(200)
        .json(
          new ApiResponse(200, finalData, "Fetched Overview Data from APIs")
        );
    } catch (err) {
      console.error("Error in Generating Overview: ", err);
    }
  }
});
