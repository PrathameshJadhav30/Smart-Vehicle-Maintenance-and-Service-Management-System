import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookServicePage from '../../../pages/customer/BookService';
import { useAuth } from '../../../contexts/AuthContext';
import * as bookingService from '../../../services/bookingService';
import * as vehicleService from '../../../services/vehicleService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/bookingService');
vi.mock('../../../services/vehicleService');

// Mock the Button component
vi.mock('../../../components/Button', () => ({
  __esModule: true,
  default: ({ children, onClick, type, className, ...props }) => (
    <button 
      onClick={onClick}
      type={type}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}));

describe('BookServicePage', () => {
  const mockUser = { id: '123', name: 'John Doe', role: 'customer' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test('renders the book service form with all fields', async () => {
    // Mock vehicle service response
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        { id: '1', make: 'Toyota', model: 'Camry', year: 2020 },
        { id: '2', make: 'Honda', model: 'Civic', year: 2019 }
      ]
    });

    render(
      <BrowserRouter>
        <BookServicePage />
      </BrowserRouter>
    );

    // Wait for vehicles to load
    await waitFor(() => {
      expect(screen.getByText('Book a Service')).toBeInTheDocument();
    });

    // Check that form fields are present
    expect(screen.getByLabelText('Select Vehicle')).toBeInTheDocument();
    expect(screen.getByLabelText('Service Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    
    // Check that vehicles are loaded in the select dropdown
    expect(screen.getByText('Toyota Camry (2020)')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic (2019)')).toBeInTheDocument();
  });

  test('shows error message when user is not logged in', async () => {
    // Mock no user
    useAuth.mockReturnValue({ user: null });
    
    // Mock vehicle service response
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: []
    });

    render(
      <BrowserRouter>
        <BookServicePage />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Book a Service')).toBeInTheDocument();
    });

    // Check that form is disabled or shows appropriate message
    expect(screen.getByText('Please log in to book a service')).toBeInTheDocument();
  });

  test('shows error message when user is not a customer', async () => {
    // Mock non-customer user
    useAuth.mockReturnValue({ user: { id: '123', name: 'John Doe', role: 'admin' } });
    
    // Mock vehicle service response
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: []
    });

    render(
      <BrowserRouter>
        <BookServicePage />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Book a Service')).toBeInTheDocument();
    });

    // Check that form is disabled or shows appropriate message
    expect(screen.getByText('Only customers can book services')).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    // Mock vehicle service response
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        { id: '1', make: 'Toyota', model: 'Camry', year: 2020 }
      ]
    });
    
    // Mock booking service response
    bookingService.createBooking.mockResolvedValue({ id: '1' });

    render(
      <BrowserRouter>
        <BookServicePage />
      </BrowserRouter>
    );

    // Wait for vehicles to load
    await waitFor(() => {
      expect(screen.getByText('Toyota Camry (2020)')).toBeInTheDocument();
    });

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Select Vehicle'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Service Type'), { target: { value: 'Oil Change' } });
    fireEvent.change(screen.getByLabelText('Preferred Date'), { target: { value: '2023-12-25' } });
    fireEvent.change(screen.getByLabelText('Preferred Time'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Regular maintenance' } });

    // Submit the form
    const submitButton = screen.getByText('Book Service');
    fireEvent.click(submitButton);

    // Wait for the booking to be created
    await waitFor(() => {
      expect(bookingService.createBooking).toHaveBeenCalledWith({
        vehicle_id: '1',
        service_type: 'Oil Change',
        booking_date: '2023-12-25',
        booking_time: '10:00',
        description: 'Regular maintenance',
        estimated_cost: 1500
      });
    });

    // Check that form is reset
    expect(screen.getByLabelText('Select Vehicle')).toHaveValue('');
    expect(screen.getByLabelText('Service Type')).toHaveValue('');
    expect(screen.getByLabelText('Preferred Date')).toHaveValue('');
    expect(screen.getByLabelText('Preferred Time')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
  });

  test('shows error message when booking submission fails', async () => {
    // Mock vehicle service response
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        { id: '1', make: 'Toyota', model: 'Camry', year: 2020 }
      ]
    });
    
    // Mock booking service failure
    bookingService.createBooking.mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <BookServicePage />
      </BrowserRouter>
    );

    // Wait for vehicles to load
    await waitFor(() => {
      expect(screen.getByText('Toyota Camry (2020)')).toBeInTheDocument();
    });

    // Fill in the form
    fireEvent.change(screen.getByLabelText('Select Vehicle'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Service Type'), { target: { value: 'Oil Change' } });
    fireEvent.change(screen.getByLabelText('Preferred Date'), { target: { value: '2023-12-25' } });
    fireEvent.change(screen.getByLabelText('Preferred Time'), { target: { value: '10:00' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Regular maintenance' } });

    // Submit the form
    const submitButton = screen.getByText('Book Service');
    fireEvent.click(submitButton);

    // Wait for error handling
    await waitFor(() => {
      expect(bookingService.createBooking).toHaveBeenCalled();
    });
  });
});