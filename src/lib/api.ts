import axios from "axios";
import { getToken, removeToken } from "./auth";

// Use our own Next.js API proxy to avoid CORS issues
// Browser → /api/proxy/auth/login → server → https://api.simpenakun.site/api/auth/login
const api = axios.create({
  baseURL: "/api/proxy",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on login attempt failure
      const isLoginRequest = error.config?.url?.includes("auth/login");
      if (!isLoginRequest) {
        removeToken();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
