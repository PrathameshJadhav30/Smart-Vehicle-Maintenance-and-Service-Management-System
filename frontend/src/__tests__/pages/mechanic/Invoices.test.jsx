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

describe('InvoicesPage', () => {
  const mockUser = { id: '123', name: 'Mechanic User', role: 'mechanic' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'mechanic' });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders invoices when data is available', async () => {
    // Mock invoice service response
    invoiceService.getMechanicInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '101',
        customer_name: 'John Doe',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        total_amount: 150.00,
        status: 'paid',
        created_at: '2023-01-01T10:00:00Z'
      },
      {
        id: '2',
        booking_id: '102',
        customer_name: 'Jane Smith',
        vehicle_make: 'Honda',
        vehicle_model: 'Civic',
        total_amount: 200.00,
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
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that invoices are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });

  test('renders empty state when no invoices are found', async () => {
    // Mock invoice service response with empty data
    invoiceService.getMechanicInvoices.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No invoices found')).toBeInTheDocument();
  });

  test('opens invoice details modal when view button is clicked', async () => {
    // Mock invoice service response
    invoiceService.getMechanicInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '101',
        customer_name: 'John Doe',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        total_amount: 150.00,
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
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click view button
    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);

    // Check that modal is opened
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Invoice #1')).toBeInTheDocument();
  });

  test('loads invoices when refresh button is clicked', async () => {
    // Mock invoice service response
    invoiceService.getMechanicInvoices.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <InvoicesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Check that loadInvoices was called
    expect(invoiceService.getMechanicInvoices).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  test('filters invoices by status', async () => {
    // Mock invoice service response
    invoiceService.getMechanicInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '101',
        customer_name: 'John Doe',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        total_amount: 150.00,
        status: 'paid',
        created_at: '2023-01-01T10:00:00Z'
      },
      {
        id: '2',
        booking_id: '102',
        customer_name: 'Jane Smith',
        vehicle_make: 'Honda',
        vehicle_model: 'Civic',
        total_amount: 200.00,
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
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Filter by "paid" status
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'paid' } });

    // Check that filter state is updated
    expect(filterSelect).toHaveValue('paid');
  });

  test('searches invoices by term', async () => {
    // Mock invoice service response
    invoiceService.getMechanicInvoices.mockResolvedValue([
      {
        id: '1',
        booking_id: '101',
        customer_name: 'John Doe',
        vehicle_make: 'Toyota',
        vehicle_model: 'Camry',
        total_amount: 150.00,
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
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Search for "John"
    const searchInput = screen.getByPlaceholderText('Search invoices...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Check that search term is updated
    expect(searchInput).toHaveValue('John');
  });
});