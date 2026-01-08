import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY_FOR_OVERVIEW,
});

export const getAiPlaceSummaryGemini = async ({
  place,
  overview,
  safety,
  googleSignals,
}) => {
  try {
    const prompt = `
Analyze traveler experiences about "${place}".

RULES:
- Use ONLY the data provided
- Do NOT invent facts
- If opinions are missing, infer only widely known travel perceptions
- NO marketing language
- STRICT JSON ONLY

JSON FORMAT:
{
  "overallSentiment": "",
  "peopleLove": [],
  "peopleDislike": [],
  "bestFor": [],
  "avoidIf": [],
  "foodConsensus": [],
  "hiddenGems": [],
  "touristTraps": [],
  "safetyNotes": []
}

DATA:
AI_OVERVIEW:
${JSON.stringify(overview?.aiData || {})}

SAFETY_SCAMS:
${JSON.stringify(safety?.aiData || {})}

GOOGLE_SIGNALS:
${JSON.stringify(googleSignals || {})}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text =
      response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "";

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      summary: {
        overallSentiment: parsed.overallSentiment || "mixed",
        peopleLove: parsed.peopleLove || [],
        peopleDislike: parsed.peopleDislike || [],
        bestFor: parsed.bestFor || [],
        avoidIf: parsed.avoidIf || [],
        foodConsensus: parsed.foodConsensus || [],
        hiddenGems: parsed.hiddenGems || [],
        touristTraps: parsed.touristTraps || [],
        safetyNotes: parsed.safetyNotes || [],
      },
      confidenceScore: 0,
      sources: {
        overview: !!overview,
        safety: !!safety,
        googleSignals: !!googleSignals,
        aiProvider: "gemini",
      },
    };
  } catch (error) {
    console.error("❌ Gemini summary error:", error);

    return {
      summary: {
        overallSentiment: "unknown",
        peopleLove: [],
        peopleDislike: [],
        bestFor: [],
        avoidIf: [],
        foodConsensus: [],
        hiddenGems: [],
        touristTraps: [],
        safetyNotes: [],
      },
      confidenceScore: 0,
      sources: { aiProvider: "gemini" },
    };
  }
};
