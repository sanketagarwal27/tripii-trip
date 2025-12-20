import { GoogleGenAI } from "@google/genai";

export async function getAiScams(location, interests = "general tourism") {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY_FOR_OVERVIEW,
  });
  try {
    const prompt = `
      Act as a travel expert. Create a travel safety for "${location}" based on these interests: "${interests}".
      
      You must return a valid JSON object. Do not include any markdown formatting, backticks, or extra words.
      The JSON must match this structure exactly:
      {
        "commonScams": ["Scam1", "Scam 2", "Scam 3", "Scam 4"] or [],
        "overallSafetyRating": "A safety rating out of 10",
        "travelAdvices": "Some good travel advices for safety."
      }
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });
    console.log(response);
    let text = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(text);
    return data;
  } catch (error) {
    console.error("Scam AI Service Error:", error.message);

    return {
      commonScams: [],
      overallSafetyRating: "7",
      travelAdvices: "Just take care of your belongings in public places.",
    };
  }
}
