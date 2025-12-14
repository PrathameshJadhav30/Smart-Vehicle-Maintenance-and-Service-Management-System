import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UtilitiesPage from '../../../pages/admin/Utilities';
import { useAuth } from '../../../contexts/AuthContext';
import * as utilityService from '../../../services/utilityService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/utilityService');

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

// Mock LoadingSpinner component
vi.mock('../../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('UtilitiesPage', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
  });

  test('renders utilities page with backup and restore options', () => {
    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Check that the page title is displayed
    expect(screen.getByText('System Utilities')).toBeInTheDocument();
    
    // Check that backup section is displayed
    expect(screen.getByText('Database Backup')).toBeInTheDocument();
    expect(screen.getByText('Create a backup of the entire database')).toBeInTheDocument();
    
    // Check that restore section is displayed
    expect(screen.getByText('Database Restore')).toBeInTheDocument();
    expect(screen.getByText('Restore database from a backup file')).toBeInTheDocument();
  });

  test('initiates database backup when backup button is clicked', async () => {
    // Mock utility service response
    utilityService.backupDatabase.mockResolvedValue({
      message: 'Backup created successfully',
      filename: 'backup_20230101.sql'
    });

    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Click backup button
    const backupButton = screen.getByText('Backup Database');
    fireEvent.click(backupButton);

    // Wait for the backup to complete
    await waitFor(() => {
      expect(utilityService.backupDatabase).toHaveBeenCalled();
    });

    // Check that success message is displayed
    expect(screen.getByText('Backup created successfully')).toBeInTheDocument();
  });

  test('shows error message when backup fails', async () => {
    // Mock utility service failure
    utilityService.backupDatabase.mockRejectedValue(new Error('Backup failed'));

    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Click backup button
    const backupButton = screen.getByText('Backup Database');
    fireEvent.click(backupButton);

    // Wait for the error to be handled
    await waitFor(() => {
      expect(utilityService.backupDatabase).toHaveBeenCalled();
    });

    // Check that error message is displayed
    expect(screen.getByText('Backup failed')).toBeInTheDocument();
  });

  test('handles file selection for database restore', () => {
    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Get the file input element
    const fileInput = screen.getByLabelText('Choose backup file');
    
    // Create a mock file
    const file = new File(['backup content'], 'backup.sql', { type: 'application/sql' });
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Check that file is selected
    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files).toHaveLength(1);
  });

  test('initiates database restore when restore button is clicked with a file selected', async () => {
    // Mock utility service response
    utilityService.restoreDatabase.mockResolvedValue({
      message: 'Database restored successfully'
    });

    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Get the file input element
    const fileInput = screen.getByLabelText('Choose backup file');
    
    // Create a mock file
    const file = new File(['backup content'], 'backup.sql', { type: 'application/sql' });
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Click restore button
    const restoreButton = screen.getByText('Restore Database');
    fireEvent.click(restoreButton);

    // Wait for the restore to complete
    await waitFor(() => {
      expect(utilityService.restoreDatabase).toHaveBeenCalled();
    });

    // Check that success message is displayed
    expect(screen.getByText('Database restored successfully')).toBeInTheDocument();
  });

  test('shows error when trying to restore without selecting a file', () => {
    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Mock window.alert to prevent actual alert
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Click restore button without selecting a file
    const restoreButton = screen.getByText('Restore Database');
    fireEvent.click(restoreButton);

    // Check that alert was called with the correct message
    expect(mockAlert).toHaveBeenCalledWith('Please select a backup file to restore');

    // Restore window.alert
    mockAlert.mockRestore();
  });

  test('shows error message when restore fails', async () => {
    // Mock utility service failure
    utilityService.restoreDatabase.mockRejectedValue(new Error('Restore failed'));

    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Get the file input element
    const fileInput = screen.getByLabelText('Choose backup file');
    
    // Create a mock file
    const file = new File(['backup content'], 'backup.sql', { type: 'application/sql' });
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Click restore button
    const restoreButton = screen.getByText('Restore Database');
    fireEvent.click(restoreButton);

    // Wait for the error to be handled
    await waitFor(() => {
      expect(utilityService.restoreDatabase).toHaveBeenCalled();
    });

    // Check that error message is displayed
    expect(screen.getByText('Restore failed')).toBeInTheDocument();
  });
});