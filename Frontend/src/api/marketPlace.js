import api from "./api"; // <-- your axios instance

/**
 * ================================
 * BUSINESS LISTING (USER SIDE)
 * ================================
 */

/**
 * Submit or update business listing form
 * @param {FormData} formData
 */
export const submitBusinessListing = (formData) => {
  return api.post("/api/businesslisting/listingformsubmit", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
