import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../../../pages/auth/Register';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

// Mock the contexts
const mockUseAuth = vi.fn();
const mockUseToast = vi.fn();

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => mockUseToast()
}));

// Mock the components
vi.mock('../../../components/Input', () => ({
  __esModule: true,
  default: ({ label, id, error, ...props }) => (
    <div>
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} {...props} />
      {error && <p className="mt-1 text-sm text-red-500" data-testid="error">{error}</p>}
    </div>
  )
}));

vi.mock('../../../components/Select', () => ({
  __esModule: true,
  default: ({ label, id, error, options, ...props }) => (
    <div>
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} {...props}>
        {options && options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500" data-testid="error">{error}</p>}
    </div>
  )
}));

vi.mock('../../../components/Button', () => ({
  __esModule: true,
  default: ({ children, loading, ...props }) => (
    <button {...props} disabled={loading}>
      {children}
      {loading && <span>Loading...</span>}
    </button>
  )
}));

vi.mock('../../../layouts/AuthLayout', () => ({
  __esModule: true,
  default: ({ title, children }) => (
    <div>
      <h1 data-testid="page-title">{title}</h1>
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

describe('Register', () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockShowToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ 
      login: mockLogin, 
      register: mockRegister 
    });
    mockUseToast.mockReturnValue({ showToast: mockShowToast });
  });

  test('renders register form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByTestId('page-title')).toHaveTextContent('Create Account');
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  test('shows validation error when password is too short', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });

    // Use fireEvent.click on the submit button
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toHaveTextContent('Password must be at least 6 characters');
  });

  test('shows validation error when passwords do not match', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });

    // Use fireEvent.click on the submit button
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toHaveTextContent('Passwords do not match');
  });

  test('shows validation error when password is too short', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });

    // Use fireEvent.click on the submit button
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toHaveTextContent('Password must be at least 6 characters');
  });

  test('submits form with valid data', async () => {
    mockRegister.mockResolvedValue({
      success: true,
      data: {
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        token: 'fake-jwt-token'
      }
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    // Use fireEvent.click on the submit button
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);

    expect(mockRegister).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'customer'
    });
  });
});