import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_FOR_OVERVIEW);

async function listModels() {
  try {
    // We use the raw REST API to bypass any SDK filtering
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY_FOR_OVERVIEW}`
    );
    const data = await response.json();

    if (data.error) {
      console.error("API Key Error:", data.error.message);
      return;
    }

    console.log("✅ YOUR AVAILABLE MODELS:");
    data.models.forEach((m) => {
      // Only show models that support 'generateContent'
      if (m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${m.name.replace("models/", "")}`);
      }
    });
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

listModels();
