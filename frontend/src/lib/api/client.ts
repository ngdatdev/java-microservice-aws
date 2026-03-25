import axios from "axios";
import { toast } from "sonner";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MASTER_SERVICE_URL || "http://localhost:8085",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding the bearer token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || "An unexpected error occurred";
    
    // Don't show toast for 401 as we might be redirecting to login
    if (error.response?.status !== 401) {
      toast.error("API Error", {
        description: message,
      });
    } else {
      // Handle unauthorized (clear local storage and redirect)
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        // We could redirect here if not already on the login page
      }
    }
    
    return Promise.reject(error);
  }
);

export const serviceUrls = {
  auth: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8084",
  member: process.env.NEXT_PUBLIC_MEMBER_SERVICE_URL || "http://localhost:8081",
  file: process.env.NEXT_PUBLIC_FILE_SERVICE_URL || "http://localhost:8082",
  mail: process.env.NEXT_PUBLIC_MAIL_SERVICE_URL || "http://localhost:8083",
  master: process.env.NEXT_PUBLIC_MASTER_SERVICE_URL || "http://localhost:8085",
};

export default apiClient;
