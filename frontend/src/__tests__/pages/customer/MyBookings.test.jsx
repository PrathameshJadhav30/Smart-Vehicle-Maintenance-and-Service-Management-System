import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../../contexts/ToastContext';
import MyBookingsPage from '../../../pages/customer/MyBookings';
import { useAuth } from '../../../contexts/AuthContext';
import * as bookingService from '../../../services/bookingService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/bookingService');

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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('MyBookingsPage', () => {
  const mockUser = { id: '123', name: 'John Doe', role: 'customer' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <MyBookingsPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders empty state when no bookings are found', async () => {
    // Mock booking service response with empty array
    bookingService.getCustomerBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <MyBookingsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No bookings found')).toBeInTheDocument();
    expect(screen.getByText('Book Your First Service')).toBeInTheDocument();
  });

  test('renders bookings when data is available', async () => {
    // Mock booking service response with data
    bookingService.getCustomerBookings.mockResolvedValue([
      {
        id: '1',
        service_type: 'Oil Change',
        status: 'pending',
        booking_date: '2023-01-01',
        created_at: '2023-01-01'
      },
      {
        id: '2',
        service_type: 'Brake Service',
        status: 'completed',
        booking_date: '2023-01-02',
        created_at: '2023-01-02'
      }
    ]);

    render(
      <BrowserRouter>
        <MyBookingsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that bookings are displayed
    expect(screen.getByText('Oil Change')).toBeInTheDocument();
    expect(screen.getByText('Brake Service')).toBeInTheDocument();
    
    // Check that status badges are displayed
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  test('filters bookings by status', async () => {
    // Mock booking service response with data
    bookingService.getCustomerBookings.mockResolvedValue([
      {
        id: '1',
        service_type: 'Oil Change',
        status: 'pending',
        booking_date: '2023-01-01',
        created_at: '2023-01-01'
      },
      {
        id: '2',
        service_type: 'Brake Service',
        status: 'completed',
        booking_date: '2023-01-02',
        created_at: '2023-01-02'
      }
    ]);

    render(
      <BrowserRouter>
        <MyBookingsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that all bookings are displayed initially
    expect(screen.getByText('Oil Change')).toBeInTheDocument();
    expect(screen.getByText('Brake Service')).toBeInTheDocument();

    // Filter by pending status
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'pending' } });

    // Wait for filtering to complete
    await waitFor(() => {
      // Only pending booking should be displayed
      expect(screen.getByText('Oil Change')).toBeInTheDocument();
      // Completed booking should not be displayed
      expect(screen.queryByText('Brake Service')).not.toBeInTheDocument();
    });
  });

  test('navigates to book service page when book service button is clicked', async () => {
    // Mock booking service response with empty array
    bookingService.getCustomerBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <MyBookingsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click book service button
    const bookServiceButton = screen.getByText('Book Your First Service');
    fireEvent.click(bookServiceButton);

    // Check that navigation occurs
    expect(mockNavigate).toHaveBeenCalledWith('/customer/book-service');
  });

  test('cancels booking when cancel button is clicked', async () => {
    // Mock booking service response with data
    bookingService.getCustomerBookings.mockResolvedValue([
      {
        id: '1',
        service_type: 'Oil Change',
        status: 'pending',
        booking_date: '2023-01-01',
        created_at: '2023-01-01'
      }
    ]);
    
    // Mock cancel booking service
    bookingService.cancelBooking.mockResolvedValue({
      id: '1',
      status: 'cancelled'
    });

    render(
      <BrowserRouter>
        <MyBookingsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Mock window.confirm to return true
    const mockConfirm = vi.fn(() => true);
    window.confirm = mockConfirm;

    // Click cancel button
    const cancelButton = screen.getByText('Cancel Booking');
    fireEvent.click(cancelButton);

    // Wait for cancellation to complete
    await waitFor(() => {
      expect(bookingService.cancelBooking).toHaveBeenCalledWith('1');
    });
  });
});