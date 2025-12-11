import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import vehicleService from '../../services/vehicleService';
import bookingService from '../../services/bookingService';
import invoiceService from '../../services/invoiceService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorDisplay from '../../components/ErrorDisplay';
import { formatBookingDateShort, formatCreatedDateShort } from '../../utils/dateFormatter';
import { formatCurrency } from '../../utils/currencyFormatter';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create promises for all API calls
        const vehiclePromise = vehicleService.getVehiclesByUserId(user.id);
        const bookingPromise = bookingService.getCustomerBookings(user.id);
        const invoicePromise = invoiceService.getCustomerInvoices(user.id);
        
        // Add timeout to each promise
        const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms));
        
        // Execute all promises with timeout
        const [vehiclesResponse, bookingsData, invoicesData] = await Promise.all([
          Promise.race([vehiclePromise, timeout(10000)]),
          Promise.race([bookingPromise, timeout(10000)]),
          Promise.race([invoicePromise, timeout(10000)])
        ]);
        
        // Extract vehicles array from paginated response
        const vehiclesArray = vehiclesResponse.vehicles || vehiclesResponse || [];
        setVehicles(vehiclesArray.slice(0, 3)); // Get only the first 3 for display
        setBookings(bookingsData.slice(0, 3)); // Get only the first 3 for display
        setInvoices(invoicesData.slice(0, 3)); // Get only the first 3 for display
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up periodic polling (every 30 seconds)
    const pollingInterval = setInterval(() => {
      loadData();
    }, 30000);

    // Listen for job card creation events to refresh the dashboard
    const handleJobCardCreated = () => {
      loadData();
    };

    // Listen for job card completion events to refresh the dashboard
    const handleJobCardCompleted = () => {
      loadData();
    };

    // Listen for invoice creation events to refresh the dashboard
    const handleInvoiceCreated = () => {
      loadData();
    };

    window.addEventListener('jobCardCreated', handleJobCardCreated);
    window.addEventListener('jobCardCompleted', handleJobCardCompleted);
    window.addEventListener('invoiceCreated', handleInvoiceCreated);

    // Cleanup event listeners and polling interval on component unmount
    return () => {
      window.removeEventListener('jobCardCreated', handleJobCardCreated);
      window.removeEventListener('jobCardCompleted', handleJobCardCompleted);
      window.removeEventListener('invoiceCreated', handleInvoiceCreated);
      clearInterval(pollingInterval);
    };
  }, [user]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-rose-100 text-rose-800',
      completed: 'bg-emerald-100 text-emerald-800'
    };

    const statusText = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed'
    };

    return (
      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusClasses = {
      paid: 'bg-emerald-100 text-emerald-800',
      unpaid: 'bg-amber-100 text-amber-800',
      overdue: 'bg-rose-100 text-rose-800'
    };

    const statusText = {
      paid: 'Paid',
      unpaid: 'Unpaid',
      overdue: 'Overdue'
    };

    return (
      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  // Function to get vehicle icon based on make
  const getVehicleIcon = (make) => {
    const makeLower = (make || '').toLowerCase();
    
    if (makeLower.includes('toyota')) {
      return (
        <div className="bg-blue-100 rounded-lg p-3">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('honda')) {
      return (
        <div className="bg-red-100 rounded-lg p-3">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('ford')) {
      return (
        <div className="bg-indigo-100 rounded-lg p-3">
          <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('bmw')) {
      return (
        <div className="bg-gray-200 rounded-lg p-3">
          <svg className="h-8 w-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('audi')) {
      return (
        <div className="bg-gray-200 rounded-lg p-3">
          <svg className="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('mercedes') || makeLower.includes('benz')) {
      return (
        <div className="bg-gray-200 rounded-lg p-3">
          <svg className="h-8 w-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('nexa') || makeLower.includes('maruti')) {
      return (
        <div className="bg-green-100 rounded-lg p-3">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    } else {
      // Default car icon
      return (
        <div className="bg-gray-100 rounded-lg p-3">
          <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
  };

  // Function to get booking icon based on service type
  const getBookingIcon = (serviceType) => {
    const serviceLower = (serviceType || '').toLowerCase();
    
    if (serviceLower.includes('oil')) {
      return (
        <div className="bg-emerald-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
          </svg>
        </div>
      );
    } else if (serviceLower.includes('brake')) {
      return (
        <div className="bg-red-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      );
    } else if (serviceLower.includes('tire')) {
      return (
        <div className="bg-amber-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
      );
    } else if (serviceLower.includes('engine')) {
      return (
        <div className="bg-blue-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      );
    } else if (serviceLower.includes('battery')) {
      return (
        <div className="bg-gray-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m10 6l6-6m-6-6l6 6" />
          </svg>
        </div>
      );
    } else {
      // Default service icon
      return (
        <div className="bg-indigo-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
      );
    }
  };

  // Function to get invoice icon
  const getInvoiceIcon = () => {
    return (
      <div className="bg-purple-100 rounded-lg p-2">
        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    );
  };

  const formatDate = (dateObj) => {
    // Handle potential null or undefined dates
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj)) return 'N/A';
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    // Handle potential NaN or invalid amounts
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
      return '₹0.00';
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(numericAmount);
  };

  const retry = () => {
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorDisplay 
          title="Error loading dashboard" 
          message={error} 
          onRetry={retry} 
        />
      </div>
    );
  }

  // Calculate total due with proper error handling
  const calculateTotalDue = () => {
    try {
      const total = invoices.reduce((sum, invoice) => {
        // Try different property names that might contain the amount
        const amount = invoice.grand_total || invoice.totalAmount || invoice.amount || 0;
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return sum + (isNaN(numericAmount) ? 0 : numericAmount);
      }, 0);
      return total;
    } catch (error) {
      console.error('Error calculating total due:', error);
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="mt-2 text-lg text-gray-600">Here's what's happening with your vehicles and services today.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{vehicles.length}</h3>
                <p className="text-sm text-gray-500">Vehicles</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-indigo-100">
                <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{bookings.length}</h3>
                <p className="text-sm text-gray-500">Bookings</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{invoices.length}</h3>
                <p className="text-sm text-gray-500">Invoices</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-amber-100">
                <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(calculateTotalDue())}
                </h3>
                <p className="text-sm text-gray-500">Total Due</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <button 
                    onClick={() => navigate('/customer/vehicles')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-white group"
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Manage Vehicles</span>
                    </div>
                    <svg className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/customer/book-service')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg shadow-sm hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 text-white group"
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Book Service</span>
                    </div>
                    <svg className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/customer/bookings')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 text-white group"
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">My Bookings</span>
                    </div>
                    <svg className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/customer/invoices')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-sm hover:from-purple-600 hover:to-purple-700 transition-all duration-300 text-white group"
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">My Invoices</span>
                    </div>
                    <svg className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/customer/profile')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg shadow-sm hover:from-gray-700 hover:to-gray-800 transition-all duration-300 text-white group"
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">My Profile</span>
                    </div>
                    <svg className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Bookings and Invoices */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Bookings */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                <button 
                  onClick={() => navigate('/customer/bookings')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  View All
                  <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
                      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings yet</h3>
                    <p className="mt-1 text-gray-500">Get started by booking a service for your vehicle.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/customer/book-service')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Book Service
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="divide-y divide-gray-100">
                      {bookings.map((booking) => (
                        <li key={booking.id} className="py-4 hover:bg-gray-50 rounded-lg px-2 transition-colors duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {getBookingIcon(booking.service_type)}
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">
                                  {booking.service_type}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {booking.model || booking.vehicle?.model || 'Unknown Vehicle'}
                                </p>
                                <div className="mt-1 flex items-center text-xs text-gray-400">
                                  <svg className="flex-shrink-0 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  <span>
                                    {formatBookingDateShort(booking.booking_date)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              {getStatusBadge(booking.status)}
                              <p className="mt-1 text-xs text-gray-500">
                                Booked: {formatCreatedDateShort(booking.created_at)}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Invoices */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                <button 
                  onClick={() => navigate('/customer/invoices')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                >
                  View All
                  <svg className="ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {invoices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-purple-100">
                      <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No invoices yet</h3>
                    <p className="mt-1 text-gray-500">Invoices will appear here after your services are completed.</p>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="divide-y divide-gray-100">
                      {invoices.slice(0, 3).map((invoice) => (
                        <li key={invoice.id} className="py-4 hover:bg-gray-50 rounded-lg px-2 transition-colors duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {getInvoiceIcon()}
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium text-gray-900">
                                  Invoice #{String(invoice.id || invoice.invoice_id || '').substring(0, 8)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {(invoice.vehicle?.make || invoice.model || '') + ' ' + (invoice.vehicle?.model || invoice.vin || '') || 'Vehicle Information Not Available'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Due: {formatCreatedDateShort(invoice.dueDate ? new Date(invoice.dueDate) : new Date(invoice.created_at))}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              {getPaymentStatusBadge(invoice.status || invoice.paymentStatus)}
                              <p className="text-lg font-bold text-gray-900 mt-1">
                                {formatCurrency(invoice.grand_total || invoice.totalAmount)}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;