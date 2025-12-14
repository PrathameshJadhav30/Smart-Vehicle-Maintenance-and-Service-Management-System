import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InvoicesPage from '../../../pages/customer/Invoices';
import { useAuth } from '../../../contexts/AuthContext';
import * as invoiceService from '../../../services/invoiceService';
import * as paymentService from '../../../services/paymentService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/invoiceService');
vi.mock('../../../services/paymentService');

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

// Mock window.alert and window.confirm
window.alert = vi.fn();
window.confirm = vi.fn(() => true);

describe('InvoicesPage', () => {
  const mockUser = { id: '123', name: 'John Doe', role: 'customer' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Check for the loading spinner div using a class-based query
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('renders empty state when no invoices are found', async () => {
    // Mock invoice service response with empty array
    invoiceService.getCustomerInvoices.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No invoices found')).toBeInTheDocument();
    expect(screen.getByText('Refresh Invoices')).toBeInTheDocument();
  });

  test('renders invoices when data is available', async () => {
    // Mock invoice service response with data
    invoiceService.getCustomerInvoices.mockResolvedValue([
      {
        id: '1',
        status: 'paid',
        grand_total: 1500,
        created_at: '2023-01-01'
      },
      {
        id: '2',
        status: 'unpaid',
        grand_total: 2000,
        created_at: '2023-01-02'
      }
    ]);

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Check that invoices are displayed
    expect(screen.getByText('Invoice #1')).toBeInTheDocument();
    expect(screen.getByText('Invoice #2')).toBeInTheDocument();
    
    // Check that status badges are displayed
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Unpaid')).toBeInTheDocument();
    
    // Check that amounts are displayed
    expect(screen.getByText('₹1,500.00')).toBeInTheDocument();
    expect(screen.getByText('₹2,000.00')).toBeInTheDocument();
  });

  test('loads invoice details when view details button is clicked', async () => {
    // Mock invoice service responses
    invoiceService.getCustomerInvoices.mockResolvedValue([
      {
        id: '1',
        status: 'paid',
        grand_total: 1500,
        created_at: '2023-01-01'
      }
    ]);
    
    invoiceService.getInvoiceById.mockResolvedValue({
      invoice: {
        id: '1',
        status: 'paid',
        grand_total: 1500,
        created_at: '2023-01-01'
      },
      tasks: [
        { id: '1', task_name: 'Oil Change', task_cost: 1500 }
      ],
      parts: []
    });

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Click view details button
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    // Check that invoice details are displayed in the modal using a more specific selector
    // Look for the h2 element inside the modal which contains the title
    expect(screen.getByTestId('modal').querySelector('h2')).toHaveTextContent('Invoice #1');
  });

  test('processes payment when pay now button is clicked', async () => {
    // Mock invoice service response
    invoiceService.getCustomerInvoices.mockResolvedValue([
      {
        id: '1',
        status: 'unpaid',
        grand_total: 1500,
        created_at: '2023-01-01'
      }
    ]);
    
    // Mock payment service response
    paymentService.mockPayment.mockResolvedValue({
      success: true,
      message: 'Payment processed successfully'
    });

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Click pay now button
    const payNowButton = screen.getByText('Pay Now');
    fireEvent.click(payNowButton);

    // Wait for payment to be processed
    await waitFor(() => {
      expect(paymentService.mockPayment).toHaveBeenCalledWith({
        invoiceId: '1',
        amount: 1500,
        method: 'card'
      });
    });
  });

  test('refreshes invoices when refresh button is clicked', async () => {
    // Mock invoice service response
    invoiceService.getCustomerInvoices.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh Invoices');
    fireEvent.click(refreshButton);

    // Wait for invoices to be reloaded
    await waitFor(() => {
      expect(invoiceService.getCustomerInvoices).toHaveBeenCalledTimes(2);
    });
  });
});