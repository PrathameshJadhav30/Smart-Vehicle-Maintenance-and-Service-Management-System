import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from '../../../pages/auth/ResetPassword';
import { useToast } from '../../contexts/ToastContext';

// Mock the ToastContext
vi.mock('../../contexts/ToastContext', () => ({
  useToast: vi.fn()
}));

// Mock the components
vi.mock('../../components/Input', () => ({
  __esModule: true,
  default: ({ label, error, ...props }) => (
    <div>
      <label>{label}</label>
      <input {...props} />
      {error && <span data-testid={`error-${props.name}`}>{error}</span>}
    </div>
  )
}));

vi.mock('../../components/Button', () => ({
  __esModule: true,
  default: ({ children, loading, ...props }) => (
    <button {...props} disabled={loading}>
      {children}
      {loading && <span>Loading...</span>}
    </button>
  )
}));

vi.mock('../../layouts/AuthLayout', () => ({
  __esModule: true,
  default: ({ title, children }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

// Mock useNavigate and useSearchParams
const mockNavigate = vi.fn();
const mockSearchParams = new Map();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
    Link: ({ children, to }) => <a href={to}>{children}</a>
  };
});

describe('ResetPassword', () => {
  const mockShowToast = {
    success: vi.fn(),
    error: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useToast.mockReturnValue(mockShowToast);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders reset password form', () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    expect(screen.getByText('Set New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
  });

  test('shows validation errors when form is submitted empty', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    const submitButton = screen.getByText('Reset Password');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-password')).toBeInTheDocument();
      expect(screen.getByTestId('error-password')).toHaveTextContent('Password is required');
    });
  });

  test('shows password length error when password is too short', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('New Password');
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const submitButton = screen.getByText('Reset Password');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-password')).toBeInTheDocument();
      expect(screen.getByTestId('error-password')).toHaveTextContent('Password must be at least 6 characters');
    });
  });

  test('shows password mismatch error when passwords do not match', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });

    const submitButton = screen.getByText('Reset Password');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-confirmPassword')).toBeInTheDocument();
      expect(screen.getByTestId('error-confirmPassword')).toHaveTextContent('Passwords do not match');
    });
  });

  test('shows success message and displays confirmation screen on successful password reset', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByText('Reset Password');
    fireEvent.click(submitButton);

    // Fast-forward the timer
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Password reset successful')).toBeInTheDocument();
      expect(mockShowToast.success).toHaveBeenCalledWith('Password reset successfully');
    });
  });

  test('allows user to navigate to login after successful reset', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Submit form with valid passwords
    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByText('Reset Password');
    fireEvent.click(submitButton);

    // Fast-forward the timer
    vi.advanceTimersByTime(1000);

    // Wait for confirmation screen
    await waitFor(() => {
      expect(screen.getByText('Password reset successful')).toBeInTheDocument();
    });

    // Click sign in link
    const signInLink = screen.getByText('Sign in to your account');
    expect(signInLink).toHaveAttribute('href', '/login');
  });

  test('shows error message when password reset fails', async () => {
    // Mock the setTimeout to throw an error
    const originalTimeout = setTimeout;
    global.setTimeout = (callback) => {
      callback = () => {
        throw new Error('Network error');
      };
      return originalTimeout(callback, 0);
    };

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByText('Reset Password');
    fireEvent.click(submitButton);

    // Fast-forward the timer
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockShowToast.error).toHaveBeenCalledWith('Failed to reset password');
    });

    // Restore original setTimeout
    global.setTimeout = originalTimeout;
  });
});