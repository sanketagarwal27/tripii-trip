// src/redux/chatbotSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchChatHistory, sendPrompt } from "@/api/chatbot"; // ✅ Import from fixed API

/* ---------------- EDIT AI MESSAGE ---------------- */
export const chatbotEditMessage = createAsyncThunk(
  "chat/edit",
  async ({ messageId, text }) => {
    await updateChatMessage(messageId, text);
    return { messageId, text };
  }
);

const initialState = {
  messages: [],
  isLoading: false,
  error: null,
};

// ✅ Load chat history
export const chatbotLoadHistory = createAsyncThunk(
  "chatbot/loadHistory",
  async (_, { rejectWithValue }) => {
    try {
      console.log("📡 Fetching chatbot history...");
      const data = await fetchChatHistory();
      console.log("✅ Chatbot history loaded:", data);
      return data.data || data.history || [];
    } catch (error) {
      console.error("❌ Chatbot history error:", error);

      // Don't reject on 401/403 - let axios interceptor handle it
      if (error.response?.status === 401 || error.response?.status === 403) {
        return rejectWithValue("Authentication required");
      }

      return rejectWithValue(
        error.response?.data?.message || "Failed to load chat history"
      );
    }
  }
);

// ✅ Send message to AI
export const chatbotHandleUserMessage = createAsyncThunk(
  "chatbot/sendMessage",
  async (message, { rejectWithValue }) => {
    try {
      console.log("📡 Sending message to AI:", message);
      const data = await sendPrompt(message);
      console.log("✅ AI response:", data);
      return data.data || data;
    } catch (error) {
      console.error("❌ Chatbot send error:", error);

      // Don't reject on 401/403 - let axios interceptor handle it
      if (error.response?.status === 401 || error.response?.status === 403) {
        return rejectWithValue("Authentication required");
      }

      return rejectWithValue(
        error.response?.data?.message || "Failed to send message"
      );
    }
  }
);

const chatbotSlice = createSlice({
  name: "chatbot",
  initialState,
  reducers: {
    // ✅ Add user message optimistically (before API call)
    addUserMessage: (state, action) => {
      state.messages.push({
        _id: action.payload.messageId,
        sender: "user",
        text: action.payload.text,
        timestamp: new Date().toISOString(),
      });
    },

    // ✅ Clear chat history
    clearChatHistory: (state) => {
      state.messages = [];
      state.error = null;
    },

    // ✅ Clear error
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load History
    builder
      .addCase(chatbotLoadHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(chatbotLoadHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload;
        state.error = null;
      })
      .addCase(chatbotLoadHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.warn("⚠️ Chat history load failed:", action.payload);
      });

    // Send Message
    builder
      .addCase(chatbotHandleUserMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(chatbotHandleUserMessage.fulfilled, (state, action) => {
        state.isLoading = false;

        // Add AI response to messages
        if (action.payload?.message || action.payload?.text) {
          state.messages.push({
            _id: Date.now(),
            sender: "ai",
            text: action.payload.message || action.payload.text,
            timestamp: new Date().toISOString(),
          });
        }

        state.error = null;
      })
      .addCase(chatbotHandleUserMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.warn("⚠️ Message send failed:", action.payload);

        // Optionally add error message to chat
        state.messages.push({
          _id: Date.now(),
          sender: "system",
          text: "Sorry, I couldn't process your message. Please try again.",
          timestamp: new Date().toISOString(),
          isError: true,
        });
      });
  },
});

export const { addUserMessage, clearChatHistory, clearError } =
  chatbotSlice.actions;

export default chatbotSlice.reducer;
