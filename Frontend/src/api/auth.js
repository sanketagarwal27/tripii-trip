// src/api/auth.js
import api from "./axios";

// LOGIN
export const loginRequest = (payload) =>
  api.post("/api/auth/login", payload, { withCredentials: true });

// REGISTER
export const registerRequest = (payload) =>
  api.post("/api/auth/register", payload, { withCredentials: true });

// GOOGLE LOGIN
export const googleLoginRequest = (credential) =>
  api.post("/api/auth/google", { credential }, { withCredentials: true });

// LOGOUT (THE MISSING ONE CAUSING YOUR ERROR)
export const logoutRequest = () =>
  api.post("/api/auth/logout", {}, { withCredentials: true });

// FETCH PROFILE
export const getUserProfile = async (userId) => {
  const response = await api.get(`/api/auth/profile/${userId}`, {
    withCredentials: true,
  });
  return response.data;
};

// Update Profile
export const updateUserProfile = async (payload) => {
  const response = await api.put("/api/auth/edit-profile", payload, {
    withCredentials: true,
  });
  return response.data;
};

export const getLoggedInUser = async () => {
  const response = await api.get("/api/auth/me", { withCredentials: true });
  return response.data;
};
