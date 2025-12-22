import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import bookingService from '../../services/bookingService';
import jobcardService from '../../services/jobcardService';

const MechanicDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [assignedBookings, setAssignedBookings] = useState([]);
  const [activeJobCards, setActiveJobCards] = useState([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [inProgressJobs, setInProgressJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create promises for all API calls
        const bookingPromise = bookingService.getMechanicBookings(user.id);
        const jobCardPromise = jobcardService.getMechanicJobCards(user.id);
        
        // Add timeout to each promise
        const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms));
        
        // Load mechanic's assigned bookings
        const bookingData = await Promise.race([bookingPromise, timeout(10000)]); // 10 second timeout
        const assignedBookingsArray = Array.isArray(bookingData) ? bookingData : [];
        setAssignedBookings(assignedBookingsArray.slice(0, 3)); // Get only the first 3 for display
        
        // Count assigned bookings (all bookings assigned to this mechanic)
        const mechanicAssignedBookings = assignedBookingsArray.length;
        setPendingBookings(mechanicAssignedBookings);
        
        // Load mechanic's job cards
        const jobCardData = await Promise.race([jobCardPromise, timeout(10000)]); // 10 second timeout
        const jobCardsArray = Array.isArray(jobCardData) ? jobCardData : [];
        
        // Set active job cards (not completed or cancelled)
        setActiveJobCards(jobCardsArray.filter(jc => 
          jc.status !== 'completed' && jc.status !== 'cancelled'
        ).slice(0, 3));
        
        // Count completed job cards today
        const today = new Date().toISOString().split('T')[0];
        const completedTodayCount = jobCardsArray.filter(jc => 
          jc.status === 'completed' && 
          jc.updated_at && 
          jc.updated_at.split('T')[0] === today
        ).length;
        setCompletedToday(completedTodayCount);
        
        // Count in-progress jobs (jobs that are assigned to the mechanic and in progress)
        const inProgressCount = jobCardsArray.filter(jc => 
          jc.status === 'in_progress' || jc.status === 'assigned'
        ).length;
        setInProgressJobs(inProgressCount);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError(error.message || 'Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      loadData();
    }

    // Set up periodic polling (every 30 seconds)
    const pollingInterval = setInterval(() => {
      if (user && user.id) {
        loadData();
      }
    }, 30000);

    // Listen for job card creation events to refresh the dashboard
    const handleJobCardCreated = () => {
      if (user && user.id) {
        loadData();
      }
    };

    // Listen for job card completion events to refresh the dashboard
    const handleJobCardCompleted = () => {
      if (user && user.id) {
        loadData();
      }
    };

    // Listen for invoice creation events to refresh the dashboard
    const handleInvoiceCreated = () => {
      if (user && user.id) {
        loadData();
      }
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
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-rose-100 text-rose-800',
      rejected: 'bg-rose-100 text-rose-800'
    };

    const statusText = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };

    return (
      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const getJobCardStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-rose-100 text-rose-800'
    };

    const statusText = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };

    return (
      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  // Function to get vehicle icon based on service type
  const getServiceTypeIcon = (serviceType) => {
    const typeLower = (serviceType || '').toLowerCase();
    
    if (typeLower.includes('engine')) {
      return (
        <div className="bg-red-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      );
    } else if (typeLower.includes('brake')) {
      return (
        <div className="bg-orange-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
      );
    } else if (typeLower.includes('oil') || typeLower.includes('lube')) {
      return (
        <div className="bg-amber-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      );
    } else if (typeLower.includes('tire') || typeLower.includes('wheel')) {
      return (
        <div className="bg-blue-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      );
    } else if (typeLower.includes('electrical') || typeLower.includes('battery')) {
      return (
        <div className="bg-yellow-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      );
    } else {
      // Default wrench icon
      return (
        <div className="bg-gray-100 rounded-lg p-2">
          <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || 'Mechanic'}!</h1>
              <p className="mt-2 text-lg text-gray-600">Here's what's happening with your work today.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button 
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Logout
              </button>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Assigned Bookings Card */}
            <div className="bg-white overflow-hidden shadow rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-amber-100 rounded-xl p-3">
                    <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Assigned Bookings</dt>
                      <dd className="flex items-baseline">
                        <div className="text-3xl font-bold text-gray-900">{pendingBookings}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="text-sm">
                  <button 
                    onClick={() => navigate('/mechanic/bookings')}
                    className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
                  >
                    View all bookings
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Active Job Cards Card */}
            <div className="bg-white overflow-hidden shadow rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-xl p-3">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Jobs</dt>
                      <dd className="flex items-baseline">
                        <div className="text-3xl font-bold text-gray-900">{inProgressJobs}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="text-sm">
                  <button 
                    onClick={() => navigate('/mechanic/job-cards')}
                    className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
                  >
                    Manage job cards
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Completed Today Card */}
            <div className="bg-white overflow-hidden shadow rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-emerald-100 rounded-xl p-3">
                    <svg className="h-6 w-6 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                      <dd className="flex items-baseline">
                        <div className="text-3xl font-bold text-gray-900">{completedToday}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="text-sm">
                  <button 
                    onClick={() => navigate('/mechanic/job-cards')}
                    className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
                  >
                    View all jobs
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Quick Actions Card */}
            <div className="bg-white overflow-hidden shadow rounded-xl hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-xl p-3">
                    <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Quick Actions</dt>
                      <dd className="flex items-baseline">
                        <div className="text-lg font-bold text-gray-900">View Job Cards</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                <div className="text-sm">
                  <button 
                    onClick={() => navigate('/mechanic/job-cards')}
                    className="font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center"
                  >
                    Manage jobs
                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Assigned Bookings */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Recent Bookings</h3>
                    <p className="mt-1 text-sm text-gray-500">Your upcoming service appointments</p>
                  </div>
                  <button 
                    onClick={() => navigate('/mechanic/bookings')}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0"
                  >
                    View all
                  </button>
                </div>
                <div className="p-6">
                  {assignedBookings.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {assignedBookings.map((booking) => (
                        <li key={booking.id} className="py-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              {getServiceTypeIcon(booking.service_type)}
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-base font-medium text-gray-900 truncate">
                                  {(booking.make || '') + ' ' + (booking.model || 'Unknown Vehicle')}
                                </p>
                                <div className="ml-2 flex-shrink-0">
                                  {getStatusBadge(booking.status)}
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-gray-500 truncate">
                                for {booking.customer_name || 'N/A'}
                              </p>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>
                                  {booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : 'N/A'} • {booking.service_type || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-3 text-lg font-medium text-gray-900">No bookings assigned</h3>
                      <p className="mt-1 text-sm text-gray-500">You don't have any assigned bookings right now.</p>
                      <div className="mt-6">
                        <button
                          onClick={() => navigate('/mechanic/bookings')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View all bookings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Active Job Cards */}
              <div className="bg-white shadow rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Active Job Cards</h3>
                    <p className="mt-1 text-sm text-gray-500">Jobs currently in progress</p>
                  </div>
                  <button 
                    onClick={() => navigate('/mechanic/job-cards')}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0"
                  >
                    View all
                  </button>
                </div>
                <div className="p-6">
                  {activeJobCards.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {activeJobCards.map((jobCard) => (
                        <li key={jobCard.id} className="py-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 bg-gray-100 rounded-lg p-2">
                              <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-base font-medium text-gray-900 truncate">
                                  #{String(jobCard.id).substring(0, 8)}
                                </p>
                                <div className="ml-2 flex-shrink-0">
                                  {getJobCardStatusBadge(jobCard.status)}
                                </div>
                              </div>
                              <p className="mt-1 text-sm text-gray-500 truncate">
                                {(jobCard.vehicle?.make || jobCard.make || '') + ' ' + (jobCard.vehicle?.model || jobCard.model || 'Unknown Vehicle')}
                              </p>
                              <div className="mt-2 flex items-center text-sm text-gray-500">
                                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                  Created {jobCard.created_at ? new Date(jobCard.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-3 text-lg font-medium text-gray-900">No active jobs</h3>
                      <p className="mt-1 text-sm text-gray-500">You don't have any active job cards right now.</p>
                      <div className="mt-6">
                        <button
                          onClick={() => navigate('/mechanic/job-cards')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View job cards
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Links */}
              <div className="bg-white shadow rounded-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Quick Links</h3>
                  <p className="mt-1 text-sm text-gray-500">Access frequently used sections</p>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    <li>
                      <button
                        onClick={() => navigate('/mechanic/bookings')}
                        className="w-full flex items-center p-4 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                      >
                        <div className="flex-shrink-0 bg-amber-100 rounded-lg p-2 group-hover:bg-amber-200 transition-colors duration-200">
                          <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="ml-4">Manage Bookings</span>
                        <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate('/mechanic/job-cards')}
                        className="w-full flex items-center p-4 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                      >
                        <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2 group-hover:bg-blue-200 transition-colors duration-200">
                          <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <span className="ml-4">Job Cards</span>
                        <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate('/mechanic/parts')}
                        className="w-full flex items-center p-4 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                      >
                        <div className="flex-shrink-0 bg-teal-100 rounded-lg p-2 group-hover:bg-teal-200 transition-colors duration-200">
                          <svg className="h-5 w-5 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <span className="ml-4">Parts Inventory</span>
                        <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigate('/mechanic/profile')}
                        className="w-full flex items-center p-4 text-base font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                      >
                        <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2 group-hover:bg-purple-200 transition-colors duration-200">
                          <svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="ml-4">My Profile</span>
                        <svg className="ml-auto h-5 w-5 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;