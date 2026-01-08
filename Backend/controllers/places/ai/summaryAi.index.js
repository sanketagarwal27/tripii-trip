// Backend/controllers/places/ai/summaryAi.index.js
import { getAiPlaceSummaryGemini } from "./summaryAi.gemini.js";
import { getAiPlaceSummaryMock } from "./summaryAi.mock.js";

export const getPlaceSummaryAI = async (payload) => {
  if (process.env.AI_MODE === "gemini") {
    return getAiPlaceSummaryGemini(payload);
  }
  return getAiPlaceSummaryMock(payload);
};
