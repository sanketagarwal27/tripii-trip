// src/api/room.js
import api from "./axios";

export const createRoom = (communityId, formData) =>
  api.post(`/api/community/createRoom/${communityId}`, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getRoomMessages = (roomId, params) =>
  api.get(`/api/community/${roomId}/RoomMessage`, { params });

export const sendRoomMessage = (roomId, data) =>
  api.post(`/api/community/${roomId}/sendMessage`, data, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const reactToRoomMessage = (messageId, emoji) =>
  api.post(
    `/api/community/${messageId}/react`,
    { emoji },
    { withCredentials: true }
  );

export const deleteRoomMessage = (messageId) =>
  api.delete(`/api/community/${messageId}/deleteMessage`, {
    withCredentials: true,
  });

export const updateRoom = (roomId, payload) =>
  api.patch(`/api/community/updateRoom/${roomId}`, payload, {
    withCredentials: true,
  });

export const getRoomDetails = (roomId) =>
  api.get(`/api/community/room/${roomId}`, {
    withCredentials: true,
  });

// 🔥 NEW: Join room function
export const joinRoom = (roomId) =>
  api.post(
    `/api/community/joinRoom/${roomId}`,
    {},
    {
      withCredentials: true,
    }
  );
