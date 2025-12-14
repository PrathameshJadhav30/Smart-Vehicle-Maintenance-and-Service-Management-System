import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PartsUsagePage from '../../../pages/mechanic/PartsUsage';
import { useAuth } from '../../../contexts/AuthContext';
import * as partsService from '../../../services/partsService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/partsService');

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

describe('PartsUsagePage', () => {
  const mockUser = { id: '123', name: 'Mechanic User', role: 'mechanic' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'mechanic' });
  });

  test('renders loading spinner initially', () => {
    // Mock the suppliers loading function to prevent network errors
    partsService.getAllSuppliers.mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders parts when data is available', async () => {
    // Mock parts service response
    partsService.getAllParts.mockResolvedValue([
      {
        id: '1',
        name: 'Engine Oil',
        part_number: 'EO-123',
        quantity: 50,
        price: 25.00,
        supplier: 'Auto Parts Co.',
        supplier_name: 'Auto Parts Co.'
      },
      {
        id: '2',
        name: 'Brake Pads',
        part_number: 'BP-456',
        quantity: 30,
        price: 45.00,
        supplier: 'Brake Specialists',
        supplier_name: 'Brake Specialists'
      }
    ]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that parts are displayed
    expect(screen.getByText('Engine Oil')).toBeInTheDocument();
    expect(screen.getByText('Brake Pads')).toBeInTheDocument();
    expect(screen.getByText('EO-123')).toBeInTheDocument();
    expect(screen.getByText('BP-456')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  test('renders empty state when no parts are found', async () => {
    // Mock parts service response with empty data
    partsService.getAllParts.mockResolvedValue([]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No parts found')).toBeInTheDocument();
  });

  test('opens add part modal when add button is clicked', async () => {
    // Mock parts service response with empty data
    partsService.getAllParts.mockResolvedValue([]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click add part button
    const addButton = screen.getByText('Add Part');
    fireEvent.click(addButton);

    // Check that modal is opened
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Add Part')).toBeInTheDocument();
  });

  test('creates new part when form is submitted', async () => {
    // Mock parts service response for loading parts
    partsService.getAllParts.mockResolvedValue([]);
    
    // Mock parts service response for creating part
    partsService.createPart.mockResolvedValue({
      id: '1',
      name: 'New Part',
      part_number: 'NP-789',
      quantity: 25,
      price: 30.00,
      supplier: 'New Supplier',
      supplier_name: 'New Supplier'
    });
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Open add part modal
    const addButton = screen.getByText('Add Part');
    fireEvent.click(addButton);

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Part Name'), { target: { value: 'New Part' } });
    fireEvent.change(screen.getByLabelText('Part Number'), { target: { value: 'NP-789' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '30.00' } });
    fireEvent.change(screen.getByLabelText('Supplier'), { target: { value: 'New Supplier' } });

    // Submit the form
    const submitButton = screen.getByText('Add Part');
    fireEvent.click(submitButton);

    // Wait for part to be created
    await waitFor(() => {
      expect(partsService.createPart).toHaveBeenCalledWith({
        name: 'New Part',
        part_number: 'NP-789',
        quantity: 25,
        price: 30.00,
        supplier: 'New Supplier'
      });
    });

    // Check that modal is closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('opens edit part modal when edit button is clicked', async () => {
    // Mock parts service response with data
    partsService.getAllParts.mockResolvedValue([
      {
        id: '1',
        name: 'Engine Oil',
        part_number: 'EO-123',
        quantity: 50,
        price: 25.00,
        supplier: 'Auto Parts Co.',
        supplier_name: 'Auto Parts Co.'
      }
    ]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Check that modal is opened with part data
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Part')).toBeInTheDocument();
    expect(screen.getByLabelText('Part Name')).toHaveValue('Engine Oil');
    expect(screen.getByLabelText('Part Number')).toHaveValue('EO-123');
  });

  test('updates part when edit form is submitted', async () => {
    // Mock parts service response for loading parts
    partsService.getAllParts.mockResolvedValue([
      {
        id: '1',
        name: 'Engine Oil',
        part_number: 'EO-123',
        quantity: 50,
        price: 25.00,
        supplier: 'Auto Parts Co.',
        supplier_name: 'Auto Parts Co.'
      }
    ]);
    
    // Mock parts service response for updating part
    partsService.updatePart.mockResolvedValue({
      id: '1',
      name: 'Updated Engine Oil',
      part_number: 'EO-123',
      quantity: 45,
      price: 27.50,
      supplier: 'Auto Parts Co.',
      supplier_name: 'Auto Parts Co.'
    });
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Change name, quantity, and price fields
    fireEvent.change(screen.getByLabelText('Part Name'), { target: { value: 'Updated Engine Oil' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText('Price'), { target: { value: '27.50' } });

    // Submit the form
    const submitButton = screen.getByText('Update Part');
    fireEvent.click(submitButton);

    // Wait for part to be updated
    await waitFor(() => {
      expect(partsService.updatePart).toHaveBeenCalledWith('1', {
        name: 'Updated Engine Oil',
        part_number: 'EO-123',
        quantity: 45,
        price: 27.50,
        supplier: 'Auto Parts Co.'
      });
    });

    // Check that modal is closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('deletes part when delete button is clicked', async () => {
    // Mock parts service response for loading parts
    partsService.getAllParts.mockResolvedValue([
      {
        id: '1',
        name: 'Engine Oil',
        part_number: 'EO-123',
        quantity: 50,
        price: 25.00,
        supplier: 'Auto Parts Co.',
        supplier_name: 'Auto Parts Co.'
      }
    ]);
    
    // Mock parts service response for deleting part
    partsService.deletePart.mockResolvedValue({});
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
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

    // Wait for part to be deleted
    await waitFor(() => {
      expect(partsService.deletePart).toHaveBeenCalledWith('1');
    });

    // Restore window.confirm
    mockConfirm.mockRestore();
  });

  test('loads parts when refresh button is clicked', async () => {
    // Mock parts service response
    partsService.getAllParts.mockResolvedValue([]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Check that loadParts was called
    expect(partsService.getAllParts).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
  });

  test('searches parts by term', async () => {
    // Mock parts service response
    partsService.getAllParts.mockResolvedValue([
      {
        id: '1',
        name: 'Engine Oil',
        part_number: 'EO-123',
        quantity: 50,
        price: 25.00,
        supplier: 'Auto Parts Co.',
        supplier_name: 'Auto Parts Co.'
      }
    ]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Search for "Engine Oil"
    const searchInput = screen.getByPlaceholderText('Search parts...');
    fireEvent.change(searchInput, { target: { value: 'Engine Oil' } });

    // Check that search term is updated
    expect(searchInput).toHaveValue('Engine Oil');
  });
});