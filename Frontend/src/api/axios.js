// src/api/axios.js
import axios from "axios";
import { store } from "@/redux/store";
import { logoutUser } from "@/redux/authslice";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

// ✅ REQUEST INTERCEPTOR: Attach token from localStorage
api.interceptors.request.use(
  (config) => {
    // Try to get token from Redux store first
    const state = store.getState();
    let token = state.auth?.accessToken;

    // Fallback to localStorage if not in Redux
    if (!token) {
      token = localStorage.getItem("accessToken");
    }

    // ✅ DEBUG: Log token presence
    console.log("🔑 Token check:", {
      fromRedux: !!state.auth?.accessToken,
      fromLocalStorage: !!localStorage.getItem("accessToken"),
      hasToken: !!token,
      url: config.url,
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Added Authorization header");
    } else {
      console.warn("⚠️ No token found! Request will be unauthorized.");
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ✅ RESPONSE INTERCEPTOR: Handle 401/403 errors
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Success:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message,
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear localStorage tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");

      if (error.response.status === 403) {
        toast.error("Access denied. Your account has been suspended.");
      } else {
        toast.error("Session expired. Please login again.");
      }

      // Dispatch logout action
      store.dispatch(logoutUser());

      // Redirect to auth page (only if not already there)
      if (!window.location.pathname.includes("/auth")) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
