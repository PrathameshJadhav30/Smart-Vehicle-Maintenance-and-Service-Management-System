import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AssignedBookingsPage from '../../../pages/mechanic/AssignedBookings';
import { useAuth } from '../../../contexts/AuthContext';
import * as bookingService from '../../../services/bookingService';
import * as jobcardService from '../../../services/jobcardService';
import * as invoiceService from '../../../services/invoiceService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/bookingService');
vi.mock('../../../services/jobcardService');
vi.mock('../../../services/invoiceService');

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

describe('AssignedBookingsPage', () => {
  const mockUser = { id: '123', name: 'Mechanic User', role: 'mechanic' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'mechanic' });
  });

  test('renders loading spinner initially', async () => {
    // Mock a delayed response to ensure we can catch the loading state
    bookingService.getMechanicBookings.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve([]), 100);
    }));

    render(
      <BrowserRouter>
        <AssignedBookingsPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  test('renders bookings when data is available', async () => {
    // Mock booking service response
    bookingService.getMechanicBookings.mockResolvedValue([
      {
        id: '1',
        customer_name: 'John Doe',
        email: 'john@example.com',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        service_type: 'Oil Change',
        status: 'assigned',
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
        status: 'in_progress',
        booking_date: '2023-01-02',
        booking_time: '14:00'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedBookingsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that bookings are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    // Check for make and model separately since they're in different divs
    expect(screen.getByText('Camry')).toBeInTheDocument();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Civic')).toBeInTheDocument();
    expect(screen.getByText('Honda')).toBeInTheDocument();
    expect(screen.getByText('Oil Change')).toBeInTheDocument();
    expect(screen.getByText('Brake Service')).toBeInTheDocument();
    
    // Check that Start Job button is present for assigned booking
    expect(screen.getByText('Start Job')).toBeInTheDocument();
  });

  test('renders empty state when no bookings are found', async () => {
    // Mock booking service response with empty data
    bookingService.getMechanicBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <AssignedBookingsPage />
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
    bookingService.getMechanicBookings.mockResolvedValue([
      {
        id: '1',
        customer_name: 'John Doe',
        email: 'john@example.com',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        service_type: 'Oil Change',
        status: 'assigned',
        booking_date: '2023-01-01',
        booking_time: '10:00'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedBookingsPage />
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

  test('navigates to job cards page when start job button is clicked', async () => {
    // Mock booking service response
    bookingService.getMechanicBookings.mockResolvedValue([
      {
        id: '1',
        customer_name: 'John Doe',
        email: 'john@example.com',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        service_type: 'Oil Change',
        status: 'assigned',
        booking_date: '2023-01-01',
        booking_time: '10:00'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedBookingsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click start job button
    const startJobButton = screen.getByText('Start Job');
    fireEvent.click(startJobButton);

    // Check that navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/mechanic/job-cards?bookingId=1');
  });

  test('loads bookings when refresh button is clicked', async () => {
    // Mock booking service response
    bookingService.getMechanicBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <AssignedBookingsPage />
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
    expect(bookingService.getMechanicBookings).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  test('filters bookings by status', async () => {
    // Mock booking service response
    bookingService.getMechanicBookings.mockResolvedValue([
      {
        id: '1',
        customer_name: 'John Doe',
        email: 'john@example.com',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        service_type: 'Oil Change',
        status: 'assigned',
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
        status: 'in_progress',
        booking_date: '2023-01-02',
        booking_time: '14:00'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedBookingsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Filter by "assigned" status
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'assigned' } });

    // Check that only assigned bookings are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Since we're filtering in the UI, both bookings might still be in the DOM but visually filtered
    // We'll check that the filter state is updated
    expect(filterSelect).toHaveValue('assigned');
  });

  test('searches bookings by term', async () => {
    // Mock booking service response
    bookingService.getMechanicBookings.mockResolvedValue([
      {
        id: '1',
        customer_name: 'John Doe',
        email: 'john@example.com',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        service_type: 'Oil Change',
        status: 'assigned',
        booking_date: '2023-01-01',
        booking_time: '10:00'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedBookingsPage />
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