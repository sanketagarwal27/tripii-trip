import NewsAPI from "newsapi";

export const getNewsFromApi = async (place) => {
  const newsapi = new NewsAPI(process.env.NEWSAPI_API_KEY);
  if (!place) {
    throw new ApiError(500, "Place Name Missing !");
  }
  const response = await newsapi.v2.everything({
    q: `${place} AND Place AND (tourism OR travel OR current weather OR visa) -politics -crime -police`,
    language: "en",
    sortBy: "relevance",
    pageSize: 20,
  });
  return response;
};
