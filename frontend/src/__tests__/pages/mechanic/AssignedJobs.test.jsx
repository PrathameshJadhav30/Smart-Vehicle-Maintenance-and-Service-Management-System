import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AssignedJobsPage from '../../../pages/mechanic/AssignedJobs';
import { useAuth } from '../../../contexts/AuthContext';
import * as jobcardService from '../../../services/jobcardService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/jobcardService');

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

describe('AssignedJobsPage', () => {
  const mockUser = { id: '123', name: 'Mechanic User', role: 'mechanic' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'mechanic' });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <AssignedJobsPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders job cards when data is available', async () => {
    // Mock job card service response
    jobcardService.getMechanicJobCards.mockResolvedValue([
      {
        id: '1',
        title: 'Oil Change Job',
        description: 'Complete oil change for Toyota Camry',
        status: 'in_progress',
        priority: 'medium',
        assigned_mechanic: '123',
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z'
      },
      {
        id: '2',
        title: 'Brake Service Job',
        description: 'Replace brake pads for Honda Civic',
        status: 'assigned',
        priority: 'high',
        assigned_mechanic: '123',
        created_at: '2023-01-02T09:00:00Z',
        updated_at: '2023-01-02T09:00:00Z'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedJobsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that job cards are displayed
    expect(screen.getByText('Oil Change Job')).toBeInTheDocument();
    expect(screen.getByText('Brake Service Job')).toBeInTheDocument();
    expect(screen.getByText('Complete oil change for Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('Replace brake pads for Honda Civic')).toBeInTheDocument();
  });

  test('renders empty state when no job cards are found', async () => {
    // Mock job card service response with empty data
    jobcardService.getMechanicJobCards.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <AssignedJobsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No job cards found')).toBeInTheDocument();
  });

  test('opens job card details modal when view button is clicked', async () => {
    // Mock job card service response
    jobcardService.getMechanicJobCards.mockResolvedValue([
      {
        id: '1',
        title: 'Oil Change Job',
        description: 'Complete oil change for Toyota Camry',
        status: 'in_progress',
        priority: 'medium',
        assigned_mechanic: '123',
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedJobsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click view button
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    // Check that modal is opened
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Job Card #1')).toBeInTheDocument();
  });

  test('navigates to job card edit page when edit button is clicked', async () => {
    // Mock job card service response
    jobcardService.getMechanicJobCards.mockResolvedValue([
      {
        id: '1',
        title: 'Oil Change Job',
        description: 'Complete oil change for Toyota Camry',
        status: 'in_progress',
        priority: 'medium',
        assigned_mechanic: '123',
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedJobsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Check that navigation occurred
    expect(mockNavigate).toHaveBeenCalledWith('/mechanic/job-cards/edit/1');
  });

  test('loads job cards when refresh button is clicked', async () => {
    // Mock job card service response
    jobcardService.getMechanicJobCards.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <AssignedJobsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Check that loadJobCards was called
    expect(jobcardService.getMechanicJobCards).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  test('filters job cards by status', async () => {
    // Mock job card service response
    jobcardService.getMechanicJobCards.mockResolvedValue([
      {
        id: '1',
        title: 'Oil Change Job',
        description: 'Complete oil change for Toyota Camry',
        status: 'in_progress',
        priority: 'medium',
        assigned_mechanic: '123',
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z'
      },
      {
        id: '2',
        title: 'Brake Service Job',
        description: 'Replace brake pads for Honda Civic',
        status: 'assigned',
        priority: 'high',
        assigned_mechanic: '123',
        created_at: '2023-01-02T09:00:00Z',
        updated_at: '2023-01-02T09:00:00Z'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedJobsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Filter by "in_progress" status
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'in_progress' } });

    // Check that filter state is updated
    expect(filterSelect).toHaveValue('in_progress');
  });

  test('searches job cards by term', async () => {
    // Mock job card service response
    jobcardService.getMechanicJobCards.mockResolvedValue([
      {
        id: '1',
        title: 'Oil Change Job',
        description: 'Complete oil change for Toyota Camry',
        status: 'in_progress',
        priority: 'medium',
        assigned_mechanic: '123',
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z'
      }
    ]);

    render(
      <BrowserRouter>
        <AssignedJobsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Search for "Oil Change"
    const searchInput = screen.getByPlaceholderText('Search job cards...');
    fireEvent.change(searchInput, { target: { value: 'Oil Change' } });

    // Check that search term is updated
    expect(searchInput).toHaveValue('Oil Change');
  });
});