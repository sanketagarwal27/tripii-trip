// src/redux/socketSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  connected: false,
  lastPing: null,
  notifications: [], // real-time notifications
  presence: {}, // optional: { userId: { online: true, lastSeen } }
  typing: {}, // optional typing indicators
};

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setSocketConnected(state, action) {
      state.connected = !!action.payload;
      if (action.payload) state.lastPing = Date.now();
    },
    addNotification(state, action) {
      state.notifications.unshift(action.payload);
      if (state.notifications.length > 200) state.notifications.pop();
    },
    clearNotifications(state) {
      state.notifications = [];
    },
    setPresence(state, action) {
      // payload: { userId, online, lastSeen }
      state.presence[action.payload.userId] = action.payload;
    },
    setTyping(state, action) {
      const { roomId, userId, typing } = action.payload;
      state.typing[roomId] = state.typing[roomId] || {};
      state.typing[roomId][userId] = typing;
    },
  },
});

export const {
  setSocketConnected,
  addNotification,
  clearNotifications,
  setPresence,
  setTyping,
} = socketSlice.actions;

export default socketSlice.reducer;
