import axios from 'axios';
import { refreshAccessToken } from './authService';

// Get API base URL from environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request as retried
      
      // Try to refresh the access token
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        // Update the Authorization header with new token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Retry the original request
        return api(originalRequest);
      }
      
      // If refresh failed, redirect to login
      window.location.href = '/login';
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Log access denied but don't automatically redirect
      console.error('Access forbidden:', error.response?.data?.message || 'You do not have permission to access this resource');
    }
    
    // Handle 429 Too Many Requests (Rate Limiting)
    if (error.response?.status === 429) {
      const rateLimitMessage = error.response?.data?.error || 'Too many requests. Please try again later.';
      console.warn('Rate limit exceeded:', rateLimitMessage);
      
      // Dispatch a custom event for the UI to handle
      window.dispatchEvent(new CustomEvent('rateLimitExceeded', {
        detail: { message: rateLimitMessage }
      }));
    }
    
    return Promise.reject(error);
  }
);

export default api;