import * as authService from '../../services/authService';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should call api.post with correct parameters', async () => {
      const mockUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer'
      };
      
      const mockResponse = {
        data: {
          message: 'User registered successfully',
          token: 'jwt_token',
          user: mockUserData
        }
      };
      
      api.post.mockResolvedValue(mockResponse);
      
      const result = await authService.register(mockUserData);
      
      expect(api.post).toHaveBeenCalledWith('/auth/register', mockUserData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('login', () => {
    it('should call api.post with correct parameters', async () => {
      const email = 'john@example.com';
      const password = 'password123';
      
      const mockResponse = {
        data: {
          message: 'Login successful',
          token: 'jwt_token',
          user: { id: 1, email, role: 'customer' }
        }
      };
      
      api.post.mockResolvedValue(mockResponse);
      
      const result = await authService.login(email, password);
      
      expect(api.post).toHaveBeenCalledWith('/auth/login', { email, password });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getProfile', () => {
    it('should call api.get with correct endpoint', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, name: 'John Doe', email: 'john@example.com' }
        }
      };
      
      api.get.mockResolvedValue(mockResponse);
      
      const result = await authService.getProfile();
      
      expect(api.get).toHaveBeenCalledWith('/auth/profile');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateProfile', () => {
    it('should call api.put with correct parameters', async () => {
      const userId = '1';
      const userData = { name: 'John Updated', phone: '1234567890' };
      
      const mockResponse = {
        data: {
          message: 'Profile updated successfully',
          user: { id: 1, name: 'John Updated', phone: '1234567890' }
        }
      };
      
      api.put.mockResolvedValue(mockResponse);
      
      const result = await authService.updateProfile(userId, userData);
      
      expect(api.put).toHaveBeenCalledWith(`/auth/users/${userId}`, userData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAllUsers', () => {
    it('should call api.get and return users array', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ];
      
      const mockResponse = {
        data: {
          users: mockUsers
        }
      };
      
      api.get.mockResolvedValue(mockResponse);
      
      const result = await authService.getAllUsers();
      
      expect(api.get).toHaveBeenCalledWith('/users');
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array on error', async () => {
      api.get.mockRejectedValue(new Error('Network error'));
      
      const result = await authService.getAllUsers();
      
      expect(result).toEqual([]);
    });
  });
});