import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../../../pages/admin/Dashboard';
import { useAuth } from '../../../contexts/AuthContext';
import * as analyticsService from '../../../services/analyticsService';
import * as jobcardService from '../../../services/jobcardService';
import * as authService from '../../../services/authService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/analyticsService');
vi.mock('../../../services/jobcardService');
vi.mock('../../../services/authService');

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

describe('AdminDashboard', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test('renders loading spinner initially', async () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Check for the loading spinner element
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders dashboard with statistics when data loads successfully', async () => {
    // Mock service responses
    analyticsService.getDashboardStats.mockResolvedValue({
      totalVehicles: 150,
      pendingBookings: 12,
      activeJobs: 25,
      lowStockParts: 8,
      totalUsers: 45,
      monthlyRevenue: 125000
    });
    
    analyticsService.getMechanicPerformance.mockResolvedValue({
      mechanicPerformance: [
        { id: '1', name: 'John Mechanic', jobs_completed: 15, total_revenue: 75000 },
        { id: '2', name: 'Jane Mechanic', jobs_completed: 12, total_revenue: 60000 }
      ]
    });
    
    authService.getAllMechanics.mockResolvedValue([
      { id: '1', name: 'John Mechanic' },
      { id: '2', name: 'Jane Mechanic' }
    ]);
    
    jobcardService.getAllJobCards.mockResolvedValue([
      { id: '1', mechanic_id: '1', status: 'completed' },
      { id: '2', mechanic_id: '1', status: 'in_progress' },
      { id: '3', mechanic_id: '2', status: 'completed' }
    ]);

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Wait for dashboard content to be displayed
    await waitFor(() => {
      expect(screen.getByText('Welcome, Admin User!')).toBeInTheDocument();
    });

    // Check that dashboard content is displayed
    expect(screen.getByText('Welcome, Admin User!')).toBeInTheDocument();
    
    // Check that statistics are displayed
    expect(screen.getByText('150')).toBeInTheDocument(); // Total Vehicles
    expect(screen.getByText('12')).toBeInTheDocument(); // Pending Bookings
    expect(screen.getByText('25')).toBeInTheDocument(); // Active Jobs
    expect(screen.getByText('8')).toBeInTheDocument();  // Low Stock Parts
    expect(screen.getByText('45')).toBeInTheDocument(); // Total Users
    expect(screen.getByText('₹125,000.00')).toBeInTheDocument(); // Revenue
    
    // Check that mechanic stats are displayed
    expect(screen.getByText('John Mechanic')).toBeInTheDocument();
    expect(screen.getByText('Jane Mechanic')).toBeInTheDocument();
    
    // Check that job assignments are displayed
    expect(screen.getByText('John Mechanic')).toBeInTheDocument();
    expect(screen.getByText('Jane Mechanic')).toBeInTheDocument();
  });

  test('renders error message when data loading fails', async () => {
    // Mock service failures
    analyticsService.getDashboardStats.mockRejectedValue(new Error('Network error'));
    analyticsService.getMechanicPerformance.mockRejectedValue(new Error('Network error'));
    authService.getAllMechanics.mockRejectedValue(new Error('Network error'));
    jobcardService.getAllJobCards.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  test('retries loading when retry button is clicked', async () => {
    // First mock service failures
    analyticsService.getDashboardStats.mockRejectedValueOnce(new Error('Network error'));
    analyticsService.getMechanicPerformance.mockRejectedValueOnce(new Error('Network error'));
    authService.getAllMechanics.mockRejectedValueOnce(new Error('Network error'));
    jobcardService.getAllJobCards.mockRejectedValueOnce(new Error('Network error'));

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    });

    // Now mock successful responses
    analyticsService.getDashboardStats.mockResolvedValueOnce({
      totalVehicles: 100,
      pendingBookings: 5,
      activeJobs: 10,
      lowStockParts: 3,
      totalUsers: 25,
      monthlyRevenue: 50000
    });
    
    analyticsService.getMechanicPerformance.mockResolvedValueOnce({
      mechanicPerformance: []
    });
    
    authService.getAllMechanics.mockResolvedValueOnce([]);
    jobcardService.getAllJobCards.mockResolvedValueOnce([]);

    // Click retry button
    const retryButton = screen.getByText('Retry');
    retryButton.click();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Welcome, Admin User!')).toBeInTheDocument();
    });

    // Check that dashboard content is displayed
    expect(screen.getByText('Welcome, Admin User!')).toBeInTheDocument();
  });
});