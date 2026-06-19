import { Server } from "socket.io";
import userSocket from "./user.socket.js";
import communitySocket from "./community.socket.js";
import chatSocket from "./chat.socket.js";
import { EVENTS } from "./events.js";
import tripSocket from "./trip.socket.js";

let io = null;

const userSocketMap = {};
const userLastSeen = {};
const communityRooms = {};
const typingMap = {};

export function initSocket(server) {
  // Build allowed origins dynamically — matching the Express CORS config
  const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
    "https://tripii-trip-black.vercel.app",
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on(EVENTS.CONNECTION, (socket) => {
    console.log("⚡ User Connected:", socket.id);

    userSocket(io, socket, userSocketMap, userLastSeen);
    communitySocket(io, socket, communityRooms, typingMap);
    chatSocket(io, socket);
    tripSocket(io, socket);
  });

  return io;
}

export const getSocket = () => io;

export const emitToUser = (userId, event, data) => {
  const socketId = userSocketMap[userId];
  if (socketId) io.to(socketId).emit(event, data);
};

export const emitToCommunity = (communityId, event, data) => {
  if (!io || !communityId) return;
  io.to(String(communityId)).emit(event, data);
};

export const emitToRoom = (roomId, event, payload) => {
  io.to(`room:${roomId}`).emit(event, payload);
};

export const emitToMessage = (messageId, event, data) => {
  if (!io || !messageId) return;
  io.to(`message:${String(messageId)}`).emit(event, data);
};

export const emitToTrip = (tripId, event, payload) => {
  if (!io || !tripId) return;
  io.to(`trip:${String(tripId)}`).emit(event, payload);
};

export const isUserOnline = (id) => !!userSocketMap[id];
