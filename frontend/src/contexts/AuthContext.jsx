import { createContext, useContext, useReducer, useEffect } from 'react';
import axios from '../services/api';

// Initial state - always start without authentication
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  role: null,
  loading: false, // Start with loading false
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        role: action.payload.user.role,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        role: null,
        loading: false,
      };
    case 'LOADING':
      return {
        ...state,
        loading: true,
      };
    case 'STOP_LOADING':
      return {
        ...state,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload.user,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        // Set token in axios headers
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Verify token by making a request to get user profile
        try {
          const response = await axios.get('/auth/profile');
          const { user } = response.data;
          
          // Update state with user data
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { token, user } 
          });
        } catch (error) {
          // If token is invalid, remove it
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
    };
    
    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: 'LOADING' });
      
      const response = await axios.post('/auth/login', credentials);
      const { token, user } = response.data;
      
      // Set token in localStorage and axios headers
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      
      return { success: true, user };
    } catch (error) {
      dispatch({ type: 'STOP_LOADING' });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: 'LOADING' });
      const response = await axios.post('/auth/register', userData);
      dispatch({ type: 'STOP_LOADING' });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: 'STOP_LOADING' });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: { user: userData } });
  };

  // Check if user has required role
  const hasRole = (requiredRole) => {
    if (!state.isAuthenticated) return false;
    return state.role === requiredRole;
  };

  // Check if user has any of the required roles
  const hasAnyRole = (roles) => {
    if (!state.isAuthenticated) return false;
    return roles.includes(state.role);
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        updateUser,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;