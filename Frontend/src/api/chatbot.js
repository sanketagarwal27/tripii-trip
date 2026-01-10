// src/api/chatbot.js (or wherever this file is)
import api from "./axios"; // ✅ Use the axios instance with interceptors

// ✅ Fetch chat history
export const fetchChatHistory = async () => {
  try {
    const response = await api.get("/api/chatbot/history");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch chat history:", error);
    throw error;
  }
};

// ✅ Send prompt to AI
export const sendPrompt = async (prompt) => {
  try {
    const response = await api.post("/api/chatbot/", { prompt });
    return response.data;
  } catch (error) {
    console.error("Failed to send prompt:", error);
    throw error;
  }
};

// ✅ Update chat message
export const updateChatMessage = async (messageId, text) => {
  try {
    const response = await api.patch(`/api/chatbot/${messageId}`, { text });
    return response.data;
  } catch (error) {
    console.error("Failed to update chat message:", error);
    throw error;
  }
};
