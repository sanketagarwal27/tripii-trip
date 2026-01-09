import api from "./axios";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export const createTrip = (formData) =>
  api.post("/api/trip/createTrip", formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

/**
 * @param {Object} params
 * @param {number} params.page
 * @param {number} params.limit
 * @param {string} params.search
 */
export const getAllUserTripData = ({
  page = 1,
  limit = 15,
  search = "",
} = {}) =>
  api.get("/api/trip/myTrips/data", {
    withCredentials: true,
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  });

/* ===================== ITINERARY ===================== */

/**
 * Create a manual trip plan
 * @param {string} tripId
 * @param {Object} data
 * @param {string} data.title
 * @param {string} data.description
 * @param {string|Date} data.date
 * @param {{start?: string, end?: string}} data.time
 * @param {Object} data.location
 */
export const createTripPlan = (tripId, data) =>
  api.post(`/api/trip/trips/${tripId}/itinerary`, data, {
    withCredentials: true,
  });

/**
 * Reorder plans for a specific day
 * @param {string} tripId
 * @param {Object} data
 * @param {string|Date} data.date
 * @param {string[]} data.orderedPlanIds
 */
export const reorderTripPlans = (tripId, data) =>
  api.patch(`/api/trip/trips/${tripId}/itinerary/reorder`, data, {
    withCredentials: true,
  });

/**
 * Add AI-generated plans
 * @param {string} tripId
 * @param {Object} data
 * @param {Array} data.days
 */
export const addAiTripPlans = (tripId, data) =>
  api.post(`/api/trip/trips/${tripId}/itinerary/ai`, data, {
    withCredentials: true,
  });

export const updateItineraryPlan = (planId, data) =>
  api.patch(`/api/trip/trips/editPlan/${planId}`, data, {
    withCredentials: true,
  });

export const deleteItineraryPlan = (planId) =>
  api.delete(`/api/trip/trips/deletePlan/${planId}`, {
    withCredentials: true,
  });

/* ===================== TRIP GALLERY ===================== */

/**
 * ✅ FIXED: Upload photos to trip (LOCAL by default)
 * @param {string} tripId
 * @param {FormData} formData - Must contain:
 *   - photos: File[]
 *   - location[name]: string
 */
export const uploadTripPhotos = (tripId, formData) =>
  api.post(`/api/trip/trips/${tripId}/gallery/upload`, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000, // 60 seconds for large uploads
  });

/**
 * Get my local gallery photos
 * @param {string} tripId
 */
export const getMyLocalGallery = (tripId) =>
  api.get(`/api/trip/trips/${tripId}/gallery/local`, {
    withCredentials: true,
  });

/**
 * Get global trip gallery photos
 * @param {string} tripId
 */
export const getGlobalTripGallery = (tripId) =>
  api.get(`/api/trip/trips/${tripId}/gallery/global`, {
    withCredentials: true,
  });

/**
 * Push selected photos to global gallery
 * @param {string} tripId
 * @param {{ photoIds: string[] }} data
 */
export const pushPhotosToGlobal = (tripId, data) =>
  api.patch(`/api/trip/trips/${tripId}/gallery/push`, data, {
    withCredentials: true,
  });

/**
 * Like a photo
 * @param {string} photoId
 */
export const likeTripPhoto = (photoId) =>
  api.post(`/api/trip/trip-gallery/${photoId}/like`, null, {
    withCredentials: true,
  });

/**
 * Unlike a photo
 * @param {string} photoId
 */
export const unlikeTripPhoto = (photoId) =>
  api.delete(`/api/trip/trip-gallery/${photoId}/like`, {
    withCredentials: true,
  });

/**
 * Download photo (returns authorized download URL)
 * @param {string} photoId
 */
export const downloadTripPhoto = (photoId) =>
  api.get(`/api/trip/trip-gallery/${photoId}/download`, {
    withCredentials: true,
  });

/**
 * Toggle download permission (owner only)
 * @param {string} photoId
 * @param {{ allowDownload: boolean }} data
 */
export const togglePhotoDownloadPermission = (photoId, data) =>
  api.patch(`/api/trip/trip-gallery/${photoId}/download-permission`, data, {
    withCredentials: true,
  });

/**
 * Delete a photo
 * @param {string} photoId
 */
export const deleteTripPhoto = (photoId) =>
  api.delete(`/api/trip/trip-gallery/${photoId}`, {
    withCredentials: true,
  });

export const uploadTripPhotosXHR = (tripId, formData, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // ✅ IMPORTANT: FULL BACKEND URL
    xhr.open(
      "POST",
      `${API_BASE_URL}/api/trip/trips/${tripId}/gallery/upload`,
      true
    );

    // ✅ Send auth cookies
    xhr.withCredentials = true;

    // ❌ Never set Content-Type manually for FormData
    // Browser sets multipart boundary automatically

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded * 100) / e.total);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));

    xhr.send(formData);
  });

export const addTripPlace = (tripId, formData) =>
  api.post(`/api/trip/trips/${tripId}/places`, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteTripPlace = (tripId, placeId) =>
  api.delete(`/api/trip/trips/${tripId}/places/${placeId}`, {
    withCredentials: true,
  });

export const getPublicTripPreview = (tripId) =>
  api.get(`/api/trip/public/${tripId}`, {
    withCredentials: true,
  });
