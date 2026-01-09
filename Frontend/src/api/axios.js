// src/api/axios.js
import axios from "axios";
import { store } from "@/redux/store";
import { logoutUser } from "@/redux/authslice";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    // 🔒 Ignore auth routes (login / google / refresh)
    if (url?.includes("/api/auth")) {
      return Promise.reject(error);
    }

    // 🚫 Forbidden → real access issue
    if (status === 403) {
      toast.error("Access denied. Your account has been suspended.");
      store.dispatch(logoutUser());
      return Promise.reject(error);
    }

    // ⏳ Unauthorized → session expired
    if (status === 401) {
      toast.error("Session expired. Please login again.");
      store.dispatch(logoutUser());
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
