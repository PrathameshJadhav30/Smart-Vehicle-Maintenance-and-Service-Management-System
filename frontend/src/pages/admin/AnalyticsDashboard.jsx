import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/analyticsService';
import { formatCurrency } from '../../utils/currencyFormatter';

const AnalyticsDashboardPage = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalVehicles: 0,
    pendingBookings: 0,
    activeJobs: 0,
    lowStockParts: 0,
    totalUsers: 0,
    revenue: 0,
    mechanics: 0
  });
  
  const [vehicleStats, setVehicleStats] = useState([]);
  const [partsUsageStats, setPartsUsageStats] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  const [mechanicPerformance, setMechanicPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add state for filters
  const [filters, setFilters] = useState({
    revenueStartDate: '',
    revenueEndDate: '',
    mechanicStartDate: '',
    mechanicEndDate: ''
  });

  useEffect(() => {
    loadAllData();

    // Set up periodic polling (every 30 seconds)
    const pollingInterval = setInterval(() => {
      loadAllData();
    }, 30000);

    // Listen for events that should trigger a data refresh
    const handleJobCardCreated = () => {
      loadAllData();
    };

    const handleJobCardCompleted = () => {
      loadAllData();
    };

    const handleInvoiceCreated = () => {
      loadAllData();
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
  }, [filters]); // Add filters as dependency so data reloads when filters change

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to the promise
      const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), ms));
      
      // Create promises for all data loading
      const statsPromise = analyticsService.getDashboardStats();
      const vehicleDataPromise = analyticsService.getVehicleAnalytics();
      const partsDataPromise = analyticsService.getPartsUsageAnalytics();
      
      // Load revenue data with filters
      const revenueParams = {};
      if (filters.revenueStartDate) revenueParams.startDate = filters.revenueStartDate;
      if (filters.revenueEndDate) revenueParams.endDate = filters.revenueEndDate;
      const revenueDataPromise = analyticsService.getRevenueAnalytics(revenueParams);
      
      // Load mechanic performance data with filters
      const mechanicParams = {};
      if (filters.mechanicStartDate) mechanicParams.from = filters.mechanicStartDate;
      if (filters.mechanicEndDate) mechanicParams.to = filters.mechanicEndDate;
      const mechanicDataPromise = analyticsService.getMechanicPerformance(mechanicParams);
      
      // Load all data with timeout
      const [stats, vehicleData, partsData, revenueData, mechanicData] = await Promise.race([
        Promise.all([statsPromise, vehicleDataPromise, partsDataPromise, revenueDataPromise, mechanicDataPromise]), 
        timeout(15000)
      ]); // 15 second timeout
      
      console.log('Raw revenue data:', revenueData); // Debug log
      
      // Map backend response to frontend expected structure
      const mappedStats = {
        totalVehicles: stats.totalVehicles || 0,
        pendingBookings: stats.pendingBookings || 0,
        activeJobs: stats.activeJobcards || 0,
        lowStockParts: stats.lowStockParts || 0,
        totalUsers: stats.totalUsers || 0, // Changed from totalCustomers to totalUsers
        revenue: stats.monthlyRevenue || 0,
        mechanics: 0 // Will be set after loading mechanic performance
      };
      
      setDashboardStats(mappedStats);
      
      // Map vehicle stats data
      const mappedVehicleStats = (vehicleData.topVehicles || []).map(vehicle => ({
        make: vehicle.model || 'Unknown',  // This is actually correct as the DB stores model in the model field
        model: vehicle.vin || 'Unknown',   // This is actually correct as the DB stores VIN in the vin field
        count: parseInt(vehicle.service_count) || 0  // Parse as integer to ensure proper display
      }));
      
      setVehicleStats(mappedVehicleStats);
      
      // Map parts usage data
      const mappedPartsUsageStats = (partsData.partsUsage || []).map(part => ({
        partName: part.name || 'Unknown',
        usageCount: parseInt(part.total_used) || 0  // Parse as integer to ensure proper display
      }));
      
      setPartsUsageStats(mappedPartsUsageStats);
      
      // Map revenue data - use monthlyRevenue if available, otherwise the raw data
      console.log('Revenue data received:', revenueData);
      const revenueToDisplay = revenueData.monthlyRevenue || revenueData.dailyRevenue || [];
      console.log('Revenue to display:', revenueToDisplay);
      const mappedRevenueStats = revenueToDisplay.map(item => ({
        month: item.month ? new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown',
        revenue: parseFloat(item.revenue) || 0  // Ensure revenue is parsed as float
      }));
      
      setRevenueStats(mappedRevenueStats);

      // Calculate mechanics count from mechanic performance data
      const mechanicsCount = mechanicData.mechanicPerformance ? mechanicData.mechanicPerformance.length : 0;
      
      // Update mechanics count in dashboard stats
      setDashboardStats(prevStats => ({
        ...prevStats,
        mechanics: mechanicsCount
      }));
      
      // Map mechanic performance data to match frontend expectations
      const mappedMechanicPerformance = (mechanicData.mechanicPerformance || []).map(mechanic => ({
        mechanicName: mechanic.name || 'Unknown',
        jobsCompleted: mechanic.jobs_completed || 0,
        averageRating: 4.5, // Placeholder - would need actual rating system
        totalRevenue: mechanic.total_revenue || 0
      }));

      setMechanicPerformance(mappedMechanicPerformance);

    } catch (error) {
      console.error('Error loading analytics data:', error);
      console.error('Error response:', error.response?.data);
      setError(error.message || 'Failed to load analytics data. Please try again.');
      // Set default values to prevent infinite loading
      setDashboardStats({
        totalVehicles: 0,
        pendingBookings: 0,
        activeJobs: 0,
        lowStockParts: 0,
        totalUsers: 0,
        revenue: 0,
        mechanics: 0
      });
      setVehicleStats([]);
      setPartsUsageStats([]);
      setRevenueStats([]);
      setMechanicPerformance([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    loadAllData();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      revenueStartDate: '',
      revenueEndDate: '',
      mechanicStartDate: '',
      mechanicEndDate: ''
    });
  };

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
            <h3 className="mt-2 text-lg font-medium text-gray-900">Error Loading Analytics</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Function to get chart bar height based on value
  const getBarHeight = (value, maxValue) => {
    if (maxValue === 0) return '0%';
    return `${(value / maxValue) * 100}%`;
  };

  // Find max values for charts
  const maxPartsUsage = partsUsageStats.length > 0 
    ? Math.max(...partsUsageStats.map(item => item.usageCount)) 
    : 1;
    
  const maxRevenue = revenueStats.length > 0 
    ? Math.max(...revenueStats.map(item => item.revenue)) 
    : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-2 text-lg text-gray-600">
                Monitor key metrics and performance indicators
              </p>
            </div>
            <button
              onClick={loadAllData}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh Data
            </button>
          </div>
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
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
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
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
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
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
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
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
          
          {/* System Overview */}
          <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                      <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-md font-medium text-gray-900">Users</h4>
                      <p className="mt-1 text-3xl font-bold text-gray-900">{dashboardStats.totalUsers}</p>
                      <p className="text-sm text-gray-500">Total registered users</p>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-md font-medium text-gray-900">Revenue</h4>
                      <p className="mt-1 text-3xl font-bold text-gray-900">{formatCurrency(typeof dashboardStats.revenue === 'number' ? dashboardStats.revenue : 0)}</p>
                      <p className="text-sm text-gray-500">This month</p>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                      <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-md font-medium text-gray-900">Mechanics</h4>
                      <p className="mt-1 text-3xl font-bold text-gray-900">{dashboardStats.mechanics}</p>
                      <p className="text-sm text-gray-500">Active mechanics</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vehicle Analytics Chart */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Vehicle Analytics</h3>
              </div>
              <div className="p-6">
                {vehicleStats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Make
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Model
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Count
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {vehicleStats.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.make}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.model}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-3">
                                  <div 
                                    className="bg-blue-600 h-2.5 rounded-full" 
                                    style={{ width: `${(item.count / Math.max(...vehicleStats.map(v => v.count))) * 100}%` }}
                                  ></div>
                                </div>
                                <span>{typeof item.count === 'number' ? item.count : 0}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No vehicle data</h3>
                    <p className="mt-1 text-sm text-gray-500">No vehicle analytics data available.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Parts Usage Analytics Chart */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Parts Usage Analytics</h3>
              </div>
              <div className="p-6">
                {partsUsageStats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Part Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Usage Count
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {partsUsageStats.slice(0, 10).map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.partName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-3">
                                  <div 
                                    className="bg-green-600 h-2.5 rounded-full" 
                                    style={{ width: `${(item.usageCount / maxPartsUsage) * 100}%` }}
                                  ></div>
                                </div>
                                <span>{typeof item.usageCount === 'number' ? item.usageCount : 0}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No parts data</h3>
                    <p className="mt-1 text-sm text-gray-500">No parts usage data available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Revenue Analytics Chart with Filters */}
          <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Revenue Analytics</h3>
                {/* Revenue Filters */}
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.revenueStartDate}
                      onChange={(e) => handleFilterChange('revenueStartDate', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.revenueEndDate}
                      onChange={(e) => handleFilterChange('revenueEndDate', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={applyFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                    >
                      Apply
                    </button>
                    <button
                      onClick={resetFilters}
                      className="ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              {revenueStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Month
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {revenueStats.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.month}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-3">
                                <div 
                                  className="bg-purple-600 h-2.5 rounded-full" 
                                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                                ></div>
                              </div>
                              <span>{formatCurrency(typeof item.revenue === 'number' ? item.revenue : 0)}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No revenue data</h3>
                  <p className="mt-1 text-sm text-gray-500">No revenue analytics data available.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Mechanic Performance with Filters */}
          <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Mechanic Performance</h3>
                {/* Mechanic Performance Filters */}
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filters.mechanicStartDate}
                      onChange={(e) => handleFilterChange('mechanicStartDate', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filters.mechanicEndDate}
                      onChange={(e) => handleFilterChange('mechanicEndDate', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={applyFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                    >
                      Apply
                    </button>
                    <button
                      onClick={resetFilters}
                      className="ml-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              {mechanicPerformance.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mechanic
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jobs Completed
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Average Rating
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Revenue Generated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {mechanicPerformance.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.mechanicName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-3">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${(item.jobsCompleted / Math.max(...mechanicPerformance.map(m => m.jobsCompleted))) * 100}%` }}
                                ></div>
                              </div>
                              <span>{item.jobsCompleted}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <svg className="flex-shrink-0 h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="ml-1">{typeof item.averageRating === 'number' ? item.averageRating.toFixed(1) : 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(typeof item.totalRevenue === 'number' ? item.totalRevenue : 0)}
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
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardPage;