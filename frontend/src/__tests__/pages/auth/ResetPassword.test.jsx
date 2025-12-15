import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from '../../../pages/auth/ResetPassword';
import { useToast } from '../../../contexts/ToastContext';

// Mock the ToastContext
const mockUseToast = vi.fn();

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

describe('ResetPassword', () => {
  const mockShowToast = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue({ showToast: mockShowToast });
  });

  test('renders reset password form', () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    expect(screen.getByTestId('page-title')).toHaveTextContent('Set New Password');
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  test('shows validation error when password is too short', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('New Password');
    fireEvent.change(passwordInput, { target: { value: '123' } });

    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    fireEvent.change(confirmPasswordInput, { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    fireEvent.click(submitButton);

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toHaveTextContent('Password must be at least 6 characters');
  });

  test('shows validation error when passwords do not match', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText('New Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });

    const submitButton = screen.getByRole('button', { name: 'Reset Password' });
    fireEvent.click(submitButton);

    expect(screen.getByTestId('error')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toHaveTextContent('Passwords do not match');
  });
});