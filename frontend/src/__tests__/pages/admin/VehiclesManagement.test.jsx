import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VehiclesManagementPage from '../../../pages/admin/VehiclesManagement';
import { useAuth } from '../../../contexts/AuthContext';
import * as vehicleService from '../../../services/vehicleService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
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

describe('VehiclesManagementPage', () => {
  const mockUser = { id: '123', name: 'Admin User', role: 'admin' };
  const mockAlert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'admin' });
    // Mock window.alert
    window.alert = mockAlert;
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <VehiclesManagementPage />
      </BrowserRouter>
    );

    // Check for the loading spinner element
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders vehicles when data is available', async () => {
    // Mock vehicle service response
    vehicleService.getAllVehicles.mockResolvedValue([
      {
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'VIN123',
        registrationNumber: 'ABC123',
        mileage: '15000'
      },
      {
        id: '2',
        make: 'Honda',
        model: 'Civic',
        year: 2019,
        vin: 'VIN456',
        registrationNumber: 'XYZ789',
        mileage: '25000'
      }
    ]);

    render(
      <BrowserRouter>
        <VehiclesManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that vehicles are displayed
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('2019')).toBeInTheDocument();
    expect(screen.getByText('Reg: ABC123')).toBeInTheDocument();
    expect(screen.getByText('Reg: XYZ789')).toBeInTheDocument();
  });

  test('renders empty state when no vehicles are found', async () => {
    // Mock vehicle service response with empty data
    vehicleService.getAllVehicles.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <VehiclesManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No vehicles found')).toBeInTheDocument();
  });

  test('opens edit vehicle modal when edit button is clicked', async () => {
    // Mock vehicle service response with data
    vehicleService.getAllVehicles.mockResolvedValue([
      {
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'VIN123',
        registrationNumber: 'ABC123',
        mileage: '15000'
      }
    ]);

    render(
      <BrowserRouter>
        <VehiclesManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Check that modal is opened with vehicle data
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Vehicle')).toBeInTheDocument();
    expect(screen.getByLabelText('Make')).toHaveValue('Toyota');
    expect(screen.getByLabelText('Model')).toHaveValue('Camry');
  });

  test('updates vehicle when edit form is submitted', async () => {
    // Mock vehicle service response for loading vehicles
    vehicleService.getAllVehicles.mockResolvedValue([
      {
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'VIN123',
        registrationNumber: 'ABC123',
        mileage: '15000'
      }
    ]);
    
    // Mock vehicle service response for updating vehicle
    vehicleService.updateVehicle.mockResolvedValue({
      id: '1',
      make: 'Toyota',
      model: 'Corolla',
      year: '2021',
      vin: 'VIN123',
      registrationNumber: 'ABC123',
      mileage: '15000'
    });

    render(
      <BrowserRouter>
        <VehiclesManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Change model and year fields
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'Corolla' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2021' } });

    // Submit the form
    const submitButton = screen.getByText('Update Vehicle');
    fireEvent.click(submitButton);

    // Wait for vehicle to be updated
    await waitFor(() => {
      expect(vehicleService.updateVehicle).toHaveBeenCalledWith('1', {
        make: 'Toyota',
        model: 'Corolla',
        year: '2021', // Year should be a string as it comes from an input field
        vin: 'VIN123',
        registrationNumber: 'ABC123',
        mileage: '15000' // Mileage should be a string as it comes from an input field
      });
    });

    // Check that modal is closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('deletes vehicle when delete button is clicked', async () => {
    // Mock vehicle service response for loading vehicles
    vehicleService.getAllVehicles.mockResolvedValue([
      {
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: 'VIN123',
        registrationNumber: 'ABC123',
        mileage: '15000'
      }
    ]);
    
    // Mock vehicle service response for deleting vehicle
    vehicleService.deleteVehicle.mockResolvedValue({});

    render(
      <BrowserRouter>
        <VehiclesManagementPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Mock window.confirm to return true
    const mockConfirm = vi.fn(() => true);
    window.confirm = mockConfirm;

    // Click delete button
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    // Wait for vehicle to be deleted
    await waitFor(() => {
      expect(vehicleService.deleteVehicle).toHaveBeenCalledWith('1');
    });

    // Restore window.confirm
    mockConfirm.mockRestore();
  });
});