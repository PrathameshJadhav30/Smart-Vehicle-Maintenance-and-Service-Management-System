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
  const mockAlert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
    // Mock window.alert
    window.alert = mockAlert;
  });

  test('renders utilities page with health check and seeding options', () => {
    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Check that the page title is displayed
    expect(screen.getByText('System Utilities')).toBeInTheDocument();
    
    // Check that health check section is displayed
    expect(screen.getByText('Health Check')).toBeInTheDocument();
    expect(screen.getByText('Check the current status of the API and database connectivity.')).toBeInTheDocument();
    
    // Check that database seeding section is displayed
    expect(screen.getByText('Database Seeding')).toBeInTheDocument();
    expect(screen.getByText('Populate the database with sample data for testing and demonstration purposes.')).toBeInTheDocument();
  });

  test('checks health status when health check button is clicked', async () => {
    // Mock utility service response
    utilityService.getHealthStatus.mockResolvedValue({
      status: 'ok',
      message: 'All systems operational',
      timestamp: '2023-01-01T10:00:00Z'
    });

    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Click health check button
    const healthCheckButton = screen.getByText('Check Health');
    fireEvent.click(healthCheckButton);

    // Wait for the health check to complete
    await waitFor(() => {
      expect(utilityService.getHealthStatus).toHaveBeenCalled();
    });

    // Check that health status is displayed
    expect(screen.getByText('Status: ok')).toBeInTheDocument();
    expect(screen.getByText('All systems operational')).toBeInTheDocument();
  });

  test('shows error message when health check fails', async () => {
    // Mock utility service failure
    utilityService.getHealthStatus.mockRejectedValue(new Error('Health check failed'));

    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Click health check button
    const healthCheckButton = screen.getByText('Check Health');
    fireEvent.click(healthCheckButton);

    // Wait for the error to be handled
    await waitFor(() => {
      expect(utilityService.getHealthStatus).toHaveBeenCalled();
    });

    // Check that error message is displayed
    expect(screen.getByText('Status: error')).toBeInTheDocument();
    expect(screen.getByText('Failed to check health status')).toBeInTheDocument();
  });

  test('seeds database when seed button is clicked and confirmed', async () => {
    // Mock window.confirm to return true
    const mockConfirm = vi.fn(() => true);
    window.confirm = mockConfirm;

    // Mock utility service response
    utilityService.seedDatabase.mockResolvedValue({
      message: 'Database seeded successfully!'
    });

    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Click seed database button
    const seedButton = screen.getByText('Seed Database');
    fireEvent.click(seedButton);

    // Wait for the seeding to complete
    await waitFor(() => {
      expect(utilityService.seedDatabase).toHaveBeenCalled();
    });

    // Check that success message is displayed
    expect(screen.getByText('Database seeded successfully!')).toBeInTheDocument();

    // Restore window.confirm
    mockConfirm.mockRestore();
  });

  test('does not seed database when seed button is clicked and not confirmed', async () => {
    // Mock window.confirm to return false
    const mockConfirm = vi.fn(() => false);
    window.confirm = mockConfirm;

    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Click seed database button
    const seedButton = screen.getByText('Seed Database');
    fireEvent.click(seedButton);

    // Check that seedDatabase was not called
    expect(utilityService.seedDatabase).not.toHaveBeenCalled();

    // Restore window.confirm
    mockConfirm.mockRestore();
  });

  test('shows error message when seeding fails', async () => {
    // Mock window.confirm to return true
    const mockConfirm = vi.fn(() => true);
    window.confirm = mockConfirm;

    // Mock utility service failure
    utilityService.seedDatabase.mockRejectedValue(new Error('Seeding failed'));

    render(
      <BrowserRouter>
        <UtilitiesPage />
      </BrowserRouter>
    );

    // Click seed database button
    const seedButton = screen.getByText('Seed Database');
    fireEvent.click(seedButton);

    // Wait for the error to be handled
    await waitFor(() => {
      expect(utilityService.seedDatabase).toHaveBeenCalled();
    });

    // Check that error message is displayed
    expect(screen.getByText('Failed to seed database. Check console for details.')).toBeInTheDocument();

    // Restore window.confirm
    mockConfirm.mockRestore();
  });
});