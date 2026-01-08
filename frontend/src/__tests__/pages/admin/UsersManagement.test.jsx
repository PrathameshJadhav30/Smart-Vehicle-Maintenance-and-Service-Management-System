import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../../contexts/ToastContext';
import UsersManagementPage from '../../../pages/admin/UsersManagement';
import { useAuth } from '../../../contexts/AuthContext';
import * as authService from '../../../services/authService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/authService');

// Mock window.alert
window.alert = vi.fn();

// Mock the ConfirmationModal component
vi.mock('../../../components/ConfirmationModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onCancel, message }) => (
    isOpen ? (
      <div data-testid="confirmation-modal">
        <p>{message}</p>
        <button onClick={onConfirm} data-testid="confirm-button">Confirm</button>
        <button onClick={onCancel} data-testid="cancel-button">Cancel</button>
      </div>
    ) : null
  )
}));

describe('UsersManagementPage', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };
  const mockUsers = [
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'customer', createdAt: '2023-01-15T10:00:00Z' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'mechanic', createdAt: '2023-02-20T14:30:00Z' },
    { id: '3', name: 'Admin User', email: 'admin@example.com', role: 'admin', createdAt: '2023-03-10T09:15:00Z' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
    window.alert.mockClear();
  });

  test('renders loading spinner initially', () => {
    // Mock the getAllUsers to delay resolution to test loading state
    authService.getAllUsers.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));
    
    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Check for the loading spinner element using data-testid
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders users table when data loads successfully', async () => {
    // Mock successful response
    authService.getAllUsers.mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete and users to be displayed
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait a bit more for the filtering effect
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Check that users are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    
    // Check roles using more specific selectors
    expect(screen.getByText('Admin', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Mechanic', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Customer', { selector: 'span' })).toBeInTheDocument();
    
    // Check that date is formatted correctly
    expect(screen.getByText('1/15/2023')).toBeInTheDocument();
    
    // Check that action buttons are present (there should be 3 users, so 3 edit buttons and 3 delete buttons)
    expect(screen.getAllByText('Edit Role')).toHaveLength(3);
    expect(screen.getAllByText('Delete')).toHaveLength(3);
  });

  test('shows no users message when users array is empty', async () => {
    // Mock empty response
    authService.getAllUsers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that no users message is displayed
    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.getByText('There are no users in the system.')).toBeInTheDocument();
  });

  test('filters users by search term', async () => {
    authService.getAllUsers.mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Initially all users should be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();

    // Search for "John"
    const searchInput = screen.getByPlaceholderText('Search users...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Only John should be visible now
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });

    // All users should be visible again
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  test('filters users by role', async () => {
    authService.getAllUsers.mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Initially all users should be visible
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();

    // Filter by "mechanic"
    const roleFilter = screen.getByRole('combobox'); // This selects the role filter dropdown
    fireEvent.change(roleFilter, { target: { value: 'mechanic' } });

    // Only Jane (mechanic) should be visible
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin User')).not.toBeInTheDocument();

    // Filter by "admin"
    fireEvent.change(roleFilter, { target: { value: 'admin' } });

    // Only Admin User should be visible
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  test('opens edit modal when edit button is clicked', async () => {
    authService.getAllUsers.mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click edit button for John Doe (first edit button)
    const editButtons = screen.getAllByText('Edit Role');
    fireEvent.click(editButtons[0]);

    // Modal should be open with John's details
    expect(screen.getByText('Edit User Role')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveValue('customer');
  });

  test('updates user role successfully', async () => {
    authService.getAllUsers.mockResolvedValue(mockUsers);
    authService.updateUserRole.mockResolvedValue({ 
      message: 'User role updated successfully',
      user: { ...mockUsers[0], role: 'mechanic' }
    });

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click edit button for John Doe (first edit button)
    const editButtons = screen.getAllByText('Edit Role');
    fireEvent.click(editButtons[0]);

    // Change role to mechanic
    const roleSelect = screen.getByRole('combobox', { name: 'Role' });
    fireEvent.change(roleSelect, { target: { value: 'mechanic' } });

    // Submit form
    const updateButton = screen.getByText('Update Role');
    fireEvent.click(updateButton);

    // Wait for modal to close and data to reload
    await waitFor(() => {
      expect(screen.queryByText('Edit User Role')).not.toBeInTheDocument();
    });

    // Check that updateUserRole was called
    expect(authService.updateUserRole).toHaveBeenCalledWith('1', { role: 'mechanic' });
    
    // Check that getAllUsers was called again to refresh data
    expect(authService.getAllUsers).toHaveBeenCalledTimes(2);
  });

  test('handles update user role error', async () => {
    authService.getAllUsers.mockResolvedValue(mockUsers);
    authService.updateUserRole.mockRejectedValue(new Error('Failed to update user'));

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click edit button for John Doe (first edit button)
    const editButtons = screen.getAllByText('Edit Role');
    fireEvent.click(editButtons[0]);

    // Change role to mechanic
    const roleSelect = screen.getByRole('combobox', { name: 'Role' });
    fireEvent.change(roleSelect, { target: { value: 'mechanic' } });

    // Submit form
    const updateButton = screen.getByText('Update Role');
    fireEvent.click(updateButton);

    // Wait for error handling
    await waitFor(() => {
      // Check that alert was called
      expect(window.alert).toHaveBeenCalledWith('Failed to update user. Please try again.');
    });
    
    // Check that updateUserRole was called
    expect(authService.updateUserRole).toHaveBeenCalledWith('1', { role: 'mechanic' });
  });

  test('deletes user successfully', async () => {
    authService.getAllUsers.mockResolvedValue(mockUsers);
    authService.deleteUser.mockResolvedValue({ message: 'User deleted successfully' });

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click delete button for John Doe (first delete button)
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Wait for confirmation modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    // Click confirm button
    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    // Wait for data to reload
    await waitFor(() => {
      expect(authService.getAllUsers).toHaveBeenCalledTimes(2);
    });

    // Check that deleteUser was called
    expect(authService.deleteUser).toHaveBeenCalledWith('1');
  });

  test('cancels user deletion', async () => {
    authService.getAllUsers.mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click delete button for John Doe (first delete button)
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Wait for confirmation modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);
    
    // Check that deleteUser was not called
    expect(authService.deleteUser).not.toHaveBeenCalled();
  });

  test('handles delete user error', async () => {
    authService.getAllUsers.mockResolvedValue(mockUsers);
    authService.deleteUser.mockRejectedValue(new Error('Failed to delete user'));

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click delete button for John Doe (first delete button)
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    // Wait for confirmation modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });

    // Click confirm button
    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    // Wait for error handling
    await waitFor(() => {
      // Check that alert was called
      expect(window.alert).toHaveBeenCalledWith('Failed to delete user. Please try again.');
    });
    
    // Check that deleteUser was called
    expect(authService.deleteUser).toHaveBeenCalledWith('1');
  });

  test('closes edit modal when cancel button is clicked', async () => {
    authService.getAllUsers.mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Wait for users to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Click edit button for John Doe (first edit button)
    const editButtons = screen.getAllByText('Edit Role');
    fireEvent.click(editButtons[0]);

    // Modal should be open
    expect(screen.getByText('Edit User Role')).toBeInTheDocument();

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Edit User Role')).not.toBeInTheDocument();
    });
  });

  test('handles error when loading users', async () => {
    // Mock error response
    authService.getAllUsers.mockRejectedValue(new Error('Failed to load users'));

    render(
      <BrowserRouter>
        <ToastProvider>
          <UsersManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Should still render the component without crashing
    expect(screen.getByText('Users Management')).toBeInTheDocument();
    expect(screen.getByText('Manage user accounts and permissions')).toBeInTheDocument();
    
    // Should show no users message since the error causes empty array
    expect(screen.getByText('No users found')).toBeInTheDocument();
  });
});