import api from "@/api/axios.js";

export const getAllContributions = async () => {
  const response = await api.get("/api/admin/contributions", {
    withCredentials: true,
  });
  return response.data;
};

export const approveContribution = async (contributionId) => {
  const response = await api.patch(
    `/api/admin/contributions/${contributionId}/approve`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const rejectContribution = async (contributionId) => {
  const response = await api.patch(
    `/api/admin/contributions/${contributionId}/reject`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const setContributionToPending = async (contributionId) => {
  const response = await api.patch(
    `/api/admin/contributions/${contributionId}/pending`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getRewardHistory = async () => {
  const response = await api.get(`/api/admin/get-reward-history`, {
    withCredentials: true,
  });
  return response.data;
};

export const awardRandomPoints = async (userId, xpPoints, trustScore) => {
  const response = await api.post(
    `/api/admin/award-random-points`,
    {
      userId: userId,
      xpPoints,
      trustScore,
    },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(`/api/admin/search-users?q=${query}`, {
    withCredentials: true,
  });
  return response.data;
};

export const sendOtp = async (userId) => {
  const response = await api.post(
    `/api/admin/${userId}/request-otp`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const promoteUserToAdmin = async (userId, otp) => {
  const response = await api.post(
    `/api/admin/promote-user/${userId}`,
    { otp },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const permanentDeleteUser = async (userId, otp) => {
  const response = await api.post(
    `/api/admin/permanent-delete-user/${userId}`,
    { otp },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const toggleUserBan = async (userId) => {
  const response = await api.post(
    `/api/admin/toggle-user-ban/${userId}`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const sendWarning = async (userId, subject, message) => {
  const response = await api.post(
    `/api/admin/send-warning/${userId}`,
    { subject, message },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const getUserStats = async () => {
  const response = await api.get(`/api/admin/user-stats`, {
    withCredentials: true,
  });
  return response.data;
};

export const getAppOverview = async () => {
  const response = await api.get(`/api/admin/app-overview`, {
    withCredentials: true,
  });
  return response.data;
};

export const getCommunities = async (params) => {
  const response = await api.get(
    "/api/admin/get-communities",
    { params },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const verifyCommunity = async (id) => {
  const response = await api.patch(`/api/admin/verify-community/:${id}`, {
    withCredentials: true,
  });
  return response.data;
};

export const updateCommunityStatus = async (id) => {
  const response = await api.patch(
    `/api/admin/update-community-status/:${id}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

export const deleteCommunity = async (id) => {
  const response = await api.delete(`/api/admin/delete-community/:${id}`, {
    withCredentials: true,
  });
  return response.data;
};

/* =====================================
   BUSINESS LISTINGS (MARKETPLACE ADMIN)
===================================== */

/**
 * Get all business listings (admin)
 * Filters: status, listingFor, search
 */
export const getAllBusinessListingsAdmin = async (params = {}) => {
  const response = await api.get("/api/admin/business-listings", {
    params,
    withCredentials: true,
  });
  return response.data;
};

/**
 * Get pending + under-review business listings
 */
export const getPendingBusinessListingsAdmin = async () => {
  const response = await api.get("/api/admin/business-listings/pending", {
    withCredentials: true,
  });
  return response.data;
};

/**
 * Get single business listing (full details for admin)
 */
export const getBusinessListingByIdAdmin = async (businessListingId) => {
  const response = await api.get(
    `/api/admin/business-listings/${businessListingId}`,
    {
      withCredentials: true,
    }
  );
  return response.data;
};

/**
 * Approve business listing (creates public Listing)
 */
export const approveBusinessListingAdmin = async (businessListingId) => {
  const response = await api.patch(
    `/api/admin/business-listings/${businessListingId}/approve`,
    {},
    {
      withCredentials: true,
    }
  );
  return response.data;
};

/**
 * Reject business listing
 */
export const rejectBusinessListingAdmin = async (businessListingId, reason) => {
  const response = await api.patch(
    `/api/admin/business-listings/${businessListingId}/reject`,
    { reason },
    {
      withCredentials: true,
    }
  );
  return response.data;
};

/**
 * Mark business listing as pending + send custom email
 */
export const pendingBusinessListingWithEmailAdmin = async (
  businessListingId,
  subject,
  message
) => {
  const response = await api.patch(
    `/api/admin/business-listings/${businessListingId}/pending`,
    { subject, message },
    {
      withCredentials: true,
    }
  );
  return response.data;
};
