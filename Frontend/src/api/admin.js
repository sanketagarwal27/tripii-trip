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
