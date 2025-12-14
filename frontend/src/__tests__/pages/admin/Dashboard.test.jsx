import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('AdminDashboard', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Check for the loading spinner element (AdminDashboard uses a custom spinner, not the LoadingSpinner component)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders dashboard with statistics when data loads successfully', async () => {
    // Mock service responses
    analyticsService.getDashboardStats.mockResolvedValue({
      totalVehicles: 120,
      pendingBookings: 85,
      activeJobs: 95,
      lowStockParts: 12,
      totalUsers: 150,
      monthlyRevenue: 25000,
      mechanics: 8
    });
    
    // Note: getMechanicPerformance returns an object with mechanicPerformance property
    analyticsService.getMechanicPerformance.mockResolvedValue({
      mechanicPerformance: [
        {
          id: '1',
          name: 'John Smith',
          jobs_completed: 25,
          total_revenue: 12500
        }
      ]
    });
    
    authService.getAllMechanics.mockResolvedValue([
      { id: '1', name: 'John Smith' },
      { id: '2', name: 'Jane Doe' }
    ]);
    
    jobcardService.getAllJobCards.mockResolvedValue([
      { id: '1', mechanic_id: '1', status: 'completed' },
      { id: '2', mechanic_id: '1', status: 'in_progress' }
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

    // Check that key statistics are displayed
    expect(screen.getByText('120')).toBeInTheDocument(); // totalVehicles
    expect(screen.getByText('85')).toBeInTheDocument();  // pendingBookings
    expect(screen.getByText('95')).toBeInTheDocument();  // activeJobs
    expect(screen.getByText('12')).toBeInTheDocument();  // lowStockParts
    expect(screen.getByText('150')).toBeInTheDocument(); // totalUsers
    
    // Check for revenue value using regex to match currency format
    expect(screen.getByText(/₹25,000/)).toBeInTheDocument();
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

    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that error message is displayed (using the actual text from the component)
    expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });
});