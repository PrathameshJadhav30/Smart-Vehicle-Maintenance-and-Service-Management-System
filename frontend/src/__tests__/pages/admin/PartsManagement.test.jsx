import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PartsManagementPage from '../../../pages/admin/PartsManagement';
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
  default: ({ children, onClick, className, type = 'button', ...props }) => (
    <button 
      onClick={onClick}
      className={className}
      type={type}
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

describe('PartsManagementPage', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
    // Mock window.alert
    window.alert = vi.fn();
  });

  test('renders loading spinner initially', async () => {
    // Don't mock the service calls to simulate loading state
    
    await act(async () => {
      render(
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      );
    });

    // Check for the loading spinner element (PartsManagement uses a custom spinner, not the LoadingSpinner component)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders parts when data is available', async () => {
    // Mock parts service response - the service returns { parts: [...] }
    partsService.getAllParts.mockResolvedValue({
      parts: [
        {
          id: '1',
          name: 'Engine Oil',
          part_number: 'EO-123',
          quantity: 50,
          price: 25.00,
          supplier: 'Auto Parts Co.'
        },
        {
          id: '2',
          name: 'Brake Pads',
          part_number: 'BP-456',
          quantity: 30,
          price: 45.00,
          supplier: 'Brake Specialists'
        }
      ]
    });

    // Mock suppliers service response - the service returns { suppliers: [...] }
    partsService.getAllSuppliers.mockResolvedValue({
      suppliers: []
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that parts are displayed
    expect(screen.getByText('Engine Oil')).toBeInTheDocument();
    expect(screen.getByText('Brake Pads')).toBeInTheDocument();
    expect(screen.getByText('EO-123')).toBeInTheDocument();
    expect(screen.getByText('BP-456')).toBeInTheDocument();
    // Look for the quantity with units
    expect(screen.getByText(/50\s+units/)).toBeInTheDocument();
    expect(screen.getByText(/30\s+units/)).toBeInTheDocument();
  });

  test('renders empty state when no parts are found', async () => {
    // Mock parts service response with empty data - the service returns { parts: [...] }
    partsService.getAllParts.mockResolvedValue({
      parts: []
    });
    
    // Mock suppliers service response - the service returns { suppliers: [...] }
    partsService.getAllSuppliers.mockResolvedValue({
      suppliers: []
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No parts found')).toBeInTheDocument();
  });

  test('opens add part modal when add button is clicked', async () => {
    // Mock parts service response with empty data - the service returns { parts: [...] }
    partsService.getAllParts.mockResolvedValue({
      parts: []
    });
    
    // Mock suppliers service response - the service returns { suppliers: [...] }
    partsService.getAllSuppliers.mockResolvedValue({
      suppliers: []
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click add part button (use specific selector to avoid ambiguity)
    // Get all buttons with text "Add Part" and select the first one (header button)
    const addButtons = screen.getAllByRole('button', { name: 'Add Part' });
    fireEvent.click(addButtons[0]);

    // Check that modal is opened
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Add New Part')).toBeInTheDocument();
  });

  // test('creates new part when form is submitted', async () => {
  //   // Mock parts service response for loading parts - the service returns { parts: [...] }
  //   partsService.getAllParts.mockResolvedValue({
  //     parts: []
  //   });
  //   
  //   // Mock suppliers service response - the service returns { suppliers: [...] }
  //   partsService.getAllSuppliers.mockResolvedValue({
  //     suppliers: []
  //   });
  //   
  //   // Mock parts service response for creating part
  //   partsService.createPart.mockResolvedValue({
  //     id: '1',
  //     name: 'New Part',
  //     part_number: 'NP-789',
  //     quantity: 25,
  //     price: 30.00,
  //     supplier: 'New Supplier'
  //   });
  //
  //   await act(async () => {
  //     render(
  //       <BrowserRouter>
  //         <PartsManagementPage />
  //       </BrowserRouter>
  //     );
  //   });
  //
  //   // Wait for loading to complete
  //   await waitFor(() => {
  //     expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  //   });
  //
  //   // Open add part modal
  //   // Get all buttons with text "Add Part" and select the first one (header button)
  //   const addButtons = screen.getAllByRole('button', { name: 'Add Part' });
  //   fireEvent.click(addButtons[0]);
  //
  //   // Fill in the form (using the actual label texts from the component)
  //   fireEvent.change(screen.getByLabelText('Part Name'), { target: { value: 'New Part' } });
  //   fireEvent.change(screen.getByLabelText('Part Number'), { target: { value: 'NP-789' } });
  //   fireEvent.change(screen.getByLabelText('Price (₹)'), { target: { value: '30.00' } });
  //   fireEvent.change(screen.getByLabelText('Stock Level'), { target: { value: '25' } });
  //   fireEvent.change(screen.getByLabelText('Minimum Stock Level'), { target: { value: '10' } });
  //
  //   // Submit the form (find the submit button within the modal)
  //   const modal = screen.getByTestId('modal');
  //   const submitButton = within(modal).getByRole('button', { name: /Add Part/i });
  //   fireEvent.click(submitButton);
  //
  //   // Wait for modal to close (which indicates successful form submission)
  //   await waitFor(() => {
  //     expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  //   }, { timeout: 5000 });
  //
  //   // Check that the service was called
  //   expect(partsService.createPart).toHaveBeenCalled();
  // });

  test('opens edit part modal when edit button is clicked', async () => {
    // Mock parts service response with data - the service returns { parts: [...] }
    partsService.getAllParts.mockResolvedValue({
      parts: [
        {
          id: '1',
          name: 'Engine Oil',
          part_number: 'EO-123',
          quantity: 50,
          price: 25.00,
          supplier: 'Auto Parts Co.'
        }
      ]
    });
    
    // Mock suppliers service response - the service returns { suppliers: [...] }
    partsService.getAllSuppliers.mockResolvedValue({
      suppliers: []
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button (use specific selector to avoid ambiguity)
    const editButton = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(editButton);

    // Check that modal is opened with part data
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Part')).toBeInTheDocument();
    expect(screen.getByLabelText('Part Name')).toHaveValue('Engine Oil');
    expect(screen.getByLabelText('Part Number')).toHaveValue('EO-123');
  });

  // test('updates part when edit form is submitted', async () => {
  //   // Mock parts service response for loading parts - the service returns { parts: [...] }
  //   partsService.getAllParts.mockResolvedValue({
  //     parts: [
  //       {
  //         id: '1',
  //         name: 'Engine Oil',
  //         part_number: 'EO-123',
  //         quantity: 50,
  //         price: 25.00,
  //         supplier: 'Auto Parts Co.'
  //       }
  //     ]
  //   });
  //   
  //   // Mock suppliers service response - the service returns { suppliers: [...] }
  //   partsService.getAllSuppliers.mockResolvedValue({
  //     suppliers: []
  //   });
  //   
  //   // Mock parts service response for updating part
  //   partsService.updatePart.mockResolvedValue({
  //     id: '1',
  //     name: 'Updated Engine Oil',
  //     part_number: 'EO-123',
  //     quantity: 45,
  //     price: 27.50,
  //     supplier: 'Auto Parts Co.'
  //   });
  //
  //   await act(async () => {
  //     render(
  //       <BrowserRouter>
  //         <PartsManagementPage />
  //       </BrowserRouter>
  //     );
  //   });
  //
  //   // Wait for loading to complete
  //   await waitFor(() => {
  //     expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  //   });
  //
  //   // Click edit button
  //   const editButton = screen.getByRole('button', { name: 'Edit' });
  //   fireEvent.click(editButton);
  //
  //   // Change name, quantity, and price fields
  //   fireEvent.change(screen.getByLabelText('Part Name'), { target: { value: 'Updated Engine Oil' } });
  //   fireEvent.change(screen.getByLabelText('Stock Level'), { target: { value: '45' } });
  //   fireEvent.change(screen.getByLabelText('Price (₹)'), { target: { value: '27.50' } });
  //   fireEvent.change(screen.getByLabelText('Minimum Stock Level'), { target: { value: '10' } });
  //
  //   // Submit the form (find the submit button within the modal)
  //   const modal = screen.getByTestId('modal');
  //   const submitButton = within(modal).getByRole('button', { name: /Update Part/i });
  //   fireEvent.click(submitButton);
  //
  //   // Wait for modal to close (which indicates successful form submission)
  //   await waitFor(() => {
  //     expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  //   }, { timeout: 5000 });
  //
  //   // Check that the service was called
  //   expect(partsService.updatePart).toHaveBeenCalled();
  // });

  test('deletes part when delete button is clicked', async () => {
    // Mock parts service response for loading parts - the service returns { parts: [...] }
    partsService.getAllParts.mockResolvedValue({
      parts: [
        {
          id: '1',
          name: 'Engine Oil',
          part_number: 'EO-123',
          quantity: 50,
          price: 25.00,
          supplier: 'Auto Parts Co.'
        }
      ]
    });
    
    // Mock suppliers service response - the service returns { suppliers: [...] }
    partsService.getAllSuppliers.mockResolvedValue({
      suppliers: []
    });
    
    // Mock parts service response for deleting part
    partsService.deletePart.mockResolvedValue({});

    await act(async () => {
      render(
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      );
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Mock window.confirm to return true
    const mockConfirm = vi.fn(() => true);
    window.confirm = mockConfirm;

    // Click delete button (use specific selector to avoid ambiguity)
    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);

    // Wait for part to be deleted
    await waitFor(() => {
      expect(partsService.deletePart).toHaveBeenCalledWith('1');
    });
  });

  test('searches parts by term', async () => {
    // Mock parts service response - the service returns { parts: [...] }
    partsService.getAllParts.mockResolvedValue({
      parts: [
        {
          id: '1',
          name: 'Engine Oil',
          part_number: 'EO-123',
          quantity: 50,
          price: 25.00,
          supplier: 'Auto Parts Co.'
        }
      ]
    });
    
    // Mock suppliers service response - the service returns { suppliers: [...] }
    partsService.getAllSuppliers.mockResolvedValue({
      suppliers: []
    });

    await act(async () => {
      render(
        <BrowserRouter>
          <PartsManagementPage />
        </BrowserRouter>
      );
    });

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