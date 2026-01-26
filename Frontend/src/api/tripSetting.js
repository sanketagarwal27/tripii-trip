// src/api/tripSetting.js
import api from "./axios";

/* ================= CAPABILITIES ================= */

/**
 * Get user capabilities for a trip
 * @param {string} tripId
 */
export const getTripCapabilities = (tripId) =>
  api.get(`/api/trip/trips/${tripId}/capabilities`, {
    withCredentials: true,
  });

/* ================= VISIBILITY ================= */

/**
 * Update trip visibility
 * @param {string} tripId
 * @param {"private" | "public"} visibility
 */
export const updateTripVisibility = (tripId, visibility) =>
  api.patch(
    `/api/trip/trips/${tripId}/visibility`,
    { visibility },
    { withCredentials: true },
  );

/* ================= MEMBERS ================= */

/**
 * Add member to trip
 * @param {string} tripId
 * @param {string} userId - MongoDB ObjectId of the user
 */
export const addTripMember = (tripId, userId) =>
  api.post(
    `/api/trip/trips/${tripId}/members`,
    { userId },
    { withCredentials: true },
  );

/**
 * Remove member from trip
 * @param {string} tripId
 * @param {string} memberId - MongoDB ObjectId of the member
 */
export const removeTripMember = (tripId, memberId) =>
  api.delete(`/api/trip/trips/${tripId}/members/${memberId}`, {
    withCredentials: true,
  });

/**
 * Leave trip (self)
 * @param {string} tripId
 */
export const leaveTrip = (tripId) =>
  api.post(
    `/api/trip/trips/${tripId}/leave`,
    {},
    {
      withCredentials: true,
    },
  );

/* ================= ROLES ================= */

/**
 * Assign role to member
 * @param {string} tripId
 * @param {Object} payload
 * @param {string} payload.roleName - Name of the role
 * @param {string} payload.assignedTo - MongoDB ObjectId of the user
 */
export const assignTripRole = (tripId, payload) =>
  api.post(`/api/trip/trips/${tripId}/roles`, payload, {
    withCredentials: true,
  });

/**
 * Remove role from member
 * @param {string} tripId
 * @param {string} roleId - MongoDB ObjectId of the role
 */
export const removeTripRole = (tripId, roleId) =>
  api.delete(`/api/trip/trips/${tripId}/roles/${roleId}`, {
    withCredentials: true,
  });

/* ================= COVER PHOTO ================= */

/**
 * Update trip cover photo
 * @param {string} tripId
 * @param {File} file - Image file
 */
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

/**
 * Publish trip to community
 * @param {string} tripId
 * @param {string} communityId
 * @param {Object} payload
 * @param {string[]} payload.roomTags
 * @param {boolean} payload.isEphemeral
 */
export const publishTripToCommunity = (tripId, communityId, payload = {}) =>
  api.post(`/api/trip/trips/${tripId}/publish/${communityId}`, payload, {
    withCredentials: true,
  });
