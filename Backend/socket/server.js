import { Server } from "socket.io";
import userSocket from "./user.socket.js";
import communitySocket from "./community.socket.js";
import chatSocket from "./chat.socket.js";
import { EVENTS } from "./events.js";

let io = null;

const userSocketMap = {};
const userLastSeen = {};
const communityRooms = {};
const typingMap = {};

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
    transports: ["websocket"],
  });

  io.on(EVENTS.CONNECTION, (socket) => {
    console.log("⚡ User Connected:", socket.id);

    userSocket(io, socket, userSocketMap, userLastSeen);
    communitySocket(io, socket, communityRooms, typingMap);
    chatSocket(io, socket);
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

export const emitToRoom = (roomId, event, data) => {
  if (!io) return;
  io.to(roomId).emit(event, data);
};

export const isUserOnline = (id) => !!userSocketMap[id];
