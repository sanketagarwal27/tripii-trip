// utils/roomStatus.js

/**
 * Computes the actual room status based on current time and date range
 */
export const computeRoomStatus = (room) => {
  if (!room) return null;

  // Cancelled rooms stay cancelled
  if (room.status === "cancelled") return "cancelled";

  // If no dates, return stored status
  if (!room.startDate || !room.endDate) return room.status;

  const now = new Date();
  const start = new Date(room.startDate);
  const end = new Date(room.endDate);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "active";
  if (now > end) return "finished";

  return room.status;
};

/**
 * Enriches a room object with computed status
 */
export const enrichRoomWithStatus = (room) => {
  if (!room) return null;

  return {
    ...room,
    computedStatus: computeRoomStatus(room),
  };
};

/**
 * Enriches an array of rooms with computed statuses
 */
export const enrichRoomsWithStatus = (rooms) => {
  if (!Array.isArray(rooms)) return [];
  return rooms.map(enrichRoomWithStatus);
};
