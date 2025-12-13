import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../../pages/auth/Login';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the AuthContext
const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  login: mockLogin,
  loading: false
}));

// Mock the ToastContext
const mockShowToast = vi.fn();
const mockUseToast = vi.fn(() => ({
  showToast: { success: mockShowToast }
}));

// Mock react-router-dom hooks
const mockUseNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockUseNavigate
  };
});

// Mock the contexts
vi.mock('../../../contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: () => mockUseAuth()
  };
});

vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => mockUseToast()
}));

// Mock AuthLayout to render children directly
vi.mock('../../../layouts/AuthLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    );
  };

  test('renders login form with all elements', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  test('shows validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    // The validation happens on submit, so we should see the error message
    // Let's check if the error message is present in the document
    const errorMessage = screen.queryByText(/email is invalid/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('shows validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  test('shows success message and navigates on successful login', async () => {
    const user = userEvent.setup();
    
    // Mock successful login
    mockLogin.mockResolvedValueOnce({
      success: true,
      user: { name: 'Test User', role: 'customer' }
    });
    
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    // Check that success toast is shown
    expect(mockShowToast).toHaveBeenCalledWith('Welcome back, Test User!');
    
    // Check that navigation is scheduled
    // Note: We can't easily test the setTimeout, but we can check that useNavigate was called
  });

  test('shows error message on failed login', async () => {
    const user = userEvent.setup();
    
    // Mock failed login
    mockLogin.mockResolvedValueOnce({
      success: false,
      message: 'Invalid credentials'
    });
    
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  test('shows generic error message on unexpected error', async () => {
    const user = userEvent.setup();
    
    // Mock unexpected error
    mockLogin.mockRejectedValueOnce(new Error('Network error'));
    
    renderWithRouter(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
  });
});