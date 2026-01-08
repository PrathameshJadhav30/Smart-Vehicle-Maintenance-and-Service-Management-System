import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../../contexts/ToastContext';
import InvoicesManagementPage from '../../../pages/admin/InvoicesManagement';
import { useAuth } from '../../../contexts/AuthContext';
import * as invoiceService from '../../../services/invoiceService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/invoiceService');

// Mock the Button component
vi.mock('../../../components/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, className, ...props }) => (
    <button 
      onClick={onClick}
      className={className}
      {...props}
      data-testid={children.includes('View Details') ? 'view-button' : 
                   children.includes('Mark as Paid') ? 'mark-paid-button' : 
                   children.includes('Mark Paid') ? 'mark-paid-button' : 
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

describe('InvoicesManagementPage', () => {
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
          <InvoicesManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Check for the loading spinner element using data-testid
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders invoices when data is available', async () => {
    // Mock invoice service response
    invoiceService.getAllInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '123',
        grand_total: 150.00,
        status: 'paid',
        created_at: '2023-01-15T10:00:00Z',
        customer_name: 'John Doe',
        model: 'Toyota Camry'
      },
      {
        id: '2',
        booking_id: '456',
        grand_total: 300.00,
        status: 'unpaid',
        created_at: '2023-01-16T14:00:00Z',
        customer_name: 'Jane Smith',
        model: 'Honda Civic'
      }
    ]);

    render(
      <BrowserRouter>
        <ToastProvider>
          <InvoicesManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that invoices are displayed
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    // Check for currency values - using partial text matching since format may vary
    expect(screen.getByText(/₹150/)).toBeInTheDocument();
    expect(screen.getByText(/₹300/)).toBeInTheDocument();
    // Use getAllByText and check specific elements to avoid dropdown conflicts
    const statusElements = screen.getAllByText('Paid');
    // The first one should be in the invoice list (not in the dropdown)
    expect(statusElements[0]).toBeInTheDocument();
    const unpaidElements = screen.getAllByText('Unpaid');
    expect(unpaidElements[0]).toBeInTheDocument();
  });

  test('renders empty state when no invoices are found', async () => {
    // Mock invoice service response with empty data
    invoiceService.getAllInvoices.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <ToastProvider>
          <InvoicesManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No invoices found')).toBeInTheDocument();
  });

  test('updates payment status when mark as paid button is clicked', async () => {
    // Mock invoice service response for loading invoices
    invoiceService.getAllInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '123',
        grand_total: 150.00,
        status: 'unpaid',
        created_at: '2023-01-15T10:00:00Z',
        customer_name: 'John Doe',
        model: 'Toyota Camry'
      }
    ]);
    
    // Mock updatePaymentStatus service method
    invoiceService.updatePaymentStatus.mockResolvedValue({});

    // Note: The component uses confirmation modal, not window.confirm
    // mockConfirm.mockImplementation(() => true);

    render(
      <BrowserRouter>
        <ToastProvider>
          <InvoicesManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click mark as paid button using data-testid
    const markPaidButton = screen.getByTestId('mark-paid-button');
    fireEvent.click(markPaidButton);

    // Wait for confirmation modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    });
    
    // Click confirm action
    const confirmButton = screen.getByTestId('confirm-action');
    fireEvent.click(confirmButton);

    // Wait for updatePaymentStatus to be called
    await waitFor(() => {
      expect(invoiceService.updatePaymentStatus).toHaveBeenCalledWith('1', { status: 'paid' });
    });
  });

  test('filters invoices by status', async () => {
    // Mock invoice service response
    invoiceService.getAllInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '123',
        grand_total: 150.00,
        status: 'paid',
        created_at: '2023-01-15T10:00:00Z',
        customer_name: 'John Doe',
        model: 'Toyota Camry'
      },
      {
        id: '2',
        booking_id: '456',
        grand_total: 300.00,
        status: 'unpaid',
        created_at: '2023-01-16T14:00:00Z',
        customer_name: 'Jane Smith',
        model: 'Honda Civic'
      }
    ]);

    render(
      <BrowserRouter>
        <ToastProvider>
          <InvoicesManagementPage />
        </ToastProvider>
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Filter by "paid" status
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'paid' } });

    // Check that filter state is updated
    expect(filterSelect).toHaveValue('paid');
  });
});