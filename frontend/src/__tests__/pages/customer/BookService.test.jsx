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

// Mock window.alert
const mockAlert = vi.fn();
window.alert = mockAlert;

describe('BookServicePage', () => {
  const mockUser = { id: '123', name: 'John Doe', role: 'customer' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAlert.mockClear();
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
      expect(screen.getByRole('heading', { name: /Book Service/i })).toBeInTheDocument();
    }, { timeout: 5000 });

    // Check that form fields are present using more specific selectors
    expect(screen.getByRole('combobox', { name: /Select Vehicle/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Service Type/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Preferred Time/i)).toBeInTheDocument();
    
    // For description, we need to use the placeholder since there's no direct label
    expect(screen.getByPlaceholderText(/Describe any specific issues or requirements/i)).toBeInTheDocument();
    
    // Check that vehicles are loaded in the select dropdown
    expect(screen.getByText('Toyota Camry (2020)')).toBeInTheDocument();
    expect(screen.getByText('Honda Civic (2019)')).toBeInTheDocument();
  });

  test('shows error message when user is not logged in', async () => {
    // Mock no user
    useAuth.mockReturnValue({ user: null });
    
    // Mock vehicle service response
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        { id: '1', make: 'Toyota', model: 'Camry', year: 2020 }
      ]
    });

    render(
      <BrowserRouter>
        <BookServicePage />
      </BrowserRouter>
    );

    // Wait a bit for component to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Find the form and trigger submit directly
    const form = document.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    // Wait for alert to be called
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    // Check that alert was called with the correct message
    expect(mockAlert).toHaveBeenCalledWith('You must be logged in to book a service.');
  });

  test('shows error message when user is not a customer', async () => {
    // Mock non-customer user
    useAuth.mockReturnValue({ user: { id: '123', name: 'John Doe', role: 'admin' } });
    
    // Mock vehicle service response
    vehicleService.getVehiclesByUserId.mockResolvedValue({
      vehicles: [
        { id: '1', make: 'Toyota', model: 'Camry', year: 2020 }
      ]
    });

    render(
      <BrowserRouter>
        <BookServicePage />
      </BrowserRouter>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Book Service/i })).toBeInTheDocument();
    }, { timeout: 5000 });

    // Fill in the form
    fireEvent.change(screen.getByRole('combobox', { name: /Select Vehicle/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Service Type/i }), { target: { value: 'Oil Change' } });
    fireEvent.change(screen.getByLabelText(/Preferred Date/i), { target: { value: '2023-12-25' } });
    fireEvent.change(screen.getByLabelText(/Preferred Time/i), { target: { value: '10:00' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe any specific issues or requirements/i), { target: { value: 'Regular maintenance' } });

    // Submit the form using role and name
    const submitButton = screen.getByRole('button', { name: /Book Service/i });
    fireEvent.click(submitButton);

    // Wait for alert to be called
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    // Check that alert was called with the correct message
    expect(mockAlert).toHaveBeenCalledWith('Only customers can book services. Please log in with a customer account.');
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
    fireEvent.change(screen.getByRole('combobox', { name: /Select Vehicle/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Service Type/i }), { target: { value: 'Oil Change' } });
    fireEvent.change(screen.getByLabelText(/Preferred Date/i), { target: { value: '2023-12-25' } });
    fireEvent.change(screen.getByLabelText(/Preferred Time/i), { target: { value: '10:00' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe any specific issues or requirements/i), { target: { value: 'Regular maintenance' } });

    // Submit the form using role and name
    const submitButton = screen.getByRole('button', { name: /Book Service/i });
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
    }, { timeout: 5000 });

    // Check that alert was called with success message
    expect(mockAlert).toHaveBeenCalledWith('Service booking created successfully!');
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
    fireEvent.change(screen.getByRole('combobox', { name: /Select Vehicle/i }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Service Type/i }), { target: { value: 'Oil Change' } });
    fireEvent.change(screen.getByLabelText(/Preferred Date/i), { target: { value: '2023-12-25' } });
    fireEvent.change(screen.getByLabelText(/Preferred Time/i), { target: { value: '10:00' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe any specific issues or requirements/i), { target: { value: 'Regular maintenance' } });

    // Submit the form using role and name
    const submitButton = screen.getByRole('button', { name: /Book Service/i });
    fireEvent.click(submitButton);

    // Wait for error handling
    await waitFor(() => {
      expect(bookingService.createBooking).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    // Check that alert was called with error message
    expect(mockAlert).toHaveBeenCalledWith('Failed to create booking. Please try again.');
  });
});