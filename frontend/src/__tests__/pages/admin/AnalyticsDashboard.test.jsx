import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AnalyticsDashboardPage from '../../../pages/admin/AnalyticsDashboard';
import { useAuth } from '../../../contexts/AuthContext';
import * as analyticsService from '../../../services/analyticsService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/analyticsService');

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

describe('AnalyticsDashboardPage', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <AnalyticsDashboardPage />
      </BrowserRouter>
    );

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
      monthlyRevenue: 125000,
      mechanics: 5
    });
    
    analyticsService.getVehicleAnalytics.mockResolvedValue({
      topVehicles: [
        { model: 'Toyota Camry', vin: 'VIN123', service_count: 15 },
        { model: 'Honda Civic', vin: 'VIN456', service_count: 12 }
      ]
    });
    
    analyticsService.getPartsUsageAnalytics.mockResolvedValue({
      partsUsage: [
        { name: 'Engine Oil', total_used: 50 },
        { name: 'Brake Pads', total_used: 30 }
      ]
    });
    
    analyticsService.getRevenueAnalytics.mockResolvedValue({
      monthlyRevenue: [
        { month: '2023-01-01', revenue: 50000 },
        { month: '2023-02-01', revenue: 75000 }
      ]
    });
    
    analyticsService.getMechanicPerformance.mockResolvedValue({
      mechanicPerformance: [
        { name: 'John Mechanic', jobs_completed: 15, total_revenue: 75000 },
        { name: 'Jane Mechanic', jobs_completed: 12, total_revenue: 60000 }
      ]
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboardPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that dashboard content is displayed
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    
    // Check that statistics are displayed
    expect(screen.getByText('150')).toBeInTheDocument(); // Total Vehicles
    expect(screen.getByText('12')).toBeInTheDocument(); // Pending Bookings
    expect(screen.getByText('25')).toBeInTheDocument(); // Active Jobs
    expect(screen.getByText('8')).toBeInTheDocument();  // Low Stock Parts
    expect(screen.getByText('45')).toBeInTheDocument(); // Total Users
    expect(screen.getByText('$125,000.00')).toBeInTheDocument(); // Revenue
    
    // Check that vehicle analytics are displayed
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic')).toBeInTheDocument();
    
    // Check that parts usage analytics are displayed
    expect(screen.getByText('Engine Oil')).toBeInTheDocument();
    expect(screen.getByText('Brake Pads')).toBeInTheDocument();
    
    // Check that revenue analytics are displayed
    expect(screen.getByText('Jan 2023')).toBeInTheDocument();
    expect(screen.getByText('Feb 2023')).toBeInTheDocument();
    
    // Check that mechanic performance is displayed
    expect(screen.getByText('John Mechanic')).toBeInTheDocument();
    expect(screen.getByText('Jane Mechanic')).toBeInTheDocument();
  });

  test('renders error message when data loading fails', async () => {
    // Mock service failures
    analyticsService.getDashboardStats.mockRejectedValue(new Error('Network error'));
    analyticsService.getVehicleAnalytics.mockRejectedValue(new Error('Network error'));
    analyticsService.getPartsUsageAnalytics.mockRejectedValue(new Error('Network error'));
    analyticsService.getRevenueAnalytics.mockRejectedValue(new Error('Network error'));
    analyticsService.getMechanicPerformance.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <AnalyticsDashboardPage />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  test('refreshes data when refresh button is clicked', async () => {
    // First mock service responses
    analyticsService.getDashboardStats.mockResolvedValue({
      totalVehicles: 100,
      pendingBookings: 5,
      activeJobs: 10,
      lowStockParts: 3,
      totalUsers: 25,
      monthlyRevenue: 50000,
      mechanics: 3
    });
    
    analyticsService.getVehicleAnalytics.mockResolvedValue({
      topVehicles: []
    });
    
    analyticsService.getPartsUsageAnalytics.mockResolvedValue({
      partsUsage: []
    });
    
    analyticsService.getRevenueAnalytics.mockResolvedValue({
      monthlyRevenue: []
    });
    
    analyticsService.getMechanicPerformance.mockResolvedValue({
      mechanicPerformance: []
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboardPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh Data');
    fireEvent.click(refreshButton);

    // Check that services were called again
    expect(analyticsService.getDashboardStats).toHaveBeenCalledTimes(2);
    expect(analyticsService.getVehicleAnalytics).toHaveBeenCalledTimes(2);
    expect(analyticsService.getPartsUsageAnalytics).toHaveBeenCalledTimes(2);
    expect(analyticsService.getRevenueAnalytics).toHaveBeenCalledTimes(2);
    expect(analyticsService.getMechanicPerformance).toHaveBeenCalledTimes(2);
  });

  test('applies filters when filter buttons are clicked', async () => {
    // Mock service responses
    analyticsService.getDashboardStats.mockResolvedValue({
      totalVehicles: 150,
      pendingBookings: 12,
      activeJobs: 25,
      lowStockParts: 8,
      totalUsers: 45,
      monthlyRevenue: 125000,
      mechanics: 5
    });
    
    analyticsService.getVehicleAnalytics.mockResolvedValue({
      topVehicles: []
    });
    
    analyticsService.getPartsUsageAnalytics.mockResolvedValue({
      partsUsage: []
    });
    
    analyticsService.getRevenueAnalytics.mockResolvedValue({
      monthlyRevenue: []
    });
    
    analyticsService.getMechanicPerformance.mockResolvedValue({
      mechanicPerformance: []
    });

    render(
      <BrowserRouter>
        <AnalyticsDashboardPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Set start date for revenue filter
    const revenueStartDateInput = screen.getByLabelText('Start Date');
    fireEvent.change(revenueStartDateInput, { target: { value: '2023-01-01' } });

    // Set end date for revenue filter
    const revenueEndDateInput = screen.getByLabelText('End Date');
    fireEvent.change(revenueEndDateInput, { target: { value: '2023-12-31' } });

    // Click apply button
    const applyButton = screen.getByText('Apply');
    fireEvent.click(applyButton);

    // Check that services were called with filters
    expect(analyticsService.getRevenueAnalytics).toHaveBeenCalledWith({ startDate: '2023-01-01', endDate: '2023-12-31' });
  });
});