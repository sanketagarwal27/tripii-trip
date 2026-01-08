// src/api/axios.js
import axios from "axios";
import { store } from "@/redux/store";
import { logoutUser } from "@/redux/authslice";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000",
  withCredentials: true,
});

// ✅ Add response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear auth state on 401 or 403 errors
      if (error.response.status === 403) {
        toast.error("Access denied. Your account has been suspended.");
      } else {
        toast.error("Session expired. Please login again.");
      }
      store.dispatch(logoutUser());
    }
    return Promise.reject(error);
  }
);

export default api;
