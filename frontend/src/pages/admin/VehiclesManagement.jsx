import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import vehicleService from '../../services/vehicleService';
import authService from '../../services/authService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useToast } from '../../contexts/ToastContext';

const VehiclesManagementPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    registration_number: '',
    mileage: '',
    customer_id: ''
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteVehicleId, setDeleteVehicleId] = useState(null);
  const [totalVehiclesCount, setTotalVehiclesCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  // Add state for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Initial load when component mounts
    loadCustomers();
  }, []);
  
  useEffect(() => {
    // When filter status changes, reset to page 1 and reload
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    // This will trigger the loadVehicles useEffect to reload with new filter
  }, [filterStatus]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadCustomers();
      // Load total count separately
      await loadTotalVehiclesCount();
      await loadVehicles();
      setLoading(false);
    };
    
    loadInitialData();
  }, [pagination.page, pagination.limit, filterStatus]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Only add status filter if it's not 'all'
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const data = await vehicleService.getAllVehicles(params);
      
      // Handle different response formats
      let vehiclesData = [];
      let paginationData = null;
      
      if (Array.isArray(data)) {
        // If data is an array (old format), no pagination
        vehiclesData = data;
        paginationData = null;
      } else {
        // If data is an object, expect vehicles and pagination
        vehiclesData = data.vehicles || [];
        paginationData = data.pagination || null;
      }
      
      setVehicles(vehiclesData);
      
      if (paginationData) {
        // Update pagination with filtered data counts
        // If total is 0 but we have vehicles, use vehicles count as fallback
        setPagination({
          page: paginationData.currentPage || pagination.page,
          limit: paginationData.itemsPerPage || pagination.limit,
          total: paginationData.totalItems > 0 ? paginationData.totalItems : vehiclesData.length,
          pages: paginationData.totalPages || Math.ceil(vehiclesData.length / pagination.limit)
        });
      } else {
        // Fallback: if no pagination data, assume all data returned
        // Set total to the number of vehicles returned
        setPagination(prev => ({
          ...prev,
          total: vehiclesData.length,
          pages: vehiclesData.length > 0 ? Math.ceil(vehiclesData.length / pagination.limit) : 1 // At least 1 page if there are vehicles
        }));
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
      setVehicles([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadTotalVehiclesCount = async () => {
    try {
      // Load total count without pagination or filters
      const data = await vehicleService.getAllVehicles({ noPagination: true });
      setTotalVehiclesCount(data.length || 0);
    } catch (error) {
      console.error('Error loading total vehicle count:', error);
      setTotalVehiclesCount(0);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await authService.getAllUsers();
      const users = Array.isArray(response) ? response : (response.users || []);
      // Filter only customers
      const customerList = users.filter(user => user.role === 'customer');
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleDelete = async (vehicleId) => {
    setDeleteVehicleId(vehicleId);
  };
  
  const confirmDelete = async () => {
    if (deleteVehicleId) {
      try {
        await vehicleService.deleteVehicle(deleteVehicleId);
        // Reload vehicles to reflect the deletion
        await loadVehicles();
        // Reload total count since we removed a vehicle
        await loadTotalVehiclesCount();
        showToast.success('Vehicle deleted successfully');
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        showToast.error('Error deleting vehicle');
      } finally {
        setDeleteVehicleId(null);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Validate that customer is selected
      if (!formData.customer_id) {
        showToast.error('Please select a customer');
        return;
      }
      
      // Validate VIN length (should be max 17 characters)
      if (formData.vin && formData.vin.length > 17) {
        showToast.error('VIN must be 17 characters or less');
        return;
      }
      
      // For admin, we need to send customer_id explicitly
      const vehicleData = {
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        vin: formData.vin,
        registration_number: formData.registration_number,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        customer_id: parseInt(formData.customer_id)
      };
      
      await vehicleService.createVehicle(vehicleData);
      setShowCreateModal(false);
      setFormData({
        make: '',
        model: '',
        year: '',
        vin: '',
        registration_number: '',
        mileage: '',
        customer_id: ''
      });
      // Reload vehicles to include the new vehicle
      await loadVehicles();
      // Reload total count since we added a new vehicle
      await loadTotalVehiclesCount();
      showToast.success('Vehicle added successfully');
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
        if (error.response.data && error.response.data.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      } else if (error.request) {
        errorMessage = 'No response received from server';
      } else {
        errorMessage = error.message;
      }
      
      showToast.error('Error creating vehicle: ' + errorMessage);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      // Validate VIN length (should be max 17 characters)
      if (formData.vin && formData.vin.length > 17) {
        showToast.error('VIN must be 17 characters or less');
        return;
      }
      
      // For editing, we don't send customer_id as it shouldn't change
      const vehicleData = {
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        vin: formData.vin,
        registration_number: formData.registration_number,
        mileage: formData.mileage ? parseInt(formData.mileage) : null
      };
      
      await vehicleService.updateVehicle(editingVehicle.id, vehicleData);
      setShowEditModal(false);
      setEditingVehicle(null);
      setFormData({
        make: '',
        model: '',
        year: '',
        vin: '',
        registration_number: '',
        mileage: '',
        customer_id: ''
      });
      // Reload vehicles to reflect the update
      await loadVehicles();
      // Reload total count in case the update affected counts
      await loadTotalVehiclesCount();
      showToast.success('Vehicle updated successfully');
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${error.response.statusText}`;
        if (error.response.data && error.response.data.message) {
          errorMessage += ` - ${error.response.data.message}`;
        }
      } else if (error.request) {
        errorMessage = 'No response received from server';
      } else {
        errorMessage = error.message;
      }
      
      showToast.error('Error updating vehicle: ' + errorMessage);
    }
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      vin: vehicle.vin || '',
      registration_number: vehicle.registration_number || '',
      mileage: vehicle.mileage || '',
      customer_id: vehicle.customer_id || ''
    });
    setShowEditModal(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2; // Number of pages to show around current page
    
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      range.push(i);
    }
    
    if (range[0] > 1) {
      rangeWithDots.push(1);
      if (range[0] > 2) {
        rangeWithDots.push('...');
      }
    }
    
    rangeWithDots.push(...range);
    
    if (rangeWithDots[rangeWithDots.length - 1] < pages) {
      if (rangeWithDots[rangeWithDots.length - 1] < pages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(pages);
    }
    
    return rangeWithDots;
  };

  // Use vehicles as is since filtering is done on the backend
  const filteredVehicles = vehicles;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
            <div>
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border border-blue-300 mb-4 md:mb-0"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            </div>
            <div className="text-center md:text-center flex-1 md:mx-auto">
              <h1 className="text-3xl font-bold text-gray-900">Vehicles Management</h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage and track all customer vehicles
              </p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer"
            >
              Add New Vehicle
            </Button>
          </div>

          {/* Stats Summary - Simplified to only show total count */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-1 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{totalVehiclesCount}</h3>
                  <p className="text-sm text-gray-500">Total Vehicles</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="mb-6 flex flex-wrap gap-3">
            <div className="flex items-center">
              <span className="mr-2 text-sm font-medium text-gray-700">Filter:</span>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
              >
                <option value="all">All Vehicles</option>
                <option value="complete">Complete Info</option>
                <option value="incomplete">Incomplete Info</option>
              </select>
            </div>
          </div>
          
          {/* Vehicles Table */}
          {filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">No vehicles found</h3>
              <p className="mt-2 text-gray-500">
                {filterStatus === 'all' 
                  ? 'There are no vehicles in the system.' 
                  : filterStatus === 'complete' 
                    ? 'There are no vehicles with complete information.' 
                    : 'There are no vehicles with incomplete information.'}
              </p>
              <div className="mt-6">
                <Button 
                  variant="primary" 
                  onClick={() => setShowCreateModal(true)}
                  className="cursor-pointer"
                >
                  Add Your First Vehicle
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        VIN
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mileage
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredVehicles.map((vehicle) => {
                      // Find the customer name for this vehicle
                      const customer = customers.find(c => c.id === vehicle.customer_id);
                      return (
                        <tr key={vehicle.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.model || '(N/A)'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {customer ? `${customer.name} (${customer.email})` : 'Unknown Customer'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 text-center">
                              {vehicle.year || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {vehicle.vin || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {vehicle.registration_number || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {vehicle.mileage ? `${vehicle.mileage} miles` : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => openEditModal(vehicle)}
                                className="cursor-pointer"
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDelete(vehicle.id)}
                                className="cursor-pointer"
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${pagination.page <= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'}`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${pagination.page >= pagination.pages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'}`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> to <span className="font-medium">{pagination.total > 0 ? Math.min(pagination.page * pagination.limit, pagination.total) : 0}</span> of <span className="font-medium">{pagination.total || 0}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pagination.page <= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {getPageNumbers().map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pagination.page === pageNum ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer'}`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pagination.page >= pagination.pages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Vehicle Modal */}
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Add Vehicle"
      >
        <form onSubmit={handleCreate}>
          <div className="space-y-4">
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>
              <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>
            </div>
            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
              <input
                type="text"
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                maxLength="17"
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input
                type="text"
                id="registration_number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select
                id="customer_id"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
              className="cursor-pointer px-4 py-2 rounded-lg transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              className="cursor-pointer px-4 py-2 rounded-lg transition-all duration-200"
            >
              Add Vehicle
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Edit Vehicle"
      >
        <form onSubmit={handleEdit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>
              <div>
                <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>
            </div>
            <div>
              <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
              <input
                type="text"
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                maxLength="17"
                required
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
            <div>
              <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input
                type="text"
                id="registration_number"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <div className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 bg-gray-50">
                {(() => {
                  const customer = customers.find(c => c.id === formData.customer_id);
                  return customer ? `${customer.name} (${customer.email})` : 'Unknown Customer';
                })()}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowEditModal(false)}
              className="cursor-pointer px-4 py-2 rounded-lg transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              className="cursor-pointer px-4 py-2 rounded-lg transition-all duration-200"
            >
              Update Vehicle
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteVehicleId}
        onClose={() => setDeleteVehicleId(null)}
        onConfirm={confirmDelete}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle?"
      />
    </div>
  );
};

export default VehiclesManagementPage;