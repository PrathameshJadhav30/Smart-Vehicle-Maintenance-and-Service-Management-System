import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import bookingService from '../../services/bookingService';
import vehicleService from '../../services/vehicleService';
import Button from '../../components/Button';

const BookServicePage = () => {
  const { user } = useAuth();
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
    try {
      // Debugging: Log user data
      console.log('Current user data:', user);
      console.log('User role:', user?.role);
      
      // Check if user is authenticated and has customer role
      if (!user) {
        alert('You must be logged in to book a service.');
        return;
      }
      
      if (user.role !== 'customer') {
        alert('Only customers can book services. Please log in with a customer account.');
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
      
      await bookingService.createBooking(bookingData);
      
      // Reset form
      setFormData({
        vehicleId: '',
        serviceType: '',
        preferredDate: '',
        preferredTime: '',
        description: ''
      });
      
      alert('Service booking created successfully!');
    } catch (error) {
      console.error('Error creating booking:', error);
      console.error('Response data:', error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        alert('Access denied. You do not have permission to create bookings. Please ensure you are logged in as a customer.');
      } else if (error.response?.status === 401) {
        alert('Authentication required. Please log in to create a booking.');
      } else if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        // Log each error individually for better visibility
        error.response.data.errors.forEach((err, index) => {
          console.error(`Validation error ${index + 1}:`, JSON.stringify(err, null, 2));
        });
        // Show specific error messages in the alert
        const errorMessages = error.response.data.errors.map(err => err.message || 'Unknown error').join('\n');
        alert(`Failed to create booking. Validation errors:\n${errorMessages}`);
      } else if (error.response?.data?.message) {
        alert(`Failed to create booking: ${error.response.data.message}`);
      } else {
        alert('Failed to create booking. Please try again.');
      }
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 mb-4 shadow-md">
            <svg className="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Service</h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">Schedule a service appointment for your vehicle. Our team will review your booking and confirm within 24 hours.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vehicle Selection */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-5">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <h2 className="ml-3 text-xl font-bold text-gray-900">Vehicle Information</h2>
                  </div>
                  <div>
                    <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Vehicle
                    </label>
                    <div className="relative">
                      <select
                        id="vehicleId"
                        name="vehicleId"
                        value={formData.vehicleId}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 appearance-none bg-white"
                        required
                      >
                        <option value="">Choose a vehicle</option>
                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Type */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-5">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                      <svg className="h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h2 className="ml-3 text-xl font-bold text-gray-900">Service Details</h2>
                  </div>
                  <div>
                    <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type
                    </label>
                    <div className="relative">
                      <select
                        id="serviceType"
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleInputChange}
                        className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 appearance-none bg-white"
                        required
                      >
                        <option value="">Select service type</option>
                        {serviceTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-5">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="ml-3 text-xl font-bold text-gray-900">Appointment Schedule</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Date
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          name="preferredDate"
                          id="preferredDate"
                          value={formData.preferredDate}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Time
                      </label>
                      <div className="relative">
                        <input
                          type="time"
                          name="preferredTime"
                          id="preferredTime"
                          value={formData.preferredTime}
                          onChange={handleInputChange}
                          className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                          required
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center mb-5">
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <svg className="h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                    <h2 className="ml-3 text-xl font-bold text-gray-900">Description</h2>
                  </div>
                  <div className="relative">
                    <textarea
                      id="description"
                      name="description"
                      rows={5}
                      value={formData.description}
                      onChange={handleInputChange}
                      className="block w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      placeholder="Describe any specific issues or requirements..."
                    />
                    <div className="absolute top-3 right-3 text-gray-400">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-5">
                  <Button 
                    type="submit" 
                    className="w-full py-3 px-4 rounded-xl shadow-md text-base font-bold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    Book Service
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Booking Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100 mb-6 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center mb-5">
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-xl font-bold text-gray-900">Booking Tips</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100">
                      <svg className="h-2.5 w-2.5 text-blue-600" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700 text-sm">Select a date and time that works best for you</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100">
                      <svg className="h-2.5 w-2.5 text-blue-600" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700 text-sm">Provide detailed information about any issues you're experiencing</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100">
                      <svg className="h-2.5 w-2.5 text-blue-600" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700 text-sm">You'll receive a confirmation email once your booking is processed</p>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100">
                      <svg className="h-2.5 w-2.5 text-blue-600" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" />
                      </svg>
                    </div>
                  </div>
                  <p className="ml-3 text-gray-700 text-sm">Contact us if you need to reschedule or cancel your appointment</p>
                </div>
              </div>
              
              <div className="mt-5 pt-5 border-t border-blue-100">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-blue-700">
                      Our team will review your booking and confirm within 24 hours. For urgent matters, please call our service center directly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Service Types Preview */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-center mb-5">
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center">
                  <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="ml-3 text-xl font-bold text-gray-900">Available Services</h3>
              </div>
              <div className="space-y-3">
                {serviceTypes.map((type, index) => (
                  <div key={index} className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200">
                    {getServiceIcon(type)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookServicePage;