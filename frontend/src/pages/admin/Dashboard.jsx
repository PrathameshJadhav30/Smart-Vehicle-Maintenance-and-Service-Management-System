import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import analyticsService from '../../services/analyticsService';
import jobcardService from '../../services/jobcardService';
import authService from '../../services/authService';
import { formatCurrency } from '../../utils/currencyFormatter';
import DashboardLayout from '../../layouts/DashboardLayout';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState({
    totalVehicles: 0,
    pendingBookings: 0,
    activeJobs: 0,
    lowStockParts: 0,
    totalUsers: 0,
    revenue: 0,
    mechanics: 0
  });
  const [mechanicStats, setMechanicStats] = useState([]);
  const [jobAssignments, setJobAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard statistics
        const stats = await analyticsService.getDashboardStats();
        console.log('Dashboard stats received:', stats); // Debug log
        setDashboardStats(prevStats => ({
          ...prevStats,
          ...stats,
          // Map backend property names to frontend expected names
          revenue: stats.monthlyRevenue || 0
        }));
        
        // Fetch mechanic performance data
        const mechStatsResponse = await analyticsService.getMechanicPerformance();
        // The response is { mechanicPerformance: [...] }, so we need to extract the array
        const rawMechStats = mechStatsResponse.mechanicPerformance || [];
        
        // Map mechanic performance data to match frontend expectations
        const mappedMechStats = rawMechStats.map(mechanic => ({
          id: mechanic.id,
          name: mechanic.name || 'Unknown',
          jobs_completed: mechanic.jobs_completed || 0,
          total_revenue: mechanic.total_revenue || 0
        }));
        
        setMechanicStats(mappedMechStats);
        
        // Update mechanics count in dashboard stats
        setDashboardStats(prevStats => ({
          ...prevStats,
          mechanics: rawMechStats.length
        }));
        
        // Fetch all mechanics to calculate assignments
        const mechanics = await authService.getAllMechanics();
        
        // Calculate job assignments distribution by fetching job cards for each mechanic
        if (Array.isArray(mechanics)) {
          const assignments = [];
          
          for (const mechanic of mechanics) {
            try {
              // Get job cards for this specific mechanic
              const mechanicJobCardsResponse = await jobcardService.getMechanicJobCards(mechanic.id, { page: 1, limit: 100 }); // Fetch up to 100 job cards
              
              // Handle different response formats
              let mechanicJobCards = [];
              if (Array.isArray(mechanicJobCardsResponse)) {
                // If response is an array
                mechanicJobCards = mechanicJobCardsResponse;
              } else if (mechanicJobCardsResponse && mechanicJobCardsResponse.jobcards) {
                // If response has jobcards property (paginated response)
                mechanicJobCards = mechanicJobCardsResponse.jobcards;
              } else {
                // Fallback
                mechanicJobCards = [];
              }
              
              assignments.push({
                mechanicId: mechanic.id,
                mechanicName: mechanic.name,
                assignedJobs: mechanicJobCards.length,
                completedJobs: mechanicJobCards.filter(job => job.status === 'completed').length
              });
            } catch (error) {
              console.error(`Error fetching job cards for mechanic ${mechanic.id}:`, error);
              // Add the mechanic with 0 assignments if there's an error
              assignments.push({
                mechanicId: mechanic.id,
                mechanicName: mechanic.name,
                assignedJobs: 0,
                completedJobs: 0
              });
            }
          }
          
          // Sort by assigned jobs count
          assignments.sort((a, b) => b.assignedJobs - a.assignedJobs);
          setJobAssignments(assignments.slice(0, 5)); // Top 5 mechanics by assignments
        } else {
          // If mechanics array is not valid, set empty assignments
          setJobAssignments([]);
        }
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
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout role="admin" title="Admin Dashboard">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome, {user?.name || 'Admin'}!</h1>
          <p className="mt-2 text-lg text-gray-600">Here's what's happening with your system today.</p>
        </div>
        
        {/* Stats Cards - Enhanced Responsive Grid */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Vehicles Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{dashboardStats.totalVehicles}</h3>
                <p className="text-sm text-gray-500">Total Vehicles</p>
              </div>
            </div>
          </div>
          
          {/* Pending Bookings Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-amber-100">
                <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{dashboardStats.pendingBookings}</h3>
                <p className="text-sm text-gray-500">Pending Bookings</p>
              </div>
            </div>
          </div>
          
          {/* Active Jobs Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{dashboardStats.activeJobs}</h3>
                <p className="text-sm text-gray-500">Active Jobs</p>
              </div>
            </div>
          </div>
          
          {/* Low Stock Parts Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-2xl font-bold text-gray-900">{dashboardStats.lowStockParts}</h3>
                <p className="text-sm text-gray-500">Low Stock Parts</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* System Overview - Enhanced Responsive Layout */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-3">
              <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-md font-medium text-gray-500">Users</h4>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{dashboardStats.totalUsers}</p>
                    <p className="text-sm text-gray-500">Total registered users</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-md font-medium text-gray-500">Revenue</h4>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(typeof dashboardStats.revenue === 'number' ? dashboardStats.revenue : 0)}</p>
                    <p className="text-sm text-gray-500">This month</p>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                    <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-md font-medium text-gray-500">Mechanics</h4>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{dashboardStats.mechanics}</p>
                    <p className="text-sm text-gray-500">Active mechanics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Sections - Simplified Layout */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Top Performing Mechanics */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Mechanics</h3>
            </div>
            <div className="p-6">
              {mechanicStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                          Mechanic
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                          Revenue Generated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mechanicStats.slice(0, 5).map((mechanic) => (
                        <tr key={mechanic.id} className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sm:px-6">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-800 text-xs font-medium">
                                  {mechanic.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{mechanic.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6 font-medium">
                            {formatCurrency(typeof mechanic.total_revenue === 'number' ? mechanic.total_revenue : 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No mechanic data</h3>
                  <p className="mt-1 text-sm text-gray-500">No mechanic performance data available.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Job Assignments Distribution */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Job Assignments Distribution</h3>
            </div>
            <div className="p-6">
              {jobAssignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                          Mechanic
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sm:px-6">
                          Assigned Jobs
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobAssignments.map((assignment) => (
                        <tr key={assignment.mechanicId} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sm:px-6 cursor-pointer">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-800 text-xs font-medium">
                                  {assignment.mechanicName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{assignment.mechanicName}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6 font-medium cursor-pointer">
                            {assignment.assignedJobs}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assignment data</h3>
                  <p className="mt-1 text-sm text-gray-500">No job assignment data available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions - Enhanced Responsive Grid */}
        <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              <button 
                onClick={() => navigate('/admin/users')}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
              >
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-3 group-hover:bg-blue-200 transition-colors duration-200">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="mt-3 text-sm font-medium text-gray-900 text-center">Manage Users</span>
              </button>
              
              <button 
                onClick={() => navigate('/admin/bookings')}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
              >
                <div className="flex-shrink-0 bg-amber-100 rounded-full p-3 group-hover:bg-amber-200 transition-colors duration-200">
                  <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="mt-3 text-sm font-medium text-gray-900 text-center">Bookings</span>
              </button>
              
              <button 
                onClick={() => navigate('/admin/parts')}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
              >
                <div className="flex-shrink-0 bg-green-100 rounded-full p-3 group-hover:bg-green-200 transition-colors duration-200">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="mt-3 text-sm font-medium text-gray-900 text-center">Parts Inventory</span>
              </button>
              
              <button 
                onClick={() => navigate('/admin/analytics')}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
              >
                <div className="flex-shrink-0 bg-purple-100 rounded-full p-3 group-hover:bg-purple-200 transition-colors duration-200">
                  <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="mt-3 text-sm font-medium text-gray-900 text-center">Analytics</span>
              </button>
              
              <button 
                onClick={() => navigate('/admin/vehicles')}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
              >
                <div className="flex-shrink-0 bg-indigo-100 rounded-full p-3 group-hover:bg-indigo-200 transition-colors duration-200">
                  <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="mt-3 text-sm font-medium text-gray-900 text-center">Vehicles</span>
              </button>
              
              <button 
                onClick={() => navigate('/admin/invoices')}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
              >
                <div className="flex-shrink-0 bg-teal-100 rounded-full p-3 group-hover:bg-teal-200 transition-colors duration-200">
                  <svg className="h-6 w-6 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="mt-3 text-sm font-medium text-gray-900 text-center">Invoices</span>
              </button>
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;