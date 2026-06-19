import NewsAPI from "newsapi";
import { ApiError } from "../../utils/ApiError.js";

// Lazy-initialize: don't crash at module load if the key is missing.
// The error will only surface when the news endpoint is actually called.
let newsapi = null;
const getNewsApiClient = () => {
  if (!newsapi) {
    if (!process.env.NEWSAPI_API_KEY) {
      throw new ApiError(503, "News service is not configured (NEWSAPI_API_KEY missing)");
    }
    newsapi = new NewsAPI(process.env.NEWSAPI_API_KEY);
  }
  return newsapi;
};

const TRAVEL_KEYWORDS = [
  "travel",
  "tourism",
  "destination",
  "airport",
  "flight",
  "visa",
  "hotel",
  "resort",
  "holiday",
  "tourist",
];

const SAFETY_KEYWORDS = [
  "earthquake",
  "flood",
  "cyclone",
  "storm",
  "landslide",
  "wildfire",
  "emergency",
  "alert",
];

const BLOCKED_SOURCES = [
  "globenewswire.com",
  "prnewswire.com",
  "businesswire.com",
];

const SPORTS_WORDS = [
  "match",
  "tournament",
  "league",
  "championship",
  "world cup",
  "slalom",
  "goal",
  "score",
];

export const getNewsFromApi = async (place) => {
  if (!place) throw new ApiError(400, "Place name missing");

  const client = getNewsApiClient();

  const response = await client.v2.everything({
    q: place,
    searchIn: "title,description",
    language: "en",
    sortBy: "publishedAt",
    pageSize: 50,
  });

  if (!response || response.status !== "ok") {
    console.error("NewsAPI failure:", response);
    return { status: "ok", articles: [] };
  }

  const placeParts = place
    .toLowerCase()
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const rankedArticles = response.articles
    .map((raw) => {
      // 🛡️ HARD NORMALIZATION (THIS FIXES 500 ERRORS)
      const title = typeof raw.title === "string" ? raw.title : "";
      const description =
        typeof raw.description === "string" ? raw.description : "";
      const url = raw.url || "";
      const image = raw.urlToImage || null;

      if (!title) return null;

      if (BLOCKED_SOURCES.some((src) => url.includes(src))) return null;

      const text = `${title} ${description}`.toLowerCase();

      if (SPORTS_WORDS.some((w) => text.includes(w))) return null;

      const placeMatches = placeParts.filter((p) => text.includes(p)).length;
      const travelMatches = TRAVEL_KEYWORDS.filter((k) =>
        text.includes(k)
      ).length;
      const safetyMatches = SAFETY_KEYWORDS.filter((k) =>
        text.includes(k)
      ).length;

      let score = 0;

      if (placeMatches > 0 && travelMatches > 0) score += 100;
      if (travelMatches > 0) score += travelMatches * 20;
      if (placeMatches > 0) score += placeMatches * 5;
      if (safetyMatches > 0) score += safetyMatches * 15;

      return {
        ...raw,
        title,
        description,
        urlToImage: image,
        _score: score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b._score - a._score);

  return {
    ...response,
    articles: rankedArticles.slice(0, 50),
  };
};
