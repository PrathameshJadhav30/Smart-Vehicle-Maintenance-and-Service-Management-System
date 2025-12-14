import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UsersManagementPage from '../../../pages/admin/UsersManagement';
import { useAuth } from '../../../contexts/AuthContext';
import * as authService from '../../../services/authService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/authService');

// Mock the Button component
vi.mock('../../../components/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, className, ...props }) => (
    <button 
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock the Modal component
vi.mock('../../../components/Modal', () => ({
  __esModule: true,
  default: ({ children, isOpen, onClose, title }) => (
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null
  )
}));

// Mock LoadingSpinner component
vi.mock('../../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>
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

describe('UsersManagementPage', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders users when data is available', async () => {
    // Mock auth service response
    authService.getAllUsers.mockResolvedValue({
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '123-456-7890',
          address: '123 Main St',
          created_at: '2023-01-01T10:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'mechanic',
          phone: '098-765-4321',
          address: '456 Oak Ave',
          created_at: '2023-01-02T14:00:00Z'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 2
      }
    });

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that users are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('customer')).toBeInTheDocument();
    expect(screen.getByText('mechanic')).toBeInTheDocument();
  });

  test('renders empty state when no users are found', async () => {
    // Mock auth service response with empty data
    authService.getAllUsers.mockResolvedValue({
      users: [],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 0
      }
    });

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  test('opens add user modal when add button is clicked', async () => {
    // Mock auth service response with empty data
    authService.getAllUsers.mockResolvedValue({
      users: [],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 0
      }
    });

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click add user button
    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);

    // Check that modal is opened
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Add User')).toBeInTheDocument();
  });

  test('creates new user when form is submitted', async () => {
    // Mock auth service response for loading users
    authService.getAllUsers.mockResolvedValue({
      users: [],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 0
      }
    });
    
    // Mock auth service response for creating user
    authService.register.mockResolvedValue({
      user: {
        id: '1',
        name: 'New User',
        email: 'new@example.com',
        role: 'customer',
        phone: '555-123-4567',
        address: '789 Pine St'
      }
    });

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Open add user modal
    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'customer' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '555-123-4567' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '789 Pine St' } });

    // Submit the form
    const submitButton = screen.getByText('Add User');
    fireEvent.click(submitButton);

    // Wait for user to be created
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        name: 'New User',
        email: 'new@example.com',
        password: expect.any(String), // Auto-generated password
        role: 'customer',
        phone: '555-123-4567',
        address: '789 Pine St'
      });
    });

    // Check that modal is closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('opens edit user modal when edit button is clicked', async () => {
    // Mock auth service response with data
    authService.getAllUsers.mockResolvedValue({
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '123-456-7890',
          address: '123 Main St',
          created_at: '2023-01-01T10:00:00Z'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Check that modal is opened with user data
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Edit User')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
    expect(screen.getByLabelText('Email')).toHaveValue('john@example.com');
  });

  test('updates user when edit form is submitted', async () => {
    // Mock auth service response for loading users
    authService.getAllUsers.mockResolvedValue({
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '123-456-7890',
          address: '123 Main St',
          created_at: '2023-01-01T10:00:00Z'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });
    
    // Mock auth service response for updating user
    authService.updateProfile.mockResolvedValue({
      user: {
        id: '1',
        name: 'Updated John Doe',
        email: 'updatedjohn@example.com',
        role: 'customer',
        phone: '123-456-7890',
        address: '123 Main St'
      }
    });

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Change name and email fields
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Updated John Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'updatedjohn@example.com' } });

    // Submit the form
    const submitButton = screen.getByText('Update User');
    fireEvent.click(submitButton);

    // Wait for user to be updated
    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith('1', {
        name: 'Updated John Doe',
        email: 'updatedjohn@example.com',
        role: 'customer',
        phone: '123-456-7890',
        address: '123 Main St'
      });
    });

    // Check that modal is closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('deletes user when delete button is clicked', async () => {
    // Mock auth service response for loading users
    authService.getAllUsers.mockResolvedValue({
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '123-456-7890',
          address: '123 Main St',
          created_at: '2023-01-01T10:00:00Z'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });
    
    // Mock auth service response for deleting user
    authService.deleteUser.mockResolvedValue({});

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Mock window.confirm to return true
    const mockConfirm = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Wait for user to be deleted
    await waitFor(() => {
      expect(authService.deleteUser).toHaveBeenCalledWith('1');
    });

    // Restore window.confirm
    mockConfirm.mockRestore();
  });

  test('loads users when refresh button is clicked', async () => {
    // Mock auth service response
    authService.getAllUsers.mockResolvedValue({
      users: [],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 0
      }
    });

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Check that loadUsers was called
    expect(authService.getAllUsers).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  test('filters users by role', async () => {
    // Mock auth service response
    authService.getAllUsers.mockResolvedValue({
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '123-456-7890',
          address: '123 Main St',
          created_at: '2023-01-01T10:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'mechanic',
          phone: '098-765-4321',
          address: '456 Oak Ave',
          created_at: '2023-01-02T14:00:00Z'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 2
      }
    });

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Filter by "customer" role
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'customer' } });

    // Check that filter state is updated
    expect(filterSelect).toHaveValue('customer');
  });

  test('searches users by term', async () => {
    // Mock auth service response
    authService.getAllUsers.mockResolvedValue({
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'customer',
          phone: '123-456-7890',
          address: '123 Main St',
          created_at: '2023-01-01T10:00:00Z'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });

    render(
      <BrowserRouter>
        <UsersManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Search for "John"
    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Check that search term is updated
    expect(searchInput).toHaveValue('John');
  });
});