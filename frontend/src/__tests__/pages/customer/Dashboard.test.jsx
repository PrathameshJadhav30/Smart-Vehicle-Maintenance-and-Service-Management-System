import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CustomerDashboard from '../../../pages/customer/Dashboard';
import { useAuth } from '../../contexts/AuthContext';
import * as vehicleService from '../../services/vehicleService';
import * as bookingService from '../../services/bookingService';
import * as invoiceService from '../../services/invoiceService';

// Mock the contexts
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../services/vehicleService');
vi.mock('../../services/bookingService');
vi.mock('../../services/invoiceService');

// Mock the components
vi.mock('../../components/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

vi.mock('../../components/ErrorDisplay', () => ({
  __esModule: true,
  default: ({ message }) => <div data-testid="error-display">{message}</div>
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

describe('CustomerDashboard', () => {
  const mockUser = { id: '123', name: 'John Doe', role: 'customer' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <CustomerDashboard />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('displays dashboard content after loading data successfully', async () => {
    // Mock service responses
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        { id: '1', make: 'Toyota', model: 'Camry', year: 2020 },
        { id: '2', make: 'Honda', model: 'Civic', year: 2019 }
      ]
    });
    
    bookingService.getCustomerBookings.mockResolvedValue([
      { id: '1', serviceType: 'Oil Change', status: 'pending', booking_date: '2023-01-01' },
      { id: '2', serviceType: 'Brake Service', status: 'completed', booking_date: '2023-01-02' }
    ]);
    
    invoiceService.getCustomerInvoices.mockResolvedValue([
      { id: '1', amount: 100, payment_status: 'paid' },
      { id: '2', amount: 150, payment_status: 'unpaid' }
    ]);

    render(
      <BrowserRouter>
        <CustomerDashboard />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that dashboard content is displayed
    expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
    expect(screen.getByText('My Vehicles')).toBeInTheDocument();
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
    expect(screen.getByText('My Invoices')).toBeInTheDocument();
    
    // Check that vehicles are displayed
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Honda')).toBeInTheDocument();
    
    // Check that bookings are displayed
    expect(screen.getByText('Oil Change')).toBeInTheDocument();
    expect(screen.getByText('Brake Service')).toBeInTheDocument();
    
    // Check that invoices are displayed
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  test('displays error message when data loading fails', async () => {
    // Mock service failures
    vehicleService.getVehiclesByUserId.mockRejectedValue(new Error('Network error'));
    bookingService.getCustomerBookings.mockRejectedValue(new Error('Network error'));
    invoiceService.getCustomerInvoices.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <CustomerDashboard />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error-display')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error-display')).toHaveTextContent('Failed to load dashboard data. Please try again.');
  });

  test('displays empty state messages when no data is available', async () => {
    // Mock empty service responses
    vehicleService.getVehiclesByUserId.mockResolvedValue({ vehicles: [] });
    bookingService.getCustomerBookings.mockResolvedValue([]);
    invoiceService.getCustomerInvoices.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CustomerDashboard />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state messages are displayed
    expect(screen.getByText('No vehicles found')).toBeInTheDocument();
    expect(screen.getByText('No bookings found')).toBeInTheDocument();
    expect(screen.getByText('No invoices found')).toBeInTheDocument();
  });
});