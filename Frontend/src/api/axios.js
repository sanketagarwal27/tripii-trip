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
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // 🔴 401 → ALWAYS logout
    if (status === 401) {
      forceLogout("Session expired. Please login again.");
      return Promise.reject(error);
    }

    // 🔴 403 → CONDITIONAL
    if (status === 403) {
      if (code === "ACCOUNT_SUSPENDED") {
        forceLogout("Your account has been suspended.");
      } else {
        // ❌ DO NOT LOGOUT
        // Let component handle it
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

function forceLogout(message) {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userId");

  toast.error(message);
  store.dispatch(logoutUser());

  if (!window.location.pathname.includes("/auth")) {
    window.location.href = "/auth";
  }
}

export default api;
