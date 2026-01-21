/**
 * ================================
 * BUSINESS LISTING (USER SIDE)
 * ================================
 */

import api from "./axios";

/**
 * Submit or update business listing form
 * @param {FormData} formData
 */
export const submitBusinessListing = async (formData) => {
  const response = await api.post(
    "/api/businesslisting/listingformsubmit",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    }
  );

  return response.data;
};
