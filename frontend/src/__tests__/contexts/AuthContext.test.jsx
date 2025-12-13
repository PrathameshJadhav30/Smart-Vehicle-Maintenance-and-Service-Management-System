import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import axios from '../../services/api';

// Mock axios
vi.mock('../../services/api');

// Create a test component that uses the auth context
const TestComponent = () => {
  const {
    user,
    isAuthenticated,
    role,
    loading,
    login,
    logout,
    register,
    hasRole,
    hasAnyRole
  } = useAuth();

  return (
    <div>
      <div data-testid="auth-state">
        {JSON.stringify({ user, isAuthenticated, role, loading })}
      </div>
      <button data-testid="login-btn" onClick={() => login({ email: 'test@example.com', password: 'password' })}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button data-testid="register-btn" onClick={() => register({ name: 'Test User', email: 'test@example.com', password: 'password' })}>
        Register
      </button>
      <div data-testid="has-role-admin">{hasRole('admin') ? 'true' : 'false'}</div>
      <div data-testid="has-any-role">{hasAnyRole(['admin', 'mechanic']) ? 'true' : 'false'}</div>
    </div>
  );
};

// Wrapper component with AuthProvider
const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  test('provides initial state', () => {
    render(<TestComponent />, { wrapper });
    
    const authState = screen.getByTestId('auth-state');
    expect(authState.textContent).toBe(JSON.stringify({
      user: null,
      isAuthenticated: false,
      role: null,
      loading: false
    }));
  });

  test('login function updates state on success', async () => {
    const user = userEvent.setup();
    
    const mockLoginResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'customer' }
      }
    };
    
    axios.post.mockResolvedValue(mockLoginResponse);
    
    render(<TestComponent />, { wrapper });
    
    await user.click(screen.getByTestId('login-btn'));
    
    // Wait for the state to update
    await waitFor(() => {
      const authState = screen.getByTestId('auth-state');
      expect(authState.textContent).toBe(JSON.stringify({
        user: mockLoginResponse.data.user,
        isAuthenticated: true,
        role: 'customer',
        loading: false
      }));
    });
  });

  test('login function handles failure', async () => {
    const user = userEvent.setup();
    
    axios.post.mockRejectedValue({
      response: {
        data: {
          message: 'Invalid credentials'
        }
      }
    });
    
    render(<TestComponent />, { wrapper });
    
    await user.click(screen.getByTestId('login-btn'));
    
    // State should remain unchanged
    await waitFor(() => {
      const authState = screen.getByTestId('auth-state');
      expect(authState.textContent).toBe(JSON.stringify({
        user: null,
        isAuthenticated: false,
        role: null,
        loading: false
      }));
    });
  });

  test('logout function clears state', async () => {
    const user = userEvent.setup();
    
    // First login
    const mockLoginResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'customer' }
      }
    };
    
    axios.post.mockResolvedValueOnce(mockLoginResponse);
    
    render(<TestComponent />, { wrapper });
    
    // Login first
    await user.click(screen.getByTestId('login-btn'));
    
    // Wait for login to complete
    await waitFor(() => {
      const authState = screen.getByTestId('auth-state');
      expect(authState.textContent).toBe(JSON.stringify({
        user: mockLoginResponse.data.user,
        isAuthenticated: true,
        role: 'customer',
        loading: false
      }));
    });
    
    // Then logout
    await user.click(screen.getByTestId('logout-btn'));
    
    // State should be back to initial
    await waitFor(() => {
      const authState = screen.getByTestId('auth-state');
      expect(authState.textContent).toBe(JSON.stringify({
        user: null,
        isAuthenticated: false,
        role: null,
        loading: false
      }));
    });
  });

  test('register function calls axios', async () => {
    const user = userEvent.setup();
    
    const mockRegisterResponse = {
      data: {
        message: 'User registered successfully'
      }
    };
    
    axios.post.mockResolvedValue(mockRegisterResponse);
    
    render(<TestComponent />, { wrapper });
    
    await user.click(screen.getByTestId('register-btn'));
    
    expect(axios.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password'
    });
  });

  test('hasRole function returns correct value', async () => {
    const user = userEvent.setup();
    
    // Initially should be false
    render(<TestComponent />, { wrapper });
    expect(screen.getByTestId('has-role-admin').textContent).toBe('false');
    
    // After login as customer, should still be false
    const mockLoginResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'customer' }
      }
    };
    
    axios.post.mockResolvedValueOnce(mockLoginResponse);
    
    await user.click(screen.getByTestId('login-btn'));
    
    // Wait for login to complete
    await waitFor(() => {
      const authState = screen.getByTestId('auth-state');
      expect(authState.textContent).toBe(JSON.stringify({
        user: mockLoginResponse.data.user,
        isAuthenticated: true,
        role: 'customer',
        loading: false
      }));
    });
    
    expect(screen.getByTestId('has-role-admin').textContent).toBe('false');
  });

  test('hasAnyRole function returns correct value', async () => {
    const user = userEvent.setup();
    
    // Initially should be false
    render(<TestComponent />, { wrapper });
    expect(screen.getByTestId('has-any-role').textContent).toBe('false');
    
    // After login as customer, should still be false
    const mockLoginResponse = {
      data: {
        token: 'test-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'customer' }
      }
    };
    
    axios.post.mockResolvedValueOnce(mockLoginResponse);
    
    await user.click(screen.getByTestId('login-btn'));
    
    // Wait for login to complete
    await waitFor(() => {
      const authState = screen.getByTestId('auth-state');
      expect(authState.textContent).toBe(JSON.stringify({
        user: mockLoginResponse.data.user,
        isAuthenticated: true,
        role: 'customer',
        loading: false
      }));
    });
    
    expect(screen.getByTestId('has-any-role').textContent).toBe('false');
  });
});