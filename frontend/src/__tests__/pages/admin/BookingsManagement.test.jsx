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
      data-testid={children === 'Approve' ? 'approve-button' : 
                   children === 'Reject' ? 'reject-button' : 
                   children === 'Cancel' ? 'cancel-button' : 
                   children === 'Assign Mechanic' ? 'assign-button' : undefined}
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
        <button onClick={onClose} data-testid="close-modal-button">Close</button>
        {children}
      </div>
    ) : null
  )
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
  const mockAlert = vi.fn();
  const mockConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
    // Mock window.alert and window.confirm
    window.alert = mockAlert;
    window.confirm = mockConfirm;
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Check for the loading spinner element using data-testid
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders bookings when data is available', async () => {
    // Mock booking service response
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          service_type: 'oil_change',
          vehicle_id: '123',
          customer_id: '456',
          booking_date: '2023-01-15T10:00:00Z',
          status: 'pending',
          estimated_cost: 150.00,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          customer_name: 'John Doe',
          customer_phone: '123-456-7890'
        },
        {
          id: '2',
          service_type: 'brake_service',
          vehicle_id: '456',
          customer_id: '789',
          booking_date: '2023-01-16T14:00:00Z',
          status: 'approved',
          estimated_cost: 300.00,
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          customer_name: 'Jane Smith',
          customer_phone: '098-765-4321'
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
    expect(screen.getByText('oil_change')).toBeInTheDocument();
    expect(screen.getByText('brake_service')).toBeInTheDocument();
    expect(screen.getByText('Toyota Camry (2020)')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic (2019)')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    // Use getAllByText and check the first ones to avoid conflicts with filter options
    const pendingElements = screen.getAllByText('Pending');
    expect(pendingElements[0]).toBeInTheDocument();
    const approvedElements = screen.getAllByText('Approved');
    expect(approvedElements[0]).toBeInTheDocument();
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

  test('approves booking when approve button is clicked', async () => {
    // Mock booking service response for loading bookings
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          service_type: 'oil_change',
          vehicle_id: '123',
          customer_id: '456',
          booking_date: '2023-01-15T10:00:00Z',
          status: 'pending',
          estimated_cost: 150.00,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          customer_name: 'John Doe',
          customer_phone: '123-456-7890'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });
    
    // Mock booking service response for approving booking
    bookingService.approveBooking.mockResolvedValue({
      id: '1',
      service_type: 'oil_change',
      vehicle_id: '123',
      customer_id: '456',
      booking_date: '2023-01-15T10:00:00Z',
      status: 'approved',
      estimated_cost: 150.00
    });

    // Mock window.confirm to return true
    mockConfirm.mockImplementation(() => true);

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click approve button using data-testid
    const approveButton = screen.getByTestId('approve-button');
    fireEvent.click(approveButton);

    // Wait for booking to be approved
    await waitFor(() => {
      expect(bookingService.approveBooking).toHaveBeenCalledWith('1');
    });

    // Check that loadBookings was called to refresh the list
    expect(bookingService.getAllBookings).toHaveBeenCalledTimes(2);
  });

  test('rejects booking when reject button is clicked', async () => {
    // Mock booking service response for loading bookings
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          service_type: 'oil_change',
          vehicle_id: '123',
          customer_id: '456',
          booking_date: '2023-01-15T10:00:00Z',
          status: 'pending',
          estimated_cost: 150.00,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          customer_name: 'John Doe',
          customer_phone: '123-456-7890'
        }
      ],
      pagination: {
        totalPages: 1,
        currentPage: 1,
        totalItems: 1
      }
    });
    
    // Mock booking service response for rejecting booking
    bookingService.rejectBooking.mockResolvedValue({
      id: '1',
      service_type: 'oil_change',
      vehicle_id: '123',
      customer_id: '456',
      booking_date: '2023-01-15T10:00:00Z',
      status: 'rejected',
      estimated_cost: 150.00
    });

    // Mock window.confirm to return true
    mockConfirm.mockImplementation(() => true);

    render(
      <BrowserRouter>
        <BookingsManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click reject button using data-testid
    const rejectButton = screen.getByTestId('reject-button');
    fireEvent.click(rejectButton);

    // Wait for booking to be rejected
    await waitFor(() => {
      expect(bookingService.rejectBooking).toHaveBeenCalledWith('1');
    });

    // Check that loadBookings was called to refresh the list
    expect(bookingService.getAllBookings).toHaveBeenCalledTimes(2);
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
          service_type: 'oil_change',
          vehicle_id: '123',
          customer_id: '456',
          booking_date: '2023-01-15T10:00:00Z',
          status: 'pending',
          estimated_cost: 150.00,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          customer_name: 'John Doe',
          customer_phone: '123-456-7890'
        },
        {
          id: '2',
          service_type: 'brake_service',
          vehicle_id: '456',
          customer_id: '789',
          booking_date: '2023-01-16T14:00:00Z',
          status: 'approved',
          estimated_cost: 300.00,
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          customer_name: 'Jane Smith',
          customer_phone: '098-765-4321'
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

    // Filter by "approved" status
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'approved' } });

    // Check that filter state is updated
    expect(filterSelect).toHaveValue('approved');
  });

  test('searches bookings by term', async () => {
    // Mock booking service response
    bookingService.getAllBookings.mockResolvedValue({
      bookings: [
        {
          id: '1',
          service_type: 'oil_change',
          vehicle_id: '123',
          customer_id: '456',
          booking_date: '2023-01-15T10:00:00Z',
          status: 'pending',
          estimated_cost: 150.00,
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          customer_name: 'John Doe',
          customer_phone: '123-456-7890'
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

    // Search for "Toyota"
    const searchInput = screen.getByPlaceholderText('Search bookings...');
    fireEvent.change(searchInput, { target: { value: 'Toyota' } });

    // Check that search term is updated
    expect(searchInput).toHaveValue('Toyota');
  });
});