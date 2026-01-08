import asyncHandler from "../../utils/asyncHandler.js";
import { PlaceSummary } from "../../models/places/placeSummary.model.js";
import { Overview } from "../../models/places/overview.model.js";
import { Safety } from "../../models/places/scams.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// 🔁 AI SWITCHBOARD (Gemini / OpenAI / Azure / Mock)
import { getPlaceSummaryAI } from "./ai/summaryAi.index.js";

// 🌍 FREE PHASE-1 PLACE SIGNALS (OSM + Nominatim)
import { getOSMPlaceData } from "./osm.controller.js";

const STALE_MS = 24 * 60 * 60 * 1000; // 24 hours

export const getPlaceSummary = asyncHandler(async (req, res) => {
  const place = req.query.place?.trim().toLowerCase();
  if (!place) {
    throw new Error("Place parameter is required");
  }

  /* -------------------------------------------------
   * CACHE CHECK
   * ------------------------------------------------- */
  const cached = await PlaceSummary.findOne({ place });

  const isStale =
    cached &&
    Date.now() - new Date(cached.lastGeneratedAt).getTime() > STALE_MS;

  // ✅ CACHE HIT
  if (cached && !isStale) {
    return res
      .status(200)
      .json(new ApiResponse(200, cached, "Place summary fetched from cache"));
  }

  /* -------------------------------------------------
   * DATA AGGREGATION (FREE SOURCES)
   * ------------------------------------------------- */
  const [overview, safety, osmData] = await Promise.all([
    Overview.findOne({ place }).lean(),
    Safety.findOne({ place }).lean(),
    getOSMPlaceData(place),
  ]);

  console.log("🌍 OSM Data:", osmData);

  /* -------------------------------------------------
   * AI SUMMARY (INSIGHTS ONLY)
   * ------------------------------------------------- */

  const normalizedCategory = (() => {
    if (!osmData?.category) return "unknown";

    if (osmData.category === "boundary") {
      // Heuristic: large importance implies country/region
      if (osmData.importance > 0.7) return "country";
      return "region";
    }

    return osmData.category;
  })();

  const travelContext = {
    placeType: normalizedCategory,
    popularity: osmData?.importance > 0.7 ? "high" : "moderate",
    knownFor: overview?.aiData?.highlights || overview?.wikiData?.summary || "",
  };

  const aiResult = await getPlaceSummaryAI({
    place,
    overview,
    safety,
    googleSignals: {
      importance: osmData?.importance,
      category: normalizedCategory,
      travelContext, // 👈 ADD THIS
    },
  });

  /* -------------------------------------------------
   * CONFIDENCE SCORE (EXPLORATORY MODE)
   * ------------------------------------------------- */
  let confidenceScore = 0.3; // base exploratory confidence

  if (overview?.aiData) confidenceScore += 0.2;
  if (safety?.aiData) confidenceScore += 0.2;
  if (osmData?.importance > 0.5) confidenceScore += 0.1;
  if (osmData?.importance > 0.7) confidenceScore += 0.1;

  confidenceScore = Math.min(confidenceScore, 0.7);

  let confidenceLabel = "Exploratory";
  if (confidenceScore >= 0.5) confidenceLabel = "Medium";

  /* -------------------------------------------------
   * SAVE / UPDATE SUMMARY
   * ------------------------------------------------- */
  const finalDoc = await PlaceSummary.findOneAndUpdate(
    { place },
    {
      place,
      mode: "exploratory",

      summary: aiResult.summary,

      confidenceScore,
      confidenceLabel,

      sources: {
        placeSignals: {
          importance: osmData?.importance,
          category: normalizedCategory,
        },
        aiProvider: process.env.AI_MODE || "mock",
      },

      lastGeneratedAt: Date.now(),
    },
    { upsert: true, new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        finalDoc,
        "Place summary generated successfully (exploratory mode)"
      )
    );
});
