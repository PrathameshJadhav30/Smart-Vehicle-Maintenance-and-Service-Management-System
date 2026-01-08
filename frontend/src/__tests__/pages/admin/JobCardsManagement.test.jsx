import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../../contexts/ToastContext';
import JobCardsManagementPage from '../../../pages/admin/JobCardsManagement';
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
      data-testid={children === 'View Details' ? 'view-button' : 
                   children === 'Delete' ? 'delete-button' : 
                   children === 'Close' ? 'close-button' : undefined}
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

// Mock the ConfirmationModal component
vi.mock('../../../components/ConfirmationModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onCancel, message }) => (
    isOpen ? (
      <div data-testid="confirmation-modal">
        <p>{message}</p>
        <button onClick={onConfirm} data-testid="confirm-action">Confirm</button>
        <button onClick={onCancel} data-testid="cancel-action">Cancel</button>
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

describe('JobCardsManagementPage', () => {
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
        <ToastProvider>
          <JobCardsManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Check for the loading spinner element using data-testid
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
        assigned_mechanic: '456',
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z',
        booking: {
          customer: { name: 'John Doe' },
          vehicle: { make: 'Toyota', model: 'Camry' }
        }
      },
      {
        id: '2',
        title: 'Brake Service Job',
        description: 'Replace brake pads for Honda Civic',
        status: 'pending',
        priority: 'high',
        assigned_mechanic: '789',
        created_at: '2023-01-02T09:00:00Z',
        updated_at: '2023-01-02T09:00:00Z',
        booking: {
          customer: { name: 'Jane Smith' },
          vehicle: { make: 'Honda', model: 'Civic' }
        }
      }
    ]);

    render(
      <BrowserRouter>
        <ToastProvider>
          <JobCardsManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that job cards are displayed
    expect(screen.getByText('Job Card #1')).toBeInTheDocument();
    expect(screen.getByText('Job Card #2')).toBeInTheDocument();
  });

  test('renders empty state when no job cards are found', async () => {
    // Mock job card service response with empty data
    jobcardService.getAllJobCards.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <ToastProvider>
          <JobCardsManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No job cards found')).toBeInTheDocument();
  });

  test('deletes job card when delete button is clicked', async () => {
    // Mock job card service response for loading job cards
    jobcardService.getAllJobCards.mockResolvedValue([
      {
        id: '1',
        title: 'Oil Change Job',
        description: 'Complete oil change for Toyota Camry',
        status: 'pending',
        priority: 'medium',
        assigned_mechanic: null,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z',
        booking: {
          customer: { name: 'John Doe' },
          vehicle: { make: 'Toyota', model: 'Camry' }
        }
      }
    ]);
    
    // Mock deleteJobCard service method
    jobcardService.deleteJobCard.mockResolvedValue({});

    // Mock window.confirm to return true
    mockConfirm.mockImplementation(() => true);

    render(
      <BrowserRouter>
        <ToastProvider>
          <JobCardsManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click delete button using data-testid
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);

    // Wait for confirmation modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });
    
    // Click confirm action
    const confirmButton = screen.getByTestId('confirm-action');
    fireEvent.click(confirmButton);

    // Wait for deleteJobCard to be called
    await waitFor(() => {
      expect(jobcardService.deleteJobCard).toHaveBeenCalledWith('1');
    });
  });

  test('does not delete job card when user cancels confirmation', async () => {
    // Mock job card service response for loading job cards
    jobcardService.getAllJobCards.mockResolvedValue([
      {
        id: '1',
        title: 'Oil Change Job',
        description: 'Complete oil change for Toyota Camry',
        status: 'pending',
        priority: 'medium',
        assigned_mechanic: null,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T11:00:00Z',
        booking: {
          customer: { name: 'John Doe' },
          vehicle: { make: 'Toyota', model: 'Camry' }
        }
      }
    ]);
    
    // Mock window.confirm to return false
    mockConfirm.mockImplementation(() => false);

    render(
      <BrowserRouter>
        <ToastProvider>
          <JobCardsManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click delete button using data-testid
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);

    // Wait for confirmation modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });
    
    // Click cancel action
    const cancelButton = screen.getByTestId('cancel-action');
    fireEvent.click(cancelButton);

    // Check that deleteJobCard was not called
    expect(jobcardService.deleteJobCard).not.toHaveBeenCalled();
  });
});