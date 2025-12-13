import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../../pages/auth/Register';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// Mock the contexts
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

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

vi.mock('../../components/Select', () => ({
  __esModule: true,
  default: ({ label, error, options, ...props }) => (
    <div>
      <label>{label}</label>
      <select {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('Register', () => {
  const mockRegister = vi.fn();
  const mockShowToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ register: mockRegister });
    useToast.mockReturnValue(mockShowToast);
  });

  test('renders registration form with all fields', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  test('shows validation errors when form is submitted empty', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-name')).toBeInTheDocument();
      expect(screen.getByTestId('error-email')).toBeInTheDocument();
      expect(screen.getByTestId('error-password')).toBeInTheDocument();
      expect(screen.getByTestId('error-role')).toBeInTheDocument();
    });
  });

  test('shows password mismatch error when passwords do not match', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('error-confirmPassword')).toBeInTheDocument();
      expect(screen.getByTestId('error-confirmPassword')).toHaveTextContent('Passwords do not match');
    });
  });

  test('shows success message and navigates to login on successful registration', async () => {
    mockRegister.mockResolvedValue({ success: true });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'customer' } });

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer'
      });
      
      expect(mockShowToast.success).toHaveBeenCalledWith('Registration successful!');
      expect(mockShowToast.info).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('shows error message when registration fails', async () => {
    mockRegister.mockResolvedValue({ success: false, message: 'Registration failed' });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'customer' } });

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockShowToast.error).toHaveBeenCalledWith('Registration failed');
    });
  });

  test('shows error message when registration throws an error', async () => {
    mockRegister.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'customer' } });

    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockShowToast.error).toHaveBeenCalledWith('An unexpected error occurred');
    });
  });

  test('clears error when user types in a field', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Submit empty form to trigger errors
    const submitButton = screen.getByText('Create Account');
    fireEvent.click(submitButton);

    // Wait for errors to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-name')).toBeInTheDocument();
    });

    // Type in the name field
    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'John' } });

    // Wait for the name error to disappear
    await waitFor(() => {
      expect(screen.queryByTestId('error-name')).not.toBeInTheDocument();
    });
  });
});