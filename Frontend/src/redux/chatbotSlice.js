import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchHistoryParams, fetchAiResponse, saveMessage } from "../api/chatbot.js";

// 1. Thunk to load history
export const chatbotLoadHistory = createAsyncThunk(
  "chatbot/loadHistory", 
  async () => {
    const response = await fetchHistoryParams();
    return response.data || [];
  }
);

// 2. Thunk to handle the full chat flow
export const chatbotHandleUserMessage = createAsyncThunk(
  "chatbot/handleUserMessage",
  async (prompt, { dispatch }) => {
    const userMsg = { id: Date.now(), text: prompt, sender: "user" };

    // Optimistic update
    dispatch(chatbotAddMessage(userMsg));

    // Save User Msg
    await saveMessage(userMsg.id, userMsg.text, userMsg.sender);

    // Get AI Response
    const response = await fetchAiResponse(prompt);
    
    const text =
      response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Error: No response";

    const aiMsg = { id: Date.now() + 1, text: text, sender: "ai" };

    // Save AI Msg
    await saveMessage(aiMsg.id, aiMsg.text, aiMsg.sender);

    return aiMsg;
  }
);

const chatbotSlice = createSlice({
  name: "chatbot",
  initialState: {
    messages: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    chatbotAddMessage: (state, action) => {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(chatbotLoadHistory.fulfilled, (state, action) => {
        state.messages = action.payload;
      })
      .addCase(chatbotHandleUserMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(chatbotHandleUserMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages.push(action.payload);
      })
      .addCase(chatbotHandleUserMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
        state.messages.push({
          id: Date.now(),
          text: "Sorry, something went wrong.",
          sender: "ai",
        });
      });
  },
});

export const { chatbotAddMessage } = chatbotSlice.actions;
export default chatbotSlice.reducer;