import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MechanicDashboard from '../../../pages/mechanic/Dashboard';
import { useAuth } from '../../../contexts/AuthContext';
import * as bookingService from '../../../services/bookingService';
import * as jobcardService from '../../../services/jobcardService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/bookingService');
vi.mock('../../../services/jobcardService');

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

describe('MechanicDashboard', () => {
  const mockUser = { id: '123', name: 'Mechanic User', role: 'mechanic' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test('renders loading spinner initially', async () => {
    render(
      <BrowserRouter>
        <MechanicDashboard />
      </BrowserRouter>
    );

    // The actual component uses a div with animate-spin class for the loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('renders dashboard with data when loading completes successfully', async () => {
    // Mock service responses
    bookingService.getMechanicBookings.mockResolvedValue([
      {
        id: '1',
        service_type: 'Oil Change',
        status: 'confirmed',
        booking_date: '2023-01-01',
        make: 'Toyota',
        model: 'Camry',
        customer_name: 'John Doe'
      },
      {
        id: '2',
        service_type: 'Brake Service',
        status: 'pending',
        booking_date: '2023-01-02',
        make: 'Honda',
        model: 'Civic',
        customer_name: 'Jane Smith'
      }
    ]);
    
    jobcardService.getMechanicJobCards.mockResolvedValue([
      {
        id: '1',
        title: 'Oil Change Job',
        status: 'in_progress',
        updated_at: '2023-01-01T10:00:00Z',
        created_at: '2023-01-01T09:00:00Z',
        make: 'Toyota',
        model: 'Camry'
      },
      {
        id: '2',
        title: 'Brake Service Job',
        status: 'assigned',
        updated_at: '2023-01-01T09:00:00Z',
        created_at: '2023-01-01T08:00:00Z',
        make: 'Honda',
        model: 'Civic'
      },
      {
        id: '3',
        title: 'Completed Job',
        status: 'completed',
        updated_at: new Date().toISOString(), // Today's date
        created_at: '2023-01-01T07:00:00Z',
        make: 'Ford',
        model: 'Focus'
      }
    ]);

    render(
      <BrowserRouter>
        <MechanicDashboard />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Check that dashboard content is displayed
    expect(screen.getByText('Welcome, Mechanic User!')).toBeInTheDocument();
    
    // Check that statistics are displayed by looking for specific labels
    expect(screen.getByText('Assigned Bookings')).toBeInTheDocument();
    expect(screen.getByText('Active Jobs')).toBeInTheDocument();
    expect(screen.getByText('Completed Today')).toBeInTheDocument();
    
    // Check specific values using getAllByText since there might be multiple instances
    const allTwos = screen.getAllByText('2');
    expect(allTwos.length).toBeGreaterThanOrEqual(2); // At least two "2"s for assigned bookings and active jobs
    
    const allOnes = screen.getAllByText('1');
    expect(allOnes.length).toBeGreaterThanOrEqual(1); // At least one "1" for completed today
    
    // Check that assigned bookings section exists
    expect(screen.getByText('Recent Bookings')).toBeInTheDocument();
    
    // Check that active job cards section exists
    expect(screen.getByText('Active Job Cards')).toBeInTheDocument();
  });

  test('renders error message when data loading fails', async () => {
    // Mock service failures
    bookingService.getMechanicBookings.mockRejectedValue(new Error('Network error'));
    jobcardService.getMechanicJobCards.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <MechanicDashboard />
      </BrowserRouter>
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  test('renders empty state when no data is available', async () => {
    // Mock empty service responses
    bookingService.getMechanicBookings.mockResolvedValue([]);
    jobcardService.getMechanicJobCards.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <MechanicDashboard />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Check that empty state messages are displayed
    expect(screen.getByText('No bookings assigned')).toBeInTheDocument();
    expect(screen.getByText('No active jobs')).toBeInTheDocument();
  });
});