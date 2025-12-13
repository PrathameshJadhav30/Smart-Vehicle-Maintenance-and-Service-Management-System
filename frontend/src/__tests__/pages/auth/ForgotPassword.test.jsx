import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '../../../pages/auth/ForgotPassword';
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
      {error && <span data-testid="error">{error}</span>}
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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => <a href={to}>{children}</a>
  };
});

describe('ForgotPassword', () => {
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

  test('renders forgot password form', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Send Reset Instructions')).toBeInTheDocument();
  });

  test('shows validation error when email is empty', async () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    const submitButton = screen.getByText('Send Reset Instructions');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('Email is required');
    });
  });

  test('shows validation error when email is invalid', async () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByText('Send Reset Instructions');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByTestId('error')).toHaveTextContent('Email is invalid');
    });
  });

  test('shows success message and displays confirmation screen on successful submission', async () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const submitButton = screen.getByText('Send Reset Instructions');
    fireEvent.click(submitButton);

    // Fast-forward the timer
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
      expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
      expect(mockShowToast.success).toHaveBeenCalledWith('Password reset instructions sent to your email');
    });
  });

  test('allows user to try again after submission', async () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // Submit form
    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const submitButton = screen.getByText('Send Reset Instructions');
    fireEvent.click(submitButton);

    // Fast-forward the timer
    vi.advanceTimersByTime(1000);

    // Wait for confirmation screen
    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeInTheDocument();
    });

    // Click try again button
    const tryAgainButton = screen.getByText('try again');
    fireEvent.click(tryAgainButton);

    // Should show form again
    expect(screen.getByText('Reset Your Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  test('shows error message when submission fails', async () => {
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
        <ForgotPassword />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const submitButton = screen.getByText('Send Reset Instructions');
    fireEvent.click(submitButton);

    // Fast-forward the timer
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockShowToast.error).toHaveBeenCalledWith('Failed to send reset instructions');
    });

    // Restore original setTimeout
    global.setTimeout = originalTimeout;
  });
});