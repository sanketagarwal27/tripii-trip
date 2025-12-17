import { EVENTS } from "./events.js";
import { CommunityMembership } from "../models/community/communityMembership.model.js";
import { MessageInComm } from "../models/community/messageInComm.model.js";

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

  // ---------------- JOIN MESSAGE ROOM ----------------
  socket.on(EVENTS.MESSAGE_JOIN, (messageId) => {
    if (!messageId) return;
    const mid = String(messageId);
    socket.join(`message:${mid}`);
    console.log(`✅ User ${userId} joined message room ${mid}`);
  });

  // ---------------- LEAVE MESSAGE ROOM ----------------
  socket.on(EVENTS.MESSAGE_LEAVE, (messageId) => {
    if (!messageId) return;
    socket.leave(`message:${String(messageId)}`);
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

  // Add this in your communitySocket function in the backend

  socket.on("sync:request", async () => {
    try {
      if (!userId) {
        socket.emit("sync:error", { message: "User not authenticated" });
        return;
      }

      // Get user's communities
      const userMemberships = await CommunityMembership.find({
        user: userId,
      })
        .select("community")
        .lean();

      const communityIds = userMemberships.map((m) => m.community);

      if (communityIds.length === 0) {
        socket.emit("sync:community:messages", { messages: [] });
        return;
      }

      // Get recent messages from last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const recentMessages = await MessageInComm.find({
        community: { $in: communityIds },
        createdAt: { $gte: fiveMinutesAgo },
      })
        .populate("sender", "username profilePicture")
        .populate("community", "name")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      socket.emit("sync:community:messages", {
        messages: recentMessages,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `✅ Synced ${recentMessages.length} messages for user ${userId}`
      );
    } catch (err) {
      console.error("Sync failed:", err);
      socket.emit("sync:error", { message: "Sync failed" });
    }
  });
}
