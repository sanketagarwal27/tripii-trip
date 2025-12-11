// src/api/axios.js
import axios from "axios";
import { store } from "@/redux/store";
import { logoutUser } from "@/redux/authslice";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:8000",
  withCredentials: true,
});

// ✅ Add response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state on 401
      store.dispatch(logoutUser());
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;
