import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function getCoordinates(place) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${place}&count=1&language=en&format=json`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) return null;

  return {
    lat: data.results[0].latitude,
    lon: data.results[0].longitude,
    timezone: data.results[0].timezone,
  };
}

export async function getWeather(lat, lon, timezone) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    high: data.daily.temperature_2m_max[0],
    low: data.daily.temperature_2m_min[0],
    code: data.daily.weather_code[0],
  };
}

export const getWikiOverview = async (place) => {
  try {
    const formattedPlace = place.replace(/\s+/g, "_"); //Since, wikipedia expects underscore instead of spaces

    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${formattedPlace}`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        console.log("Location not found on Wikipedia !");
        return null;
      }
      console.log("Error in Calling Wikipedia");
      return null;
    }
    const data = await response.json();

    const overviewData = {
      title: data.title,
      description: data.description,
      summary: data.extract,
      imageUrl: data.thumbnail ? data.thumbnail.source : null,
      wikiUrl: data.content_urls.desktop.page,
    };
    return overviewData;
  } catch (err) {
    console.log(err);
    return null;
  }
};

export async function getAiOverview(location, interests = "general tourism") {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_FOR_OVERVIEW);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `
      Act as a travel expert. Create a short travel overview for "${location}" based on these interests: "${interests}".
      
      You must return a valid JSON object. Do not include any markdown formatting, backticks, or extra words.
      The JSON must match this structure exactly:
      {
        "oneLineBlurb": "A catchy single sentence summary.",
        "bestFor": ["Interest 1", "Interest 2", "Interest 3"],
        "hiddenGem": "Name of a specific cool spot.",
        "budgetRating": "$ or $$ or $$$"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(response);

    let text = response.text();
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error("AI Service Error:", error.message);

    return {
      oneLineBlurb: `Discover the beauty of ${location}.`,
      bestFor: ["Sightseeing", "Relaxation"],
      hiddenGem: "City Center",
      budgetRating: "$$",
    };
  }
}
