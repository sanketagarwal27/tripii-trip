import axios from "axios";

async function getRedditToken() {
  const res = await axios.post(
    "https://www.reddit.com/api/v1/access_token",
    "grant_type=client_credentials",
    {
      auth: {
        username: process.env.REDDIT_CLIENT_ID,
        password: process.env.REDDIT_CLIENT_SECRET,
      },
      headers: {
        "User-Agent": process.env.REDDIT_USER_AGENT,
      },
    }
  );

  return res.data.access_token;
}

async function searchReddit(placeName, token) {
  const res = await axios.get("https://oauth.reddit.com/search", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": process.env.REDDIT_USER_AGENT,
    },
    params: {
      q: `${placeName} travel`,
      sort: "relevance",
      limit: 25,
    },
  });

  return res.data.data.children;
}

function extractInsights(posts) {
  const positives = [];
  const negatives = [];
  const warnings = [];
  const tips = [];

  posts.forEach((p) => {
    const text = `${p.data.title} ${p.data.selftext}`.toLowerCase();

    if (text.includes("beautiful") || text.includes("scenic")) {
      positives.push("Beautiful scenery");
    }
    if (text.includes("cheap") || text.includes("budget")) {
      positives.push("Budget friendly");
    }
    if (text.includes("crowd") || text.includes("overcrowded")) {
      negatives.push("Crowded during peak season");
    }
    if (text.includes("scam")) {
      warnings.push("Tourist scams reported");
    }
    if (text.includes("best time")) {
      tips.push("Choose travel season carefully");
    }
  });

  const sentiment =
    negatives.length > positives.length
      ? "negative"
      : negatives.length > 0
      ? "mixed"
      : "positive";

  return {
    sentiment,
    positives: [...new Set(positives)],
    negatives: [...new Set(negatives)],
    warnings: [...new Set(warnings)],
    tips: [...new Set(tips)],
    postCount: posts.length,
  };
}
export const getRedditOpinions = async (place) => {
  try {
    const token = await getRedditToken();
    const posts = await searchReddit(place.name, token);
    const insights = extractInsights(posts);
    return insights;
  } catch (err) {
    console.log(err);
    return null;
  }
};
