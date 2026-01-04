export const EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  USER_ONLINE: "userOnline",
  USER_OFFLINE: "userOffline",
  ONLINE_USERS: "onlineUsers",

  /* ================= COMMUNITY ================= */
  COMMUNITY_JOIN: "joinCommunity",
  COMMUNITY_LEAVE: "leaveCommunity",
  COMMUNITY_COUNT: "communityOnlineCount",
  COMMUNITY_TYPING: "communityTyping",

  MESSAGE_JOIN: "message:join",
  MESSAGE_LEAVE: "message:leave",

  MESSAGE_SEND: "messageSend",
  MESSAGE_RECEIVE: "messageReceive",

  POST_LIKED: "postLiked",
  COMMENT_ADDED: "commentAdded",

  /* ================= ROOMS ================= */
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",

  ROOM_MESSAGE_NEW: "room:message:new",
  ROOM_MESSAGE_DELETED: "room:message:deleted",
  ROOM_REACTION_UPDATED: "room:reaction:updated",
  ROOM_USER_JOINED: "room:userJoined",

  /* ================= TRIPS ================= */
  TRIP_JOIN: "trip:join",
  TRIP_LEAVE: "trip:leave",

  ITINERARY_CREATED: "itinerary:created",
  ITINERARY_UPDATED: "itinerary:updated",
  ITINERARY_DELETED: "itinerary:deleted",
  ITINERARY_REORDERED: "itinerary:reordered",
  ITINERARY_AI_ADDED: "itinerary:ai:added",

  /* ================= TRIP GALLERY ================= */
  TRIP_PHOTO_UPLOADED: "trip:photo:uploaded", // local upload (single or batch)
  TRIP_PHOTO_PUSHED: "trip:photo:pushed", // local → global
  TRIP_PHOTO_DELETED: "trip:photo:deleted", // deleted from local/global

  /* ================= TRIP WALLET ================= */
  WALLET_EXPENSE_ADDED: "wallet:expense:added",
  WALLET_EXPENSE_UPDATED: "wallet:expense:updated",
  WALLET_EXPENSE_DELETED: "wallet:expense:deleted",

  WALLET_SETTINGS_UPDATED: "wallet:settings:updated",

  WALLET_SETTLEMENTS_GENERATED: "wallet:settlements:generated",
  WALLET_SETTLEMENT_CONFIRMED: "wallet:settlement:confirmed",

  WALLET_ACCOUNTANT_ASSIGNED: "wallet:accountant:assigned",
  WALLET_ACCOUNTANT_REMOVED: "wallet:accountant:removed",
};
