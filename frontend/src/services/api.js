import axios from 'axios';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear auth token but don't automatically redirect
      // Let the ProtectedRoute handle the redirect
      localStorage.removeItem('token');
      // Remove authorization header
      delete api.defaults.headers.common['Authorization'];
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      // Log access denied but don't automatically redirect
      console.error('Access forbidden:', error.response?.data?.message || 'You do not have permission to access this resource');
    }
    
    return Promise.reject(error);
  }
);

export default api;