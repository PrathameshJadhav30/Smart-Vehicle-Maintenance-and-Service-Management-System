import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../components/ProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the useAuth hook to control the authentication state
const mockUseAuth = vi.fn();

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => mockUseAuth()
  };
});

// Mock the Navigate component from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Navigate: ({ to }) => {
      mockNavigate(to);
      return <div data-testid="navigate-mock">Navigated to {to}</div>;
    }
  };
});

describe('ProtectedRoute Component', () => {
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      role: null,
      loading: true
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    // Find the loading spinner by its classes
    const spinner = document.querySelector('.animate-spin.rounded-full.h-12.w-12');
    expect(spinner).toBeInTheDocument();
  });

  test('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      role: null,
      loading: false
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    expect(screen.getByTestId('navigate-mock')).toHaveTextContent('Navigated to /login');
  });

  test('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: 'customer',
      loading: false
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('redirects to login when user role is not in allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: 'customer',
      loading: false
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedRoute allowedRoles={['admin', 'mechanic']}>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('navigate-mock')).toBeInTheDocument();
    expect(screen.getByTestId('navigate-mock')).toHaveTextContent('Navigated to /login');
  });

  test('renders children when user role is in allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: 'admin',
      loading: false
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedRoute allowedRoles={['admin', 'mechanic']}>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('renders children when allowedRoles is not specified', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      role: 'customer',
      loading: false
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});