import { EVENTS } from "./events.js";

export default function communitySocket(io, socket, communityRooms, typingMap) {
  // 🔥 FIX: read userId consistently
  const userId =
    socket.handshake.auth?.userId || socket.handshake.query?.userId;

  // ---------------- JOIN COMMUNITY ----------------
  socket.on(EVENTS.COMMUNITY_JOIN, (communityId) => {
    if (!communityId) return;

    const cid = String(communityId);
    socket.join(cid);

    console.log(`✅ User ${userId} joined community room ${cid}`);

    if (!communityRooms[cid]) communityRooms[cid] = new Set();
    if (userId) communityRooms[cid].add(userId);

    io.to(cid).emit(EVENTS.COMMUNITY_COUNT, {
      communityId: cid,
      online: communityRooms[cid].size,
    });
  });

  // ---------------- LEAVE COMMUNITY ----------------
  socket.on(EVENTS.COMMUNITY_LEAVE, (communityId) => {
    if (!communityId) return;

    const cid = String(communityId);
    socket.leave(cid);

    if (communityRooms[cid] && userId) {
      communityRooms[cid].delete(userId);

      io.to(cid).emit(EVENTS.COMMUNITY_COUNT, {
        communityId: cid,
        online: communityRooms[cid].size,
      });
    }
  });

  // ---------------- TYPING ----------------
  socket.on(EVENTS.COMMUNITY_TYPING, ({ communityId, isTyping }) => {
    if (!communityId) return;
    socket.to(String(communityId)).emit(EVENTS.COMMUNITY_TYPING, {
      userId,
      isTyping,
    });
  });

  // ---------------- DISCONNECT CLEANUP ----------------
  socket.on(EVENTS.DISCONNECT, () => {
    Object.keys(communityRooms).forEach((cid) => {
      communityRooms[cid]?.delete(userId);
    });
  });
}
