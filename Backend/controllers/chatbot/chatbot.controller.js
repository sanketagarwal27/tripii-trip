import asyncHandler from "../../utils/asyncHandler.js";
import { GoogleGenAI } from "@google/genai";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { AiChat } from "../../models/user/AiChat.model.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// intent detector
function detectMode(prompt = "") {
  const p = prompt.toLowerCase();

  // 🔹 Place overview intent
  const overviewKeywords = [
    "tell me about",
    "about ",
    "overview of",
    "guide to",
    "is ",
  ];

  // If short prompt + looks like a place
  if (overviewKeywords.some((k) => p.includes(k)) && p.split(" ").length <= 6) {
    return "OVERVIEW";
  }

  // 🔹 Explanation / clarification
  const explainKeywords = [
    "explain",
    "why",
    "how",
    "detail",
    "budget of",
    "cost of",
    "elaborate",
  ];

  if (explainKeywords.some((k) => p.includes(k))) {
    return "CHAT";
  }

  // 🔹 Default: planning
  return "PLAN";
}

/* =========================================================
   HELPER: Extract JSON from markdown-wrapped response
========================================================= */
function extractJSON(text) {
  if (!text || typeof text !== "string") {
    console.error("Invalid text input for JSON extraction");
    return null;
  }

  // Remove markdown code blocks
  let cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Try to parse the cleaned text directly
  try {
    const parsed = JSON.parse(cleaned);
    // Validate it has the expected structure
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (e) {
    // Continue to next attempt
  }

  // Try to find JSON object in the text
  try {
    // Look for the first { and last }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonStr);

      // Validate it has the expected structure
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to extract JSON from substring:", e);
  }

  console.error("No valid JSON found in response");
  return null;
}

/* =========================================================
   SYSTEM PROMPT (Two types according to intent (plan generate or plan discussion)
========================================================= */
const PLAN_SYSTEM_PROMPT = `
You are Sunday, an AI travel planner inside the TripiiTrip app.
Generate an itinerary that can be directly imported as trip plans.

CRITICAL RULES:
- Output STRICT JSON only. NO other text before or after.
- No markdown code blocks (no \`\`\`json), no explanations, no comments.
- Start with { and end with }
- Follow the schema exactly.

TIME RULES:
- Every activity MUST include time.
- Use realistic ranges:
  Morning: 07:00–11:00
  Afternoon: 12:00–16:00
  Evening: 17:00–20:00
  Night: 20:00–23:00
- Schedule outdoor activities during pleasant hours.
- If timing depends on weather, explain briefly in "weatherReason".

DATE RULES:
- Use YYYY-MM-DD format.
- Dates must be continuous.
- Day 1 aligns with inferred start date.

CONTENT RULES:
- 3–6 activities per day.
- Practical travel order.
- Short, actionable descriptions.
- No repetition.

JSON SCHEMA (MUST FOLLOW EXACTLY):
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "summary": "Brief day summary",
      "plans": [
        {
          "title": "Activity title",
          "description": "Activity description",
          "time": { "start": "HH:MM", "end": "HH:MM" },
          "location": { "name": "Location name", "address": "Full address" },
          "weatherReason": "Optional weather note"
        }
      ]
    }
  ],
  "budget": {
    "transport": "LOW",
    "accommodation": "LOW",
    "local": "LOW"
  }
}

REMEMBER: Your response must be ONLY valid JSON. No text before or after the JSON object.
`;

const CHAT_SYSTEM_PROMPT = `
You are Sunday, a helpful travel assistant.

The user ALREADY has a travel plan.
Your job is to EXPLAIN or CLARIFY parts of that plan.

RULES:
- Do NOT generate a full itinerary.
- Do NOT repeat the entire plan.
- Respond in bullet points or short paragraphs.
- Be concise and contextual.
- Do NOT output JSON.
`;

const OVERVIEW_SYSTEM_PROMPT = `
You are Sunday, a travel assistant.

The user is asking for a COUNTRY or PLACE OVERVIEW.

RULES:
- Do NOT generate a day-wise itinerary.
- Do NOT return JSON.
- Use short paragraphs with clear category separation.
- Match the tone and length of a "budget explanation" response.
- Keep it practical and travel-focused.

CATEGORIES TO COVER (in this order):
1. What the place is famous for
2. Local food & specialties
3. Typical budget (LOW / MEDIUM / HIGH explanation)
4. Common tourist scams or things to be careful about
5. Best time or quick travel tip (optional)

FORMAT:
- Plain text
- Clear section headers
- Concise explanations
`;

/* =========================================================
   POST: Get AI Response
========================================================= */
export const getChatbotResponse = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  const userId = req.user._id;

  if (!prompt) throw new ApiError(400, "Prompt is required");

  const mode = detectMode(prompt);
  console.log("🎯 Detected mode:", mode);

  // Fetch last messages from AiChat model
  const historyDocs = await AiChat.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  const history = historyDocs.reverse().map((m) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.text }],
  }));

  const systemPrompt =
    mode === "PLAN"
      ? PLAN_SYSTEM_PROMPT
      : mode === "CHAT"
        ? CHAT_SYSTEM_PROMPT
        : OVERVIEW_SYSTEM_PROMPT;

  const contents = [...history, { role: "user", parts: [{ text: prompt }] }];

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
      },
    });
  } catch (error) {
    console.warn(
      "⚠️ gemini-2.5-flash-lite failed (likely high demand), falling back to gemini-2.5-flash. Error:",
      error.message,
    );
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
        },
      });
    } catch (fallbackError) {
      console.error("❌ Fallback model also failed:", fallbackError.message);
      throw new ApiError(
        503,
        "AI models are currently under high demand. Please try again later.",
      );
    }
  }

  let reply = "";
  const candidate = response?.candidates?.[0];

  if (candidate?.content?.parts) {
    reply = candidate.content.parts.map((p) => p.text).join("\n");
  }

  console.log("🤖 Raw AI reply:", reply.substring(0, 200) + "...");

  if (!reply) {
    reply =
      mode === "PLAN"
        ? JSON.stringify({
            days: [],
            budget: { transport: "LOW", accommodation: "LOW", local: "LOW" },
          })
        : "I couldn't clarify that.";
  }

  // 🔹 CLEAN JSON FOR PLAN MODE
  let finalReply = reply;
  if (mode === "PLAN") {
    const extracted = extractJSON(reply);
    if (extracted && extracted.days && Array.isArray(extracted.days)) {
      finalReply = JSON.stringify(extracted);
      console.log("✅ Successfully extracted valid JSON plan");
    } else {
      console.warn("⚠️ Failed to extract valid JSON, using fallback");
      finalReply = JSON.stringify({
        days: [],
        budget: { transport: "LOW", accommodation: "LOW", local: "LOW" },
        error:
          "Failed to generate valid plan. Please try rephrasing your request.",
      });
    }
  }

  const baseId = Date.now();

  await AiChat.insertMany([
    {
      user: userId,
      messageId: baseId,
      sender: "user",
      text: prompt,
    },
    {
      user: userId,
      messageId: baseId + 1,
      sender: "model",
      text: finalReply,
    },
  ]);

  console.log("💾 Saved to database. Reply length:", finalReply.length);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        messageId: baseId + 1,
        sender: "model",
        text: finalReply,
      },
      "Sunday responded",
    ),
  );
});

/* =========================================================
   PATCH: Edit AI Message (USER-SIDE EDIT ONLY)
========================================================= */
export const updateAIMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;

  const updated = await AiChat.findOneAndUpdate(
    {
      user: req.user._id,
      messageId,
      sender: "model",
    },
    { text },
    { new: true },
  );

  console.log("Updated AI message:", updated);

  if (!updated) throw new ApiError(404, "Message not found");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "AI message updated"));
});

/* =========================================================
   GET: Chat History
========================================================= */
export const getChatHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  const chats = await AiChat.find({ user: userId })
    .sort({ createdAt: 1 })
    .lean();

  return res
    .status(200)
    .json(new ApiResponse(200, chats, "Chat history retrieved successfully"));
});
