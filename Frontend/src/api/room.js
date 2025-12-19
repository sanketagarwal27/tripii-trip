import api from "./axios";

//Rooms
export const createRoom = (communityId, formData) =>
  api.post(`/api/community/createRoom/${communityId}`, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
