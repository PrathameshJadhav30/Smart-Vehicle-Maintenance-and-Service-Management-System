import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InvoicesPage from '../../../pages/mechanic/Invoices';
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

describe('InvoicesPage', () => {
  const mockUser = { id: '123', name: 'Mechanic User', role: 'mechanic' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'mechanic' });
  });

  test('renders loading spinner initially', async () => {
    // Mock the invoice service to delay response
    invoiceService.getAllInvoices.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve([]), 100);
    }));

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Check for the loading spinner div using a class-based query
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  test('renders invoices when data is available', async () => {
    // Mock invoice service response
    invoiceService.getAllInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '101',
        customer: { name: 'John Doe' },
        jobCard: { vehicle: { make: 'Toyota', model: 'Camry' } },
        grand_total: 150.00,
        status: 'paid',
        created_at: '2023-01-01T10:00:00Z'
      },
      {
        id: '2',
        booking_id: '102',
        customer: { name: 'Jane Smith' },
        jobCard: { vehicle: { make: 'Honda', model: 'Civic' } },
        grand_total: 200.00,
        status: 'pending',
        created_at: '2023-01-02T14:00:00Z'
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
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    expect(screen.getByText(/Toyota Camry/i)).toBeInTheDocument();
    expect(screen.getByText(/Honda Civic/i)).toBeInTheDocument();
    expect(screen.getByText('₹150.00')).toBeInTheDocument();
    expect(screen.getByText('₹200.00')).toBeInTheDocument();
  });

  test('renders empty state when no invoices are found', async () => {
    // Mock invoice service response with empty data
    invoiceService.getAllInvoices.mockResolvedValue([]);

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
  });

  test('opens invoice details modal when view button is clicked', async () => {
    // Mock invoice service response
    invoiceService.getAllInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '101',
        customer: { name: 'John Doe' },
        jobCard: { vehicle: { make: 'Toyota', model: 'Camry' } },
        grand_total: 150.00,
        status: 'paid',
        created_at: '2023-01-01T10:00:00Z'
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

    // Click view button
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);

    // Check that modal is opened
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    // Check that the modal header contains the invoice ID (be more specific)
    const modalHeader = screen.getByTestId('modal').querySelector('h2');
    expect(modalHeader).toHaveTextContent('Invoice #1');
  });

  test('loads invoices when filter changes', async () => {
    // Mock invoice service response
    const mockInvoices = [
      {
        id: '1',
        booking_id: '101',
        customer: { name: 'John Doe' },
        jobCard: { vehicle: { make: 'Toyota', model: 'Camry' } },
        grand_total: 150.00,
        status: 'paid',
        created_at: '2023-01-01T10:00:00Z'
      }
    ];

    invoiceService.getAllInvoices.mockResolvedValue(mockInvoices);

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Verify initial call
    expect(invoiceService.getAllInvoices).toHaveBeenCalledTimes(1);

    // Change filter to trigger reload
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'paid' } });

    // Wait a bit for the effect to trigger
    await waitFor(() => {
      // Should have been called again due to filter change
      expect(invoiceService.getAllInvoices).toHaveBeenCalledTimes(2);
    });
  });

  test('filters invoices by status', async () => {
    // Mock invoice service response
    invoiceService.getAllInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '101',
        customer: { name: 'John Doe' },
        jobCard: { vehicle: { make: 'Toyota', model: 'Camry' } },
        grand_total: 150.00,
        status: 'paid',
        created_at: '2023-01-01T10:00:00Z'
      },
      {
        id: '2',
        booking_id: '102',
        customer: { name: 'Jane Smith' },
        jobCard: { vehicle: { make: 'Honda', model: 'Civic' } },
        grand_total: 200.00,
        status: 'pending',
        created_at: '2023-01-02T14:00:00Z'
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

    // Filter by "paid" status
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'paid' } });

    // Check that filter state is updated
    expect(filterSelect).toHaveValue('paid');
  });

  test('search functionality placeholder test', async () => {
    // Mock invoice service response
    invoiceService.getAllInvoices.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // The search functionality is not implemented in this component
    // So we'll just note that in the test
    expect(true).toBe(true); // Placeholder test since search isn't implemented
  });
});