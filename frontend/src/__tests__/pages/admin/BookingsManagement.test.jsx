import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookingsManagementPage from '../../../pages/admin/BookingsManagement';
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

// Mock the Modal component
vi.mock('../../../components/Modal', () => ({
  __esModule: true,
  default: ({ children, isOpen, onClose, title }) => (
    isOpen ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null
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

describe('BookingsManagementPage', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders bookings when data is available', async () => {
    // Mock booking service response
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          customer_name: 'John Doe',
          email: 'john@example.com',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          service_type: 'Oil Change',
          status: 'pending',
          booking_date: '2023-01-01',
          booking_time: '10:00'
        },
        {
          id: '2',
          customer_name: 'Jane Smith',
          email: 'jane@example.com',
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          service_type: 'Brake Service',
          status: 'approved',
          booking_date: '2023-01-02',
          booking_time: '14:00'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 2
      }
    });

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that bookings are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic')).toBeInTheDocument();
    expect(screen.getByText('Oil Change')).toBeInTheDocument();
    expect(screen.getByText('Brake Service')).toBeInTheDocument();
  });

  test('renders empty state when no bookings are found', async () => {
    // Mock booking service response with empty data
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 0
      }
    });

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No bookings found')).toBeInTheDocument();
  });

  test('opens booking details modal when view button is clicked', async () => {
    // Mock booking service response
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          customer_name: 'John Doe',
          email: 'john@example.com',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          service_type: 'Oil Change',
          status: 'pending',
          booking_date: '2023-01-01',
          booking_time: '10:00'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click view button
    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);

    // Check that modal is opened
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Booking #1')).toBeInTheDocument();
  });

  test('approves booking when approve button is clicked', async () => {
    // Mock booking service response
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          customer_name: 'John Doe',
          email: 'john@example.com',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          service_type: 'Oil Change',
          status: 'pending',
          booking_date: '2023-01-01',
          booking_time: '10:00'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });
    
    // Mock approve booking service
    bookingService.approveBooking.mockResolvedValue({});

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Mock window.confirm to return true
    const mockConfirm = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    // Click approve button
    const approveButton = screen.getByText('Approve');
    fireEvent.click(approveButton);

    // Wait for booking to be approved
    await waitFor(() => {
      expect(bookingService.approveBooking).toHaveBeenCalledWith('1');
    });

    // Restore window.confirm
    mockConfirm.mockRestore();
  });

  test('rejects booking when reject button is clicked', async () => {
    // Mock booking service response
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          customer_name: 'John Doe',
          email: 'john@example.com',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          service_type: 'Oil Change',
          status: 'pending',
          booking_date: '2023-01-01',
          booking_time: '10:00'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });
    
    // Mock reject booking service
    bookingService.rejectBooking.mockResolvedValue({});

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Mock window.confirm to return true
    const mockConfirm = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    // Click reject button
    const rejectButton = screen.getByText('Reject');
    fireEvent.click(rejectButton);

    // Wait for booking to be rejected
    await waitFor(() => {
      expect(bookingService.rejectBooking).toHaveBeenCalledWith('1');
    });

    // Restore window.confirm
    mockConfirm.mockRestore();
  });

  test('loads bookings when refresh button is clicked', async () => {
    // Mock booking service response
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 0
      }
    });

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Check that loadBookings was called
    expect(bookingService.getAllBookings).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  test('filters bookings by status', async () => {
    // Mock booking service response
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          customer_name: 'John Doe',
          email: 'john@example.com',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          service_type: 'Oil Change',
          status: 'pending',
          booking_date: '2023-01-01',
          booking_time: '10:00'
        },
        {
          id: '2',
          customer_name: 'Jane Smith',
          email: 'jane@example.com',
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          service_type: 'Brake Service',
          status: 'approved',
          booking_date: '2023-01-02',
          booking_time: '14:00'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 2
      }
    });

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Filter by "pending" status
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'pending' } });

    // Check that filter state is updated
    expect(filterSelect).toHaveValue('pending');
  });

  test('searches bookings by term', async () => {
    // Mock booking service response
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          customer_name: 'John Doe',
          email: 'john@example.com',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          service_type: 'Oil Change',
          status: 'pending',
          booking_date: '2023-01-01',
          booking_time: '10:00'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Search for "John"
    const searchInput = screen.getByPlaceholderText('Search bookings...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Check that search term is updated
    expect(searchInput).toHaveValue('John');
  });
});