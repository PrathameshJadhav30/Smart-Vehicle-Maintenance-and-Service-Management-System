import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock axios
vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}));

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('throws error when useAuth is used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  test('provides initial state', () => {
    const wrapper = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('login function sets user and token on successful login', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, name: 'Test User', role: 'admin' }
      }
    };
    
    const axios = require('../../services/api').default;
    axios.post.mockResolvedValue(mockResponse);
    
    const wrapper = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      const response = await result.current.login({ email: 'test@example.com', password: 'password' });
      expect(response.success).toBe(true);
    });
    
    expect(result.current.user).toEqual({ id: 1, name: 'Test User', role: 'admin' });
    expect(result.current.token).toBe('test-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.role).toBe('admin');
  });

  test('login function handles login failure', async () => {
    const axios = require('../../services/api').default;
    axios.post.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });
    
    const wrapper = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      const response = await result.current.login({ email: 'test@example.com', password: 'wrong' });
      expect(response.success).toBe(false);
      expect(response.message).toBe('Invalid credentials');
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('logout function clears user and token', async () => {
    // First login
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, name: 'Test User', role: 'admin' }
      }
    };
    
    const axios = require('../../services/api').default;
    axios.post.mockResolvedValue(mockResponse);
    
    const wrapper = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });
    
    // Verify logged in
    expect(result.current.isAuthenticated).toBe(true);
    
    // Logout
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('register function handles registration', async () => {
    const mockResponse = {
      data: { message: 'User registered successfully' }
    };
    
    const axios = require('../../services/api').default;
    axios.post.mockResolvedValue(mockResponse);
    
    const wrapper = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      const response = await result.current.register({ name: 'Test', email: 'test@example.com', password: 'password' });
      expect(response.success).toBe(true);
    });
  });

  test('hasRole function checks user role correctly', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, name: 'Test User', role: 'admin' }
      }
    };
    
    const axios = require('../../services/api').default;
    axios.post.mockResolvedValue(mockResponse);
    
    const wrapper = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Before login
    expect(result.current.hasRole('admin')).toBe(false);
    
    // After login
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });
    
    expect(result.current.hasRole('admin')).toBe(true);
    expect(result.current.hasRole('user')).toBe(false);
  });

  test('hasAnyRole function checks multiple roles', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, name: 'Test User', role: 'mechanic' }
      }
    };
    
    const axios = require('../../services/api').default;
    axios.post.mockResolvedValue(mockResponse);
    
    const wrapper = ({ children }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });
    
    expect(result.current.hasAnyRole(['admin', 'mechanic'])).toBe(true);
    expect(result.current.hasAnyRole(['admin', 'user'])).toBe(false);
  });
});