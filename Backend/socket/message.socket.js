// import { EVENTS } from "./events.js";

// /**
//  * Handles MESSAGE-LEVEL socket logic
//  * (comments, reactions, typing inside a single message)
//  *
//  * Room format:
//  *   message:<messageId>
//  */
// export default function messageSocket(io, socket) {
//   // 🔥 Keep userId resolution CONSISTENT with community.socket.js
//   const userId =
//     socket.handshake.auth?.userId || socket.handshake.query?.userId;

//   /* -------------------------------------------------
//    * JOIN MESSAGE (COMMENT ROOM)
//    * ------------------------------------------------- */
//   socket.on(EVENTS.MESSAGE_COMMENT_JOIN, ({ messageId }) => {
//     if (!messageId) return;

//     const roomId = `message:${messageId}`;
//     socket.join(roomId);

//     console.log(`🧵 User ${userId || socket.id} joined message room ${roomId}`);
//   });

//   /* -------------------------------------------------
//    * LEAVE MESSAGE (COMMENT ROOM)
//    * ------------------------------------------------- */
//   socket.on(EVENTS.MESSAGE_COMMENT_LEAVE, ({ messageId }) => {
//     if (!messageId) return;

//     const roomId = `message:${messageId}`;
//     socket.leave(roomId);

//     console.log(`🧵 User ${userId || socket.id} left message room ${roomId}`);
//   });

//   /* -------------------------------------------------
//    * OPTIONAL: COMMENT TYPING INDICATOR (FUTURE-READY)
//    * ------------------------------------------------- */
//   socket.on(EVENTS.MESSAGE_COMMENT_TYPING, ({ messageId, isTyping }) => {
//     if (!messageId) return;

//     socket.to(`message:${messageId}`).emit(EVENTS.MESSAGE_COMMENT_TYPING, {
//       userId,
//       isTyping,
//     });
//   });

//   /* -------------------------------------------------
//    * DISCONNECT CLEANUP
//    * ------------------------------------------------- */
//   socket.on(EVENTS.DISCONNECT, () => {
//     // No manual cleanup needed.
//     // Socket.IO automatically removes socket from all rooms.
//     console.log(`❌ Message socket disconnected: ${socket.id}`);
//   });
// }
