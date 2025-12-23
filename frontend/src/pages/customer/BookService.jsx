import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import vehicleService from '../../services/vehicleService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';

const BookServicePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    description: ''
  });
  const [serviceTypes] = useState([
    'Oil Change',
    'Brake Inspection',
    'Engine Tune-up',
    'Tire Rotation',
    'Battery Check',
    'AC Service',
    'General Maintenance'
  ]);
  const serviceTypeCosts = {
    'Oil Change': 1500,
    'Brake Inspection': 800,
    'Engine Tune-up': 3500,
    'Tire Rotation': 1200,
    'Battery Check': 600,
    'AC Service': 2500,
    'General Maintenance': 2000
  };
  
  // State for booking confirmation modal
  const [bookingConfirmation, setBookingConfirmation] = useState({ isOpen: false, bookingData: null });
  const [processingBooking, setProcessingBooking] = useState(false);
  
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      // Don't try to load vehicles if user is not logged in
      if (!user || !user.id) {
        setVehicles([]);
        return;
      }
      const data = await vehicleService.getVehiclesByUserId(user.id);
      // Extract vehicles array from response
      setVehicles(Array.isArray(data) ? data : (data.vehicles || []));
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated and has customer role
    if (!user) {
      showToast.error('You must be logged in to book a service.');
      return;
    }
    
    if (user.role !== 'customer') {
      showToast.error('Only customers can book services. Please log in with a customer account.');
      return;
    }
    
    // Get estimated cost based on service type
    const estimatedCost = serviceTypeCosts[formData.serviceType] || 0;
    
    // Prepare the data in the correct format that matches the backend API
    // Note: customer_id will be taken from the JWT token on the backend, not from the request body
    const bookingData = {
      vehicle_id: formData.vehicleId,
      service_type: formData.serviceType,
      booking_date: formData.preferredDate,
      booking_time: formData.preferredTime,
      description: formData.description,
      estimated_cost: estimatedCost
    };
    
    // Show confirmation modal before creating booking
    setBookingConfirmation({ isOpen: true, bookingData });
  };
  
  const confirmBooking = async () => {
    const bookingData = bookingConfirmation.bookingData;
    
    try {
      setProcessingBooking(true);
      
      await bookingService.createBooking(bookingData);
      
      // Reset form
      setFormData({
        vehicleId: '',
        serviceType: '',
        preferredDate: '',
        preferredTime: '',
        description: ''
      });
      
      showToast.success('Service booking created successfully! Redirecting to dashboard...');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Response data:', error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        showToast.error('Access denied. You do not have permission to create bookings. Please ensure you are logged in as a customer.');
      } else if (error.response?.status === 401) {
        showToast.error('Authentication required. Please log in to create a booking.');
      } else if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        // Log each error individually for better visibility
        error.response.data.errors.forEach((err, index) => {
          console.error(`Validation error ${index + 1}:`, JSON.stringify(err, null, 2));
        });
        // Show specific error messages in the toast
        const errorMessages = error.response.data.errors.map(err => err.message || 'Unknown error').join(', ');
        showToast.error(`Failed to create booking: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        showToast.error(`Failed to create booking: ${error.response.data.message}`);
      } else {
        showToast.error('Failed to create booking. Please try again.');
      }
    } finally {
      // Close the confirmation modal
      setBookingConfirmation({ isOpen: false, bookingData: null });
      setProcessingBooking(false);
    }
  };
  
  const cancelBooking = () => {
    setBookingConfirmation({ isOpen: false, bookingData: null });
  };

  // Function to get vehicle icon based on make
  const getVehicleIcon = (make) => {
    const makeLower = (make || '').toLowerCase();
    
    if (makeLower.includes('toyota')) {
      return (
        <div className="bg-blue-100 rounded-xl p-2.5">
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 3A2.5 2.5 0 0 0 3 5.5v1A2.5 2.5 0 0 0 5.5 9h13A2.5 2.5 0 0 0 21 6.5v-1A2.5 2.5 0 0 0 18.5 3h-13Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 9V5M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 9V5" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('honda')) {
      return (
        <div className="bg-red-100 rounded-xl p-2.5">
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 3A2.5 2.5 0 0 0 3 5.5v1A2.5 2.5 0 0 0 5.5 9h13A2.5 2.5 0 0 0 21 6.5v-1A2.5 2.5 0 0 0 18.5 3h-13Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 9V5M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 9V5" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('ford')) {
      return (
        <div className="bg-indigo-100 rounded-xl p-2.5">
          <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 3A2.5 2.5 0 0 0 3 5.5v1A2.5 2.5 0 0 0 5.5 9h13A2.5 2.5 0 0 0 21 6.5v-1A2.5 2.5 0 0 0 18.5 3h-13Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 9V5M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 9V5" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('bmw')) {
      return (
        <div className="bg-gray-200 rounded-xl p-2.5">
          <svg className="h-5 w-5 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 3A2.5 2.5 0 0 0 3 5.5v1A2.5 2.5 0 0 0 5.5 9h13A2.5 2.5 0 0 0 21 6.5v-1A2.5 2.5 0 0 0 18.5 3h-13Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 9V5M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 9V5" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('audi')) {
      return (
        <div className="bg-gray-200 rounded-xl p-2.5">
          <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 3A2.5 2.5 0 0 0 3 5.5v1A2.5 2.5 0 0 0 5.5 9h13A2.5 2.5 0 0 0 21 6.5v-1A2.5 2.5 0 0 0 18.5 3h-13Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 9V5M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 9V5" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('mercedes') || makeLower.includes('benz')) {
      return (
        <div className="bg-gray-200 rounded-xl p-2.5">
          <svg className="h-5 w-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 3A2.5 2.5 0 0 0 3 5.5v1A2.5 2.5 0 0 0 5.5 9h13A2.5 2.5 0 0 0 21 6.5v-1A2.5 2.5 0 0 0 18.5 3h-13Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 9V5M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 9V5" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('nexa') || makeLower.includes('maruti')) {
      return (
        <div className="bg-green-100 rounded-xl p-2.5">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 3A2.5 2.5 0 0 0 3 5.5v1A2.5 2.5 0 0 0 5.5 9h13A2.5 2.5 0 0 0 21 6.5v-1A2.5 2.5 0 0 0 18.5 3h-13Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 9V5M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 9V5" />
          </svg>
        </div>
      );
    } else {
      // Default car icon
      return (
        <div className="bg-gray-100 rounded-xl p-2.5">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 3A2.5 2.5 0 0 0 3 5.5v1A2.5 2.5 0 0 0 5.5 9h13A2.5 2.5 0 0 0 21 6.5v-1A2.5 2.5 0 0 0 18.5 3h-13Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 9V5M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 9V5" />
          </svg>
        </div>
      );
    }
  };

  // Function to get service icon based on service type
  const getServiceIcon = (serviceType) => {
    const serviceLower = (serviceType || '').toLowerCase();
    
    if (serviceLower.includes('oil')) {
      return (
        <div className="flex items-center w-full">
          <div className="bg-emerald-100 rounded-xl p-2.5 mr-3">
            <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
            </svg>
          </div>
          <span className="text-gray-800 font-medium">{serviceType}</span>
        </div>
      );
    } else if (serviceLower.includes('brake')) {
      return (
        <div className="flex items-center w-full">
          <div className="bg-red-100 rounded-xl p-2.5 mr-3">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="text-gray-800 font-medium">{serviceType}</span>
        </div>
      );
    } else if (serviceLower.includes('tire')) {
      return (
        <div className="flex items-center w-full">
          <div className="bg-amber-100 rounded-xl p-2.5 mr-3">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <span className="text-gray-800 font-medium">{serviceType}</span>
        </div>
      );
    } else if (serviceLower.includes('engine')) {
      return (
        <div className="flex items-center w-full">
          <div className="bg-blue-100 rounded-xl p-2.5 mr-3">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-gray-800 font-medium">{serviceType}</span>
        </div>
      );
    } else if (serviceLower.includes('battery')) {
      return (
        <div className="flex items-center w-full">
          <div className="bg-gray-100 rounded-xl p-2.5 mr-3">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m10 6l6-6m-6-6l6 6" />
            </svg>
          </div>
          <span className="text-gray-800 font-medium">{serviceType}</span>
        </div>
      );
    } else if (serviceLower.includes('ac') || serviceLower.includes('air')) {
      return (
        <div className="flex items-center w-full">
          <div className="bg-cyan-100 rounded-xl p-2.5 mr-3">
            <svg className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
            </svg>
          </div>
          <span className="text-gray-800 font-medium">{serviceType}</span>
        </div>
      );
    } else if (serviceLower.includes('maintenance')) {
      return (
        <div className="flex items-center w-full">
          <div className="bg-indigo-100 rounded-xl p-2.5 mr-3">
            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-gray-800 font-medium">{serviceType}</span>
        </div>
      );
    } else {
      // Default service icon
      return (
        <div className="flex items-center w-full">
          <div className="bg-gray-100 rounded-xl p-2.5 mr-3">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <span className="text-gray-800 font-medium">{serviceType}</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 sm:py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg mb-5 sm:mb-6 mx-auto">
            <svg className="h-7 w-7 sm:h-8 sm:w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 sm:mb-4">Service Booking</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Schedule your vehicle service appointment in minutes. Our team will confirm your booking shortly.
          </p>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* Form Section - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 p-5 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-10">
                {/* Vehicle Selection Card */}
                <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-start mb-4 sm:mb-5">
                    <div className="flex-shrink-0 mt-0.5 mr-3 sm:mr-4">
                      <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-100">
                        <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">My Vehicle</h2>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">Select the vehicle you want to service</p>
                    </div>
                  </div>
                  
                  <div className="mt-5 sm:mt-6">
                    <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle
                    </label>
                    <select
                      id="vehicleId"
                      name="vehicleId"
                      value={formData.vehicleId}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white text-gray-900 text-base shadow-sm"
                      required
                    >
                      <option value="">Choose a vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.registrationNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Service Type Card */}
                <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-start mb-4 sm:mb-5">
                    <div className="flex-shrink-0 mt-0.5 mr-3 sm:mr-4">
                      <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-100">
                        <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Service Type</h2>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">Choose the type of service you need</p>
                    </div>
                  </div>
                  
                  <div className="mt-5 sm:mt-6">
                    <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                      Service
                    </label>
                    <select
                      id="serviceType"
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-white text-gray-900 text-base shadow-sm"
                      required
                    >
                      <option value="">Select service type</option>
                      {serviceTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Appointment Card */}
                <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-start mb-4 sm:mb-5">
                    <div className="flex-shrink-0 mt-0.5 mr-3 sm:mr-4">
                      <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-100">
                        <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Appointment</h2>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">Select your preferred date and time</p>
                    </div>
                  </div>
                  
                  <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="preferredDate"
                          id="preferredDate"
                          value={formData.preferredDate}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-900 text-base shadow-sm"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          name="preferredTime"
                          id="preferredTime"
                          value={formData.preferredTime}
                          onChange={handleInputChange}
                          className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-900 text-base shadow-sm"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description Card */}
                <div className="border border-gray-200 rounded-2xl p-5 sm:p-6 hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-start mb-4 sm:mb-5">
                    <div className="flex-shrink-0 mt-0.5 mr-3 sm:mr-4">
                      <div className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-100">
                        <svg className="h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Additional Details</h2>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">Any specific issues or requests?</p>
                    </div>
                  </div>
                  
                  <div className="mt-5 sm:mt-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-gray-900 text-base shadow-sm"
                      placeholder="Describe any specific issues with your vehicle or special requests..."
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2 sm:pt-4">
                  <Button 
                    type="submit" 
                    className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    Confirm Booking
                  </Button>
                </div>
              </form>
            </div>

            {/* Sidebar - Takes 1 column on large screens */}
            <div className="bg-gradient-to-b from-blue-50 to-indigo-50 p-5 sm:p-6 border-t lg:border-t-0 lg:border-l border-gray-200 lg:sticky lg:top-8">
              <div className="space-y-6 sm:space-y-7">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Booking Information</h3>
                
                {/* Service Info */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="ml-3 font-semibold text-gray-900">What to Expect</h4>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">Confirmation within 24 hours</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">Free pickup and delivery available</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">Loaner vehicles for major repairs</span>
                    </li>
                  </ul>
                </div>
                
                {/* Contact Info */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h4 className="ml-3 font-semibold">Need Help?</h4>
                  </div>
                  <p className="text-sm mb-4 leading-relaxed">
                    Our service advisors are available 24/7 to assist you with your booking.
                  </p>
                  <div className="flex items-center text-sm font-medium">
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>+91 9665484038</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      <ConfirmationModal
        isOpen={bookingConfirmation.isOpen}
        onClose={cancelBooking}
        onConfirm={confirmBooking}
        title="Confirm Service Booking"
        message={`Are you sure you want to book a ${bookingConfirmation.bookingData?.service_type || ''} service for your vehicle on ${bookingConfirmation.bookingData?.booking_date || ''} at ${bookingConfirmation.bookingData?.booking_time || ''}?`}
        confirmText="Confirm Booking"
        cancelText="Cancel"
        processing={processingBooking}
        confirmVariant="danger"
        cancelVariant="secondary"
      />
    </div>
  );
};

export default BookServicePage;