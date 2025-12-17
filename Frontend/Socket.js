// src/socket.js
import { io } from "socket.io-client";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const socket = io(BACKEND, {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"],
});

if (typeof window !== "undefined") {
  window.socket = socket;
}

export const connectSocket = () => {
  if (!socket.connected) {
    // 🔥 Update userId on connect
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
