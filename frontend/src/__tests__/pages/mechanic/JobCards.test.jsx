import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JobCardsPage from '../../../pages/mechanic/JobCards';
import { useAuth } from '../../../contexts/AuthContext';
import * as jobcardService from '../../../services/jobcardService';
import * as bookingService from '../../../services/bookingService';
import * as vehicleService from '../../../services/vehicleService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/jobcardService');
vi.mock('../../../services/bookingService');
vi.mock('../../../services/vehicleService');

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

describe('JobCardsPage', () => {
  const mockUser = { id: '123', name: 'Mechanic User', role: 'mechanic' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'mechanic' });
  });

  test('renders loading spinner initially', () => {
    // Mock the dropdown data loading functions to prevent network errors
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <JobCardsPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders job cards when data is available', async () => {
    // Mock job card service response
    jobcardService.getAllJobCards.mockResolvedValue([
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
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
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
    jobcardService.getAllJobCards.mockResolvedValue([]);
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No job cards found')).toBeInTheDocument();
  });

  test('opens create job card modal when add button is clicked', async () => {
    // Mock job card service response with empty data
    jobcardService.getAllJobCards.mockResolvedValue([]);
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click add job card button
    const addButton = screen.getByText('Create Job Card');
    fireEvent.click(addButton);

    // Check that modal is opened
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Create Job Card')).toBeInTheDocument();
  });

  test('creates new job card when form is submitted', async () => {
    // Mock job card service response for loading job cards
    jobcardService.getAllJobCards.mockResolvedValue([]);
    
    // Mock job card service response for creating job card
    jobcardService.createJobCard.mockResolvedValue({
      id: '1',
      title: 'New Job Card',
      description: 'Description of new job card',
      status: 'assigned',
      priority: 'medium',
      assigned_mechanic: '123'
    });
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Open create job card modal
    const addButton = screen.getByText('Create Job Card');
    fireEvent.click(addButton);

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Job Card' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Description of new job card' } });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'medium' } });

    // Submit the form
    const submitButton = screen.getByText('Create Job Card');
    fireEvent.click(submitButton);

    // Wait for job card to be created
    await waitFor(() => {
      expect(jobcardService.createJobCard).toHaveBeenCalledWith({
        title: 'New Job Card',
        description: 'Description of new job card',
        status: 'assigned',
        priority: 'medium',
        assigned_mechanic: '123'
      });
    });

    // Check that modal is closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('opens edit job card modal when edit button is clicked', async () => {
    // Mock job card service response with data
    jobcardService.getAllJobCards.mockResolvedValue([
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
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Check that modal is opened with job card data
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Job Card')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Oil Change Job');
    expect(screen.getByLabelText('Description')).toHaveValue('Complete oil change for Toyota Camry');
  });

  test('updates job card when edit form is submitted', async () => {
    // Mock job card service response for loading job cards
    jobcardService.getAllJobCards.mockResolvedValue([
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
    
    // Mock job card service response for updating job card
    jobcardService.updateJobCard.mockResolvedValue({
      id: '1',
      title: 'Updated Job Card',
      description: 'Updated description',
      status: 'in_progress',
      priority: 'high',
      assigned_mechanic: '123'
    });
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Change title and priority fields
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated Job Card' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Updated description' } });
    fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'high' } });

    // Submit the form
    const submitButton = screen.getByText('Update Job Card');
    fireEvent.click(submitButton);

    // Wait for job card to be updated
    await waitFor(() => {
      expect(jobcardService.updateJobCard).toHaveBeenCalledWith('1', {
        title: 'Updated Job Card',
        description: 'Updated description',
        status: 'in_progress',
        priority: 'high',
        assigned_mechanic: '123'
      });
    });

    // Check that modal is closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('deletes job card when delete button is clicked', async () => {
    // Mock job card service response for loading job cards
    jobcardService.getAllJobCards.mockResolvedValue([
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
    
    // Mock job card service response for deleting job card
    jobcardService.deleteJobCard.mockResolvedValue({});
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Mock window.confirm to return true
    const mockConfirm = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Wait for job card to be deleted
    await waitFor(() => {
      expect(jobcardService.deleteJobCard).toHaveBeenCalledWith('1');
    });

    // Restore window.confirm
    mockConfirm.mockRestore();
  });

  test('loads job cards when refresh button is clicked', async () => {
    // Mock job card service response
    jobcardService.getAllJobCards.mockResolvedValue([]);
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
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
    expect(jobcardService.getAllJobCards).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  test('filters job cards by status', async () => {
    // Mock job card service response
    jobcardService.getAllJobCards.mockResolvedValue([
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
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
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
    jobcardService.getAllJobCards.mockResolvedValue([
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
    
    // Mock dropdown data
    vehicleService.getAllVehicles.mockResolvedValue([]);
    bookingService.getAllBookings.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <JobCardsPage />
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