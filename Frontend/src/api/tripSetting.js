// src/api/tripSetting.js
import api from "./axios";

/* ================= VISIBILITY ================= */

// Update trip visibility
export const updateTripVisibility = (tripId, visibility) =>
  api.patch(
    `/api/trip/trips/${tripId}/visibility`,
    { visibility },
    { withCredentials: true }
  );

/* ================= MEMBERS ================= */

// Add member to trip
export const addTripMember = (tripId, userId) =>
  api.post(
    `/api/trip/trips/${tripId}/members`,
    { userId },
    { withCredentials: true }
  );

// Remove member from trip
export const removeTripMember = (tripId, memberId) =>
  api.delete(`/api/trip/trips/${tripId}/members/${memberId}`, {
    withCredentials: true,
  });

// Leave trip (self)
export const leaveTrip = (tripId) =>
  api.post(`/api/trip/trips/${tripId}/leave`, {}, { withCredentials: true });

/* ================= ROLES ================= */

// Assign role to member
export const assignTripRole = (tripId, payload) =>
  api.post(`/api/trip/trips/${tripId}/roles`, payload, {
    withCredentials: true,
  });

/* ================= COVER PHOTO ================= */

// Update trip cover photo
export const updateTripCover = (tripId, file) => {
  const formData = new FormData();
  formData.append("coverPhoto", file);

  return api.patch(`/api/trip/trips/${tripId}/cover`, formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/* ================= COMMUNITY PUBLISH ================= */

// Publish trip to community
export const publishTripToCommunity = (tripId, communityId, payload = {}) =>
  api.post(`/api/trip/trips/${tripId}/publish/${communityId}`, payload, {
    withCredentials: true,
  });

export const getTripCapabilities = (tripId) =>
  api.get(`/api/trip/trips/${tripId}/capabilities`, { withCredentials: true });
