import asyncHandler from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import NewsAPI from "newsapi";

const newsapi = new NewsAPI(process.env.NEWSAPI_API_KEY);

const getNewsFromApi = asyncHandler(async (req, res) => {
  const place = req.query.place;
  if (!place) {
    throw new ApiError(500, "Place Name Missing !");
  }
  const response = await newsapi.v2.everything({
    q: `Travel news regarding ${place}`,
    language: "en",
    sortBy: "publishedAt",
  });

  const apiResponse = new ApiResponse(
    200,
    response,
    `News about ${place} fetched successfully !`
  );
  return res.status(200).json(apiResponse);
});

export default getNewsFromApi;
