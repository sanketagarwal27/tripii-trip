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
  try {
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

    if (!res.data?.data?.children) {
      throw new Error("Invalid response from Reddit search API");
    }

    return res.data.data.children;
  } catch (error) {
    console.error("Failed to search Reddit:", error.message);
    throw error;
  }
}

function extractInsights(posts) {
  const positives = [];
  const negatives = [];
  const warnings = [];
  const tips = [];

  posts.forEach((p) => {
    const text = `${p.data.title} ${p.data.selftext}`.toLowerCase();
    
    // Helper to check for negation context
    const hasNegation = (keyword, text) => {
      const negations = ['not', 'never', 'no', "don't", "isn't", "wasn't"];
      const words = text.split(/\s+/);
      const idx = words.indexOf(keyword);
      if (idx > 0 && negations.includes(words[idx - 1])) {
        return true;
      }
      return false;
    };

    if ((text.includes("beautiful") || text.includes("scenic") || text.includes("stunning") || text.includes("breathtaking")) 
        && !hasNegation("beautiful", text) && !hasNegation("scenic", text)) {
      positives.push("Beautiful scenery");
    }
    if ((text.includes("cheap") || text.includes("budget") || text.includes("affordable") || text.includes("inexpensive"))
        && !hasNegation("cheap", text) && !hasNegation("budget", text)) {
      positives.push("Budget friendly");
    }
    if (text.includes("friendly") && text.includes("local")) {
      positives.push("Friendly locals");
    }
    if (text.includes("crowd") || text.includes("overcrowded")) {
      negatives.push("Crowded during peak season");
    }
    if (text.includes("expensive") || text.includes("overpriced")) {
      negatives.push("Can be expensive");
    }
    if (text.includes("scam")) {
      warnings.push("Tourist scams reported");
    }
    if (text.includes("unsafe") || text.includes("pickpocket")) {
      warnings.push("Safety concerns reported");
    }
    if (text.includes("best time")) {
      tips.push("Choose travel season carefully");
    }
    if (text.includes("book") && (text.includes("advance") || text.includes("ahead"))) {
      tips.push("Book in advance");
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
