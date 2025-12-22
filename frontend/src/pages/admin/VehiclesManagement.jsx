import React, { useState, useEffect } from 'react';
import vehicleService from '../../services/vehicleService';
import authService from '../../services/authService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const VehiclesManagementPage = () => {
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

  useEffect(() => {
    loadVehicles();
    loadCustomers();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      // Pass noPagination: true to get all vehicles
      const data = await vehicleService.getAllVehicles({ noPagination: true });
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await authService.getAllUsers();
      // Filter only customers
      const customerList = data.filter(user => user.role === 'customer');
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehicleService.deleteVehicle(vehicleId);
        loadVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Validate that customer is selected
      if (!formData.customer_id) {
        alert('Please select a customer');
        return;
      }
      
      // Validate VIN length (should be max 17 characters)
      if (formData.vin && formData.vin.length > 17) {
        alert('VIN must be 17 characters or less');
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
      loadVehicles();
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
      
      alert('Error creating vehicle: ' + errorMessage);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      // Validate VIN length (should be max 17 characters)
      if (formData.vin && formData.vin.length > 17) {
        alert('VIN must be 17 characters or less');
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
      loadVehicles();
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
      
      alert('Error updating vehicle: ' + errorMessage);
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

  // Ensure vehicles is always an array
  const vehiclesArray = Array.isArray(vehicles) ? vehicles : [];
  
  // Filter vehicles based on status
  const filteredVehicles = vehiclesArray.filter(vehicle => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'complete') {
      return vehicle.make && vehicle.model && vehicle.year && vehicle.vin;
    }
    if (filterStatus === 'incomplete') {
      return !(vehicle.make && vehicle.model && vehicle.year && vehicle.vin);
    }
    return true;
  });

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
                  <h3 className="text-2xl font-bold text-gray-900">{filteredVehicles.length}</h3>
                  <p className="text-sm text-gray-500">{filterStatus === 'all' ? 'Total Vehicles' : filterStatus === 'complete' ? 'Complete Vehicles' : 'Incomplete Vehicles'}</p>
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
                      const customer = customers.find(c => c.id == vehicle.customer_id);
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
                  const customer = customers.find(c => c.id == formData.customer_id);
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
    </div>
  );
};

export default VehiclesManagementPage;