import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import vehicleService from '../../services/vehicleService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmationModal from '../../components/ConfirmationModal';

const VehiclesPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, vehicleId: null });
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    vin: '',
    registration_number: '',
    mileage: ''
  });
  const [formError, setFormError] = useState('');

  // Pagination, search, and sort states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const itemsPerPage = 6;

  useEffect(() => {
    loadVehicles();
  }, [currentPage, searchTerm, sortBy, sortOrder]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const options = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        sortBy,
        sortOrder
      };

      const data = await vehicleService.getVehiclesByUserId(user.id, options);
      setVehicles(data.vehicles || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalItems(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear form error when user starts typing in potentially problematic fields
    if (name === 'vin' || name === 'registration_number') {
      setFormError('');
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); // Clear any previous errors
    try {
      if (selectedVehicle) {
        // Edit vehicle
        await vehicleService.updateVehicle(selectedVehicle.id, formData);
        showToast.success('Vehicle details updated successfully!');
      } else {
        // Add new vehicle
        await vehicleService.createVehicle({ ...formData, userId: user.id });
        showToast.success('Vehicle added successfully!');
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({
        make: '',
        model: '',
        year: '',
        vin: '',
        registration_number: '',
        mileage: ''
      });
      setSelectedVehicle(null);
      setFormError(''); // Clear error on success
      loadVehicles(); // Reload with current pagination settings
    } catch (error) {
      console.error('Error saving vehicle:', error);
      let errorMessage = error.response?.data?.message || 'Error saving vehicle. Please try again.';
      
      // Handle specific duplicate VIN error
      if (errorMessage.toLowerCase().includes('vin') && errorMessage.toLowerCase().includes('already')) {
        errorMessage = 'A vehicle with this VIN already exists. Please check the VIN and try again.';
      }
      
      // Handle specific duplicate registration number error
      if (errorMessage.toLowerCase().includes('registration') && errorMessage.toLowerCase().includes('already')) {
        errorMessage = 'A vehicle with this registration number already exists. Please check the registration number and try again.';
      }
      
      setFormError(errorMessage);
      showToast.error(errorMessage);
    }
  };

  const handleAddClick = () => {
    // Reset form data to empty values when opening add modal
    setFormData({
      make: '',
      model: '',
      year: '',
      vin: '',
      registration_number: '',
      mileage: ''
    });
    setSelectedVehicle(null); // Clear selected vehicle
    setShowAddModal(true);
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      vin: vehicle.vin || '',
      registration_number: vehicle.registration_number || '',
      mileage: vehicle.mileage || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (vehicleId) => {
    setDeleteConfirmation({ isOpen: true, vehicleId });
  };
  
  const confirmDelete = async () => {
    const vehicleId = deleteConfirmation.vehicleId;
    
    try {
      await vehicleService.deleteVehicle(vehicleId);
      loadVehicles(); // Reload with current pagination settings
      showToast.success('Vehicle deleted successfully!');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      // Check if it's a 403 error and show appropriate message
      if (error.response?.status === 403) {
        showToast.error('Access denied. You can only delete your own vehicles.');
      } else {
        showToast.error('Error deleting vehicle. Please try again.');
      }
    } finally {
      setDeleteConfirmation({ isOpen: false, vehicleId: null });
    }
  };
  
  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, vehicleId: null });
  };

  // Function to get vehicle icon based on make
  const getVehicleIcon = (make) => {
    const makeLower = (make || '').toLowerCase();

    const baseStyle = "rounded-xl p-3 flex items-center justify-center";

    if (makeLower.includes('toyota')) {
      return (
        <div className={`bg-blue-100 ${baseStyle}`}>
          {/* Toyota car icon */}
          <svg className="h-10 w-10 text-blue-600" viewBox="0 0 64 64" fill="currentColor">
            <path d="M12 44h40l4-16H8l4 16zm0 0v4a4 4 0 0 0 8 0v-4h24v4a4 4 0 0 0 8 0v-4M20 28a4 4 0 1 1 8 0 4 4 0 0 1-8 0zm16 0a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('honda')) {
      return (
        <div className={`bg-red-100 ${baseStyle}`}>
          {/* Honda car icon */}
          <svg className="h-10 w-10 text-red-600" viewBox="0 0 64 64" fill="currentColor">
            <path d="M10 40h44l5-18H5l5 18zm0 0v3a3 3 0 0 0 6 0v-3h36v3a3 3 0 0 0 6 0v-3M18 24a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm22 0a3 3 0 1 1 6 0 3 3 0 0 1-6 0z" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('ford')) {
      return (
        <div className={`bg-indigo-100 ${baseStyle}`}>
          {/* Ford car icon */}
          <svg className="h-10 w-10 text-indigo-600" viewBox="0 0 64 64" fill="currentColor">
            <path d="M8 42h48l5-20H3l5 20zm0 0v4a4 4 0 0 0 8 0v-4h40v4a4 4 0 0 0 8 0v-4M18 26a4 4 0 1 1 8 0 4 4 0 0 1-8 0zm22 0a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" />
          </svg>
        </div>
      );
    } else if (makeLower.includes('bmw') || makeLower.includes('mercedes')) {
      return (
        <div className={`bg-green-100 ${baseStyle}`}>
          {/* BMW / Mercedes car icon */}
          <svg className="h-10 w-10 text-green-600" viewBox="0 0 64 64" fill="currentColor">
            <path d="M12 44h40l6-18H6l6 18zm0 0v4a4 4 0 0 0 8 0v-4h24v4a4 4 0 0 0 8 0v-4M20 28a4 4 0 1 1 8 0 4 4 0 0 1-8 0zm16 0a4 4 0 1 1 8 0 4 4 0 0 1-8 0z" />
          </svg>
        </div>
      );
    } else {
      // Default car icon
      return (
        <div className={`bg-gray-100 ${baseStyle}`}>
          <svg className="h-10 w-10 text-gray-600" viewBox="0 0 64 64" fill="currentColor">
            <path d="M10 40h44l5-18H5l5 18zm0 0v3a3 3 0 0 0 6 0v-3h36v3a3 3 0 0 0 6 0v-3M18 24a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm22 0a3 3 0 1 1 6 0 3 3 0 0 1-6 0z" />
          </svg>
        </div>
      );
    }
  };
  const SortIndicator = ({ field }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Vehicles</h1>
            <p className="mt-2 text-gray-600">Manage your registered vehicles</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button
              onClick={handleAddClick}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Vehicle
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search vehicles (make, model, VIN)..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
              <svg className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.5 3A2.5 2.5 0 0 0 3 5.5v1A2.5 2.5 0 0 0 5.5 9h13A2.5 2.5 0 0 0 21 6.5v-1A2.5 2.5 0 0 0 18.5 3h-13Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9v1a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM9 9V5M15 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM15 9V5" />
              </svg>
            </div>
            <h3 className="mt-6 text-2xl font-bold text-gray-900">No vehicles registered</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">Get started by adding your first vehicle to manage your service appointments.</p>
            <div className="mt-8">
              <Button
                onClick={handleAddClick}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md"
              >
                <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Your First Vehicle
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Grid layout for vehicles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        {getVehicleIcon(vehicle.make)}
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {vehicle.year || 'Year unknown'}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {vehicle.registration_number || 'No reg'}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">VIN</p>
                        <p className="text-sm text-gray-900 truncate">{vehicle.vin || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mileage</p>
                        <p className="text-sm text-gray-900">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      >
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                      >
                        <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-2xl shadow-sm">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                      <span className="font-medium">{totalItems}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'cursor-not-allowed' : ''
                          }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === pageNum
                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                              }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'cursor-not-allowed' : ''
                          }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Vehicle Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Vehicle">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {formError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{formError}</h3>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-lg transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 rounded-lg transition-all duration-200"
            >
              Add Vehicle
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Vehicle">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {formError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{formError}</h3>
                  </div>
                </div>
              </div>
            )}
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-lg transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 rounded-lg transition-all duration-200"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Delete Vehicle Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirm Vehicle Deletion"
        message="Are you sure you want to delete this vehicle? "
        confirmText="Delete Vehicle"
        cancelText="Keep Vehicle"
        processing={false}
        confirmVariant="danger"
        cancelVariant="secondary"
      />
    </div>
  );
};

export default VehiclesPage;