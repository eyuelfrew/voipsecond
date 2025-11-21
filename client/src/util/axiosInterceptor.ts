import axios from "axios";

/**
 * Setup axios interceptors for global error handling
 * Automatically handles 401 (Unauthorized) responses
 */
export const setupAxiosInterceptors = (onUnauthorized: () => void) => {
  // Response interceptor
  axios.interceptors.response.use(
    (response) => {
      // Return successful responses as-is
      return response;
    },
    (error) => {
      // Handle authentication errors
      if (error.response?.status === 401) {
        console.error("Unauthorized access - redirecting to login");
        onUnauthorized();
      }
      
      // Handle session timeout
      if (error.response?.status === 403 && error.response?.data?.message?.includes("session")) {
        console.error("Session expired - redirecting to login");
        onUnauthorized();
      }
      
      return Promise.reject(error);
    }
  );

  // Request interceptor to ensure credentials are always sent
  axios.interceptors.request.use(
    (config) => {
      config.withCredentials = true;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};
