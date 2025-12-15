import { EVENTS } from "./events.js";

export default function userSocket(io, socket, userSocketMap, userLastSeen) {
  // 🔥 FIX: Read from auth, not query
  const userId =
    socket.handshake.auth?.userId || socket.handshake.query?.userId;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    userLastSeen[userId] = Date.now();

    console.log(`✅ User ${userId} authenticated with socket ${socket.id}`);

    io.emit(EVENTS.ONLINE_USERS, Object.keys(userSocketMap));
  } else {
    console.warn(`⚠️ Socket ${socket.id} connected without valid userId`);
  }

  socket.on(EVENTS.DISCONNECT, () => {
    if (userId) {
      delete userSocketMap[userId];
      userLastSeen[userId] = Date.now();

      io.emit(EVENTS.ONLINE_USERS, Object.keys(userSocketMap));
    }
  });
}
