import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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
        <InvoicesManagementPage />
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
        totalAmount: 150.00,
        paymentStatus: 'paid',
        createdAt: '2023-01-15T10:00:00Z',
        dueDate: '2023-01-22T10:00:00Z',
        customer: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        jobCard: {
          vehicle: {
            make: 'Toyota',
            model: 'Camry'
          }
        }
      },
      {
        id: '2',
        booking_id: '456',
        totalAmount: 300.00,
        paymentStatus: 'unpaid',
        createdAt: '2023-01-16T14:00:00Z',
        dueDate: '2023-01-23T14:00:00Z',
        customer: {
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        jobCard: {
          vehicle: {
            make: 'Honda',
            model: 'Civic'
          }
        }
      }
    ]);

    render(
      <BrowserRouter>
        <InvoicesManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that invoices are displayed
    expect(screen.getByText('Invoice #1')).toBeInTheDocument();
    expect(screen.getByText('Invoice #2')).toBeInTheDocument();
    // Check for currency values
    expect(screen.getByText('₹150.00')).toBeInTheDocument();
    expect(screen.getByText('₹300.00')).toBeInTheDocument();
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
        <InvoicesManagementPage />
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
        totalAmount: 150.00,
        paymentStatus: 'unpaid',
        createdAt: '2023-01-15T10:00:00Z',
        dueDate: '2023-01-22T10:00:00Z',
        customer: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        jobCard: {
          vehicle: {
            make: 'Toyota',
            model: 'Camry'
          }
        }
      }
    ]);
    
    // Mock updatePaymentStatus service method
    invoiceService.updatePaymentStatus.mockResolvedValue({});

    // Mock window.confirm to return true
    mockConfirm.mockImplementation(() => true);

    render(
      <BrowserRouter>
        <InvoicesManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click mark as paid button using data-testid
    const markPaidButton = screen.getByTestId('mark-paid-button');
    fireEvent.click(markPaidButton);

    // Wait for confirmation
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to mark this invoice as paid?');
    });

    // Check that updatePaymentStatus was called
    expect(invoiceService.updatePaymentStatus).toHaveBeenCalledWith('1', { paymentStatus: 'paid' });
  });

  test('filters invoices by status', async () => {
    // Mock invoice service response
    invoiceService.getAllInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '123',
        totalAmount: 150.00,
        paymentStatus: 'paid',
        createdAt: '2023-01-15T10:00:00Z',
        dueDate: '2023-01-22T10:00:00Z',
        customer: {
          name: 'John Doe',
          email: 'john@example.com'
        },
        jobCard: {
          vehicle: {
            make: 'Toyota',
            model: 'Camry'
          }
        }
      },
      {
        id: '2',
        booking_id: '456',
        totalAmount: 300.00,
        paymentStatus: 'unpaid',
        createdAt: '2023-01-16T14:00:00Z',
        dueDate: '2023-01-23T14:00:00Z',
        customer: {
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        jobCard: {
          vehicle: {
            make: 'Honda',
            model: 'Civic'
          }
        }
      }
    ]);

    render(
      <BrowserRouter>
        <InvoicesManagementPage />
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