import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MechanicProfilePage from '../../../pages/mechanic/Profile';
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

// Mock window.alert
window.alert = vi.fn();

describe('MechanicProfilePage', () => {
  const mockUser = { 
    id: '123', 
    name: 'John Mechanic', 
    email: 'john@example.com',
    phone: '123-456-7890'
  };
  
  const mockUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, updateUser: mockUpdateUser });
    window.alert.mockClear();
  });

  test('renders profile information correctly', () => {
    render(
      <BrowserRouter>
        <MechanicProfilePage />
      </BrowserRouter>
    );

    // Check that profile information is displayed (using getAllByText since elements appear multiple times)
    expect(screen.getAllByText('John Mechanic')).toHaveLength(2);
    expect(screen.getAllByText('john@example.com')).toHaveLength(2);
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
  });

  test('switches to edit mode when edit button is clicked', () => {
    render(
      <BrowserRouter>
        <MechanicProfilePage />
      </BrowserRouter>
    );

    // Initially in view mode
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();

    // Click edit button
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Should now be in edit mode
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  test('shows error when new passwords do not match', () => {
    render(
      <BrowserRouter>
        <MechanicProfilePage />
      </BrowserRouter>
    );

    // Switch to edit mode
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);

    // Fill in the password form with mismatched passwords
    fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'oldpassword' } });
    fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'newpassword' } });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'differentpassword' } });

    // Submit the password form (select by role and text)
    const changePasswordButton = screen.getByRole('button', { name: /Change Password/i });
    fireEvent.click(changePasswordButton);

    // Check that alert was called with the correct message
    expect(window.alert).toHaveBeenCalledWith('New passwords do not match!');
  });
});