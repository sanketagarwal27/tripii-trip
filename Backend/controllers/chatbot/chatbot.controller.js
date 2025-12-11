import asyncHandler from "../../utils/asyncHandler.js";
import { GoogleGenAI } from '@google/genai';
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const getChatbotResponse = asyncHandler(async (req, res) => {
    const { prompt } = req.body;
    
    const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
    const groundingTool = {
        googleSearch: {},
    };
    const config = {
        tools: [groundingTool],
        systemInstructions: "Your name is Sunday and you are a helpful assistant that provides accurate and concise information related to travel, tourism and trip planning. Use the provided tools to ground your responses with up-to-date information from the web. Cite your sources when applicable. You MUST provide a budget estimate for the trip. This estimate MUST be provided in a simple table format at the end of the response and MUST include three main categories: Flights/Transport, Accommodation, and Local Expenses. If specific prices are unavailable, provide a LOW, MEDIUM, and HIGH estimated range based on the general costs found on the web.",
    };

    if(!prompt) {
        throw new ApiError(500, "Prompt is required");
    }
    else {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-lite",    //Change the model according to yourself
                contents: prompt,
                config: config
            });

            const apiResponse = new ApiResponse(200, response, "Chatbot response retrieved successfully");
            return res.status(200).json(apiResponse);
        }
        catch(error) {
            console.error('Error calling the Gemini API:', error);
            throw new ApiError(500, "Failed to get response from the chatbot");
        }
    }
})