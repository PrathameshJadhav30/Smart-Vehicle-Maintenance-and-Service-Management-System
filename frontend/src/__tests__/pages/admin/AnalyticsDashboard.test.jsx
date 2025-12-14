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

describe('AnalyticsDashboardPage', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <AnalyticsDashboardPage />
      </BrowserRouter>
    );

    // Check for the loading spinner element using data-testid
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders dashboard with statistics when data loads successfully', async () => {
    // Mock analytics service responses
    analyticsService.getDashboardStats.mockResolvedValue({
      totalVehicles: 95,
      pendingBookings: 12,
      activeJobcards: 25,
      lowStockParts: 8,
      totalUsers: 85,
      monthlyRevenue: 15000,
      mechanics: 5
    });
    
    analyticsService.getVehicleAnalytics.mockResolvedValue({
      topVehicles: [
        { model: 'Toyota', vin: 'ABC123', service_count: '5' },
        { model: 'Honda', vin: 'XYZ789', service_count: '3' }
      ]
    });
    
    analyticsService.getPartsUsageAnalytics.mockResolvedValue({
      partsUsage: [
        { name: 'Oil Filter', total_used: '10' },
        { name: 'Brake Pad', total_used: '8' }
      ]
    });
    
    analyticsService.getRevenueAnalytics.mockResolvedValue({
      monthlyRevenue: [
        { month: '2023-01-01T00:00:00Z', revenue: '1200' },
        { month: '2023-02-01T00:00:00Z', revenue: '1500' }
      ]
    });
    
    analyticsService.getMechanicPerformance.mockResolvedValue({
      mechanicPerformance: [
        { name: 'John Doe', jobs_completed: 15, total_revenue: '5000' },
        { name: 'Jane Smith', jobs_completed: 12, total_revenue: '4200' }
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

    // Check that statistics are displayed using more specific selectors
    // Use getAllByText and check specific elements to avoid conflicts
    const totalVehiclesElements = screen.getAllByText('95');
    expect(totalVehiclesElements[0]).toBeInTheDocument();
    
    const pendingBookingsElements = screen.getAllByText('12');
    expect(pendingBookingsElements[0]).toBeInTheDocument();
    
    const activeJobsElements = screen.getAllByText('25');
    expect(activeJobsElements[0]).toBeInTheDocument();
    
    const lowStockPartsElements = screen.getAllByText('8');
    expect(lowStockPartsElements[0]).toBeInTheDocument();
    
    const totalUsersElements = screen.getAllByText('85');
    expect(totalUsersElements[0]).toBeInTheDocument();
    
    expect(screen.getByText('₹15,000.00')).toBeInTheDocument(); // Revenue
    const mechanicsElements = screen.getAllByText('5');
    expect(mechanicsElements[0]).toBeInTheDocument();

    // Check that tables are displayed with data
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Honda')).toBeInTheDocument();
    expect(screen.getByText('Oil Filter')).toBeInTheDocument();
    expect(screen.getByText('Brake Pad')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  test('renders error message when data loading fails', async () => {
    // Mock analytics service failure
    analyticsService.getDashboardStats.mockRejectedValue(new Error('Failed to load data'));
    analyticsService.getVehicleAnalytics.mockRejectedValue(new Error('Failed to load data'));
    analyticsService.getPartsUsageAnalytics.mockRejectedValue(new Error('Failed to load data'));
    analyticsService.getRevenueAnalytics.mockRejectedValue(new Error('Failed to load data'));
    analyticsService.getMechanicPerformance.mockRejectedValue(new Error('Failed to load data'));

    render(
      <BrowserRouter>
        <AnalyticsDashboardPage />
      </BrowserRouter>
    );

    // Wait for error to be handled
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that error message is displayed
    expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  test('refreshes data when refresh button is clicked', async () => {
    // Mock analytics service responses
    analyticsService.getDashboardStats.mockResolvedValue({
      totalVehicles: 95,
      pendingBookings: 12,
      activeJobcards: 25,
      lowStockParts: 8,
      totalUsers: 85,
      monthlyRevenue: 15000,
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

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Get initial call counts
    const initialDashboardCalls = analyticsService.getDashboardStats.mock.calls.length;
    const initialVehicleCalls = analyticsService.getVehicleAnalytics.mock.calls.length;
    const initialPartsCalls = analyticsService.getPartsUsageAnalytics.mock.calls.length;
    const initialRevenueCalls = analyticsService.getRevenueAnalytics.mock.calls.length;
    const initialMechanicCalls = analyticsService.getMechanicPerformance.mock.calls.length;

    // Click refresh button
    const refreshButton = screen.getByText('Refresh Data');
    fireEvent.click(refreshButton);

    // Check that all service methods were called again
    await waitFor(() => {
      expect(analyticsService.getDashboardStats.mock.calls.length).toBe(initialDashboardCalls + 1);
      expect(analyticsService.getVehicleAnalytics.mock.calls.length).toBe(initialVehicleCalls + 1);
      expect(analyticsService.getPartsUsageAnalytics.mock.calls.length).toBe(initialPartsCalls + 1);
      expect(analyticsService.getRevenueAnalytics.mock.calls.length).toBe(initialRevenueCalls + 1);
      expect(analyticsService.getMechanicPerformance.mock.calls.length).toBe(initialMechanicCalls + 1);
    });
  });
});