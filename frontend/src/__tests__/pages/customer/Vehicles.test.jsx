import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VehiclesPage from '../../../pages/customer/Vehicles';
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

describe('VehiclesPage', () => {
  const mockUser = { id: '123', name: 'John Doe', role: 'customer' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test('renders loading spinner initially', () => {
    render(
      <BrowserRouter>
        <VehiclesPage />
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders empty state when no vehicles are found', async () => {
    // Mock vehicle service response with empty data
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [],
      pagination: {
        totalPages: 1,
        totalItems: 0
      }
    });

    render(
      <BrowserRouter>
        <VehiclesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No vehicles found')).toBeInTheDocument();
    expect(screen.getByText('Add Vehicle')).toBeInTheDocument();
  });

  test('renders vehicles when data is available', async () => {
    // Mock vehicle service response with data
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        {
          id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          registration_number: 'ABC123',
          mileage: 15000
        },
        {
          id: '2',
          make: 'Honda',
          model: 'Civic',
          year: 2019,
          registration_number: 'XYZ789',
          mileage: 20000
        }
      ],
      pagination: {
        totalPages: 1,
        totalItems: 2
      }
    });

    render(
      <BrowserRouter>
        <VehiclesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Check that vehicles are displayed
    expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic')).toBeInTheDocument();
    
    // Check that vehicle details are displayed
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('15,000 miles')).toBeInTheDocument();
  });

  test('opens add vehicle modal when add button is clicked', async () => {
    // Mock vehicle service response with empty data
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [],
      pagination: {
        totalPages: 1,
        totalItems: 0
      }
    });

    render(
      <BrowserRouter>
        <VehiclesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click add vehicle button
    const addButton = screen.getByText('Add Vehicle');
    fireEvent.click(addButton);

    // Check that modal is opened
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByText('Add Vehicle')).toBeInTheDocument();
  });

  test('creates new vehicle when add form is submitted', async () => {
    // Mock vehicle service response for loading vehicles
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [],
      pagination: {
        totalPages: 1,
        totalItems: 0
      }
    });
    
    // Mock vehicle service response for creating vehicle
    vehicleService.createVehicle.mockResolvedValue({
      id: '1',
      make: 'Ford',
      model: 'Focus',
      year: 2021,
      registration_number: 'DEF456',
      mileage: 5000
    });

    render(
      <BrowserRouter>
        <VehiclesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Open add vehicle modal
    const addButton = screen.getByText('Add Vehicle');
    fireEvent.click(addButton);

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Make'), { target: { value: 'Ford' } });
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'Focus' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2021' } });
    fireEvent.change(screen.getByLabelText('Registration Number'), { target: { value: 'DEF456' } });
    fireEvent.change(screen.getByLabelText('Current Mileage'), { target: { value: '5000' } });

    // Submit the form
    const submitButton = screen.getByText('Add Vehicle');
    fireEvent.click(submitButton);

    // Wait for vehicle to be created
    await waitFor(() => {
      expect(vehicleService.createVehicle).toHaveBeenCalledWith({
        make: 'Ford',
        model: 'Focus',
        year: '2021',
        vin: '',
        registration_number: 'DEF456',
        mileage: '5000',
        userId: '123'
      });
    });

    // Check that modal is closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('opens edit vehicle modal when edit button is clicked', async () => {
    // Mock vehicle service response with data
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        {
          id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          registration_number: 'ABC123',
          mileage: 15000
        }
      ],
      pagination: {
        totalPages: 1,
        totalItems: 1
      }
    });

    render(
      <BrowserRouter>
        <VehiclesPage />
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
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        {
          id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          registration_number: 'ABC123',
          mileage: 15000
        }
      ],
      pagination: {
        totalPages: 1,
        totalItems: 1
      }
    });
    
    // Mock vehicle service response for updating vehicle
    vehicleService.updateVehicle.mockResolvedValue({
      id: '1',
      make: 'Toyota',
      model: 'Corolla',
      year: 2021,
      registration_number: 'ABC123',
      mileage: 16000
    });

    render(
      <BrowserRouter>
        <VehiclesPage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    // Click edit button
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Change model field
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'Corolla' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2021' } });
    fireEvent.change(screen.getByLabelText('Current Mileage'), { target: { value: '16000' } });

    // Submit the form
    const submitButton = screen.getByText('Update Vehicle');
    fireEvent.click(submitButton);

    // Wait for vehicle to be updated
    await waitFor(() => {
      expect(vehicleService.updateVehicle).toHaveBeenCalledWith('1', {
        make: 'Toyota',
        model: 'Corolla',
        year: '2021',
        vin: '',
        registration_number: 'ABC123',
        mileage: '16000'
      });
    });

    // Check that modal is closed
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  test('deletes vehicle when delete button is clicked', async () => {
    // Mock vehicle service response for loading vehicles
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        {
          id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          registration_number: 'ABC123',
          mileage: 15000
        }
      ],
      pagination: {
        totalPages: 1,
        totalItems: 1
      }
    });
    
    // Mock vehicle service response for deleting vehicle
    vehicleService.deleteVehicle.mockResolvedValue({});

    render(
      <BrowserRouter>
        <VehiclesPage />
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

    // Wait for vehicle to be deleted
    await waitFor(() => {
      expect(vehicleService.deleteVehicle).toHaveBeenCalledWith('1');
    });

    // Restore window.confirm
    mockConfirm.mockRestore();
  });
});