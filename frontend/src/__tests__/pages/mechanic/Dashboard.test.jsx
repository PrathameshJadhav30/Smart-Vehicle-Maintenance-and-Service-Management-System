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

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders dashboard with data when loading completes successfully', async () => {
    // Mock service responses
    bookingService.getMechanicBookings.mockResolvedValue([
      {
        id: '1',
        service_type: 'Oil Change',
        status: 'confirmed',
        booking_date: '2023-01-01'
      },
      {
        id: '2',
        service_type: 'Brake Service',
        status: 'pending',
        booking_date: '2023-01-02'
      }
    ]);
    
    jobcardService.getMechanicJobCards.mockResolvedValue([
      {
        id: '1',
        title: 'Oil Change Job',
        status: 'in_progress',
        updated_at: '2023-01-01T10:00:00Z'
      },
      {
        id: '2',
        title: 'Brake Service Job',
        status: 'assigned',
        updated_at: '2023-01-01T09:00:00Z'
      },
      {
        id: '3',
        title: 'Completed Job',
        status: 'completed',
        updated_at: new Date().toISOString() // Today's date
      }
    ]);

    render(
      <BrowserRouter>
        <MechanicDashboard />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that dashboard content is displayed
    expect(screen.getByText('Welcome, Mechanic User!')).toBeInTheDocument();
    
    // Check that statistics are displayed
    expect(screen.getByText('2')).toBeInTheDocument(); // Pending Bookings
    expect(screen.getByText('2')).toBeInTheDocument(); // In Progress Jobs
    expect(screen.getByText('1')).toBeInTheDocument(); // Completed Today
    
    // Check that assigned bookings are displayed
    expect(screen.getByText('Oil Change')).toBeInTheDocument();
    expect(screen.getByText('Brake Service')).toBeInTheDocument();
    
    // Check that active job cards are displayed
    expect(screen.getByText('Oil Change Job')).toBeInTheDocument();
    expect(screen.getByText('Brake Service Job')).toBeInTheDocument();
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
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state messages are displayed
    expect(screen.getByText('No bookings assigned')).toBeInTheDocument();
    expect(screen.getByText('No active jobs')).toBeInTheDocument();
  });
});