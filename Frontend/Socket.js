// src/socket.js
import { io } from "socket.io-client";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const socket = io(BACKEND, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"],
});

// Removed window.socket exposure — exposing the socket on window
// allows any third-party script to emit arbitrary socket events.

export const connectSocket = () => {
  if (!socket.connected) {
    // Update userId on connect — used by the server to map socket → user
    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.auth = { userId };
    }
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};
