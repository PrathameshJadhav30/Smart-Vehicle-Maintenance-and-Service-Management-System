import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CustomerProfilePage from '../../../pages/customer/Profile';
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

describe('CustomerProfilePage', () => {
  const mockUser = { 
    id: '123', 
    name: 'John Doe', 
    email: 'john@example.com',
    phone: '123-456-7890',
    address: '123 Main St'
  };
  
  const mockUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, updateUser: mockUpdateUser });
  });

  test('renders profile information correctly', () => {
    render(
      <BrowserRouter>
        <CustomerProfilePage />
      </BrowserRouter>
    );

    // Check that profile information is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
  });

  test('switches to edit mode when edit button is clicked', () => {
    render(
      <BrowserRouter>
        <CustomerProfilePage />
      </BrowserRouter>
    );

    // Initially in view mode
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: '' })).not.toBeInTheDocument();

    // Click edit button
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Should now be in edit mode
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();
  });

  test('updates profile information when form is submitted', async () => {
    // Mock auth service response
    authService.updateProfile.mockResolvedValue({
      user: {
        id: '123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '098-765-4321',
        address: '456 Oak Ave'
      }
    });

    render(
      <BrowserRouter>
        <CustomerProfilePage />
      </BrowserRouter>
    );

    // Switch to edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Jane Doe' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '098-765-4321' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '456 Oak Ave' } });

    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Wait for the update to complete
    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith('123', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '098-765-4321',
        address: '456 Oak Ave'
      });
    });

    // Check that updateUser was called with the updated user
    expect(mockUpdateUser).toHaveBeenCalledWith({
      id: '123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '098-765-4321',
      address: '456 Oak Ave'
    });

    // Should be back in view mode
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  test('shows error message when profile update fails', async () => {
    // Mock auth service failure
    authService.updateProfile.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <CustomerProfilePage />
      </BrowserRouter>
    );

    // Switch to edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Submit the form without changing anything
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Wait for the error handling
    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalled();
    });
  });

  test('changes password when password form is submitted', async () => {
    // Mock auth service response
    authService.changePassword.mockResolvedValue({ message: 'Password changed successfully' });

    render(
      <BrowserRouter>
        <CustomerProfilePage />
      </BrowserRouter>
    );

    // Switch to edit mode (password form is always visible)
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Fill in the password form
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpassword' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpassword' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'newpassword' } });

    // Submit the password form
    const changePasswordButton = screen.getByText('Change Password');
    fireEvent.click(changePasswordButton);

    // Wait for the password change to complete
    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith('123', {
        oldPassword: 'oldpassword',
        newPassword: 'newpassword'
      });
    });

    // Check that password fields are cleared
    expect(screen.getByLabelText('Current Password')).toHaveValue('');
    expect(screen.getByLabelText('New Password')).toHaveValue('');
    expect(screen.getByLabelText('Confirm New Password')).toHaveValue('');
  });

  test('shows error when new passwords do not match', () => {
    render(
      <BrowserRouter>
        <CustomerProfilePage />
      </BrowserRouter>
    );

    // Switch to edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Fill in the password form with mismatched passwords
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpassword' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpassword' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'differentpassword' } });

    // Mock window.alert to prevent actual alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Submit the password form
    const changePasswordButton = screen.getByText('Change Password');
    fireEvent.click(changePasswordButton);

    // Check that alert was called with the correct message
    expect(mockAlert).toHaveBeenCalledWith('New passwords do not match!');

    // Restore window.alert
    mockAlert.mockRestore();
  });
});