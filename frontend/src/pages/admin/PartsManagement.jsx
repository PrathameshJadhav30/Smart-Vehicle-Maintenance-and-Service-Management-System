import React, { useState, useEffect } from 'react';
import partsService from '../../services/partsService';
import adminService from '../../services/adminService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { formatCurrency } from '../../utils/currencyFormatter';

const PartsManagementPage = () => {
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPartModal, setShowPartModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [partFormData, setPartFormData] = useState({
    name: '',
    partNumber: '',
    description: '',
    price: '',
    stockLevel: '',
    minStockLevel: '',
    supplierId: ''
  });
  
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadPartsData();
    loadSuppliers();
  }, [showLowStock]);

  // Add event listener for real-time updates
  useEffect(() => {
    const handlePartUpdated = () => {
      loadPartsData();
    };

    const handlePartAdded = () => {
      loadPartsData();
    };

    const handlePartDeleted = () => {
      loadPartsData();
    };

    const handleSparePartAdded = () => {
      loadPartsData();
    };

    window.addEventListener('partUpdated', handlePartUpdated);
    window.addEventListener('partAdded', handlePartAdded);
    window.addEventListener('partDeleted', handlePartDeleted);
    window.addEventListener('sparePartAdded', handleSparePartAdded);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('partUpdated', handlePartUpdated);
      window.removeEventListener('partAdded', handlePartAdded);
      window.removeEventListener('partDeleted', handlePartDeleted);
      window.removeEventListener('sparePartAdded', handleSparePartAdded);
    };
  }, []);

  const loadPartsData = async () => {
    try {
      setLoading(true);
      let data;
      
      if (showLowStock) {
        console.log('Fetching low stock parts...');
        data = await partsService.getLowStockParts();
        console.log('Low stock parts data:', data);
      } else {
        console.log('Fetching all parts...');
        data = await partsService.getAllParts();
        console.log('All parts data:', data);
      }
      
      console.log('Parts data received:', data);
      
      // Ensure data is an array
      const dataArray = Array.isArray(data) ? data : (data.parts || []);
      
      // Map backend field names to frontend expected names
      const mappedData = dataArray.map(part => ({
        ...part,
        partNumber: part.part_number || part.partNumber || '',
        stockLevel: part.quantity !== undefined ? part.quantity : (part.stockLevel || 0),
        minStockLevel: part.reorder_level !== undefined ? part.reorder_level : (part.minStockLevel || 0),
        price: part.price || 0,
        supplier_id: part.supplier_id || null
      }));
      
      console.log('Mapped parts data:', mappedData);
      setParts(mappedData);
    } catch (error) {
      console.error('Error loading parts:', error);
      alert('Failed to load parts. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  const loadSuppliers = async () => {
    try {
      console.log('Fetching all suppliers...');
      const data = await partsService.getAllSuppliers();
      console.log('Suppliers data:', data);
      
      console.log('Suppliers data received:', data);
      
      // Ensure data is an array
      const dataArray = Array.isArray(data) ? data : (data.suppliers || []);
      
      // Map backend field names to frontend expected names if needed
      const mappedData = dataArray.map(supplier => ({
        ...supplier,
        contactPerson: supplier.contact_person || supplier.contactPerson || ''
      }));
      
      console.log('Mapped suppliers data:', mappedData);
      setSuppliers(mappedData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      alert('Failed to load suppliers. Please check the console for details.');
    }
  };

  const handlePartInputChange = (e) => {
    setPartFormData({
      ...partFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSupplierInputChange = (e) => {
    setSupplierFormData({
      ...supplierFormData,
      [e.target.name]: e.target.value
    });
  };

  const filteredParts = parts.filter(part => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      part.name?.toLowerCase().includes(term) ||
      part.partNumber?.toLowerCase().includes(term) ||
      part.description?.toLowerCase().includes(term)
    );
  });

  const handlePartSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map frontend field names to backend expected names
      const partData = {
        name: partFormData.name,
        part_number: partFormData.partNumber,
        price: parseFloat(partFormData.price) || 0,
        quantity: parseInt(partFormData.stockLevel) || 0,
        reorder_level: parseInt(partFormData.minStockLevel) || 0,
        description: partFormData.description,
        supplier_id: partFormData.supplierId ? parseInt(partFormData.supplierId) : null
      };
      
      if (editingPart) {
        // Update part
        await partsService.updatePart(editingPart.id, partData);
        // Dispatch event for real-time updates
        window.dispatchEvent(new CustomEvent('partUpdated'));
      } else {
        // Create new part
        await partsService.createPart(partData);
        // Dispatch event for real-time updates
        window.dispatchEvent(new CustomEvent('partAdded'));
      }
      
      setShowPartModal(false);
      resetPartForm();
      loadPartsData();
    } catch (error) {
      console.error('Error saving part:', error);
      alert('Failed to save part. Please try again.');
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      // Map frontend field names to backend expected names
      const supplierData = {
        name: supplierFormData.name,
        contact_person: supplierFormData.contactPerson,
        email: supplierFormData.email,
        phone: supplierFormData.phone,
        address: supplierFormData.address
      };
      
      if (editingSupplier) {
        // Update supplier
        await partsService.updateSupplier(editingSupplier.id, supplierData);
      } else {
        // Create new supplier
        await partsService.createSupplier(supplierData);
      }
      
      setShowSupplierModal(false);
      resetSupplierForm();
      loadSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Failed to save supplier. Please try again.');
    }
  };

  const resetPartForm = () => {
    setPartFormData({
      name: '',
      partNumber: '',
      description: '',
      price: '',
      stockLevel: '',
      minStockLevel: '',
      supplierId: ''
    });
    setEditingPart(null);
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: ''
    });
    setEditingSupplier(null);
  };

  const handleEditPart = (part) => {
    setEditingPart(part);
    setPartFormData({
      name: part.name || '',
      partNumber: part.partNumber || part.part_number || '',
      description: part.description || '',
      price: part.price || '',
      stockLevel: part.stockLevel !== undefined ? part.stockLevel : (part.quantity || ''),
      minStockLevel: part.minStockLevel !== undefined ? part.minStockLevel : (part.reorder_level || ''),
      supplierId: part.supplier_id || ''
    });
    setShowPartModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || ''
    });
    setShowSupplierModal(true);
  };

  const handleDeletePart = async (partId) => {
    if (window.confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      try {
        await partsService.deletePart(partId);
        // Dispatch event for real-time updates
        window.dispatchEvent(new CustomEvent('partDeleted'));
        loadPartsData();
      } catch (error) {
        console.error('Error deleting part:', error);
        alert('Failed to delete part. Please try again.');
      }
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) {
      try {
        await partsService.deleteSupplier(supplierId);
        loadSuppliers();
      } catch (error) {
        console.error('Error deleting supplier:', error);
        alert('Failed to delete supplier. Please try again.');
      }
    }
  };

  const getStatusBadge = (stockLevel, minStockLevel) => {
    if (stockLevel <= minStockLevel) {
      return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Low Stock</span>;
    } else if (stockLevel <= minStockLevel * 1.5) {
      return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Low Stock Warning</span>;
    } else {
      return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">In Stock</span>;
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Are you sure you want to clear the application cache? This will force reload all data from the database.')) {
      try {
        await adminService.clearCache();
        alert('Cache cleared successfully! Reloading data...');
        loadPartsData();
        loadSuppliers();
      } catch (error) {
        console.error('Error clearing cache:', error);
        alert('Failed to clear cache. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Ensure parts and suppliers are always arrays
  const partsArray = Array.isArray(filteredParts) ? filteredParts : [];
  const suppliersArray = Array.isArray(suppliers) ? suppliers : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Parts & Inventory Management</h1>
                <p className="mt-2 text-gray-600">Manage and track spare parts inventory</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => { resetPartForm(); setShowPartModal(true); }}>
                  Add Part
                </Button>
                <Button onClick={() => { resetSupplierForm(); setShowSupplierModal(true); }}>
                  Add Supplier
                </Button>
                <Button variant="secondary" onClick={handleClearCache}>
                  Clear Cache
                </Button>
              </div>
            </div>
          </div>

          {/* Parts Section */}
          <div className="mb-10">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Parts Management</h2>
                <p className="text-gray-600">View and manage spare parts inventory</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full md:w-64"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <Button 
                  variant={showLowStock ? "primary" : "secondary"}
                  onClick={() => setShowLowStock(!showLowStock)}
                  className="whitespace-nowrap"
                >
                  {showLowStock ? "Show All Parts" : "Show Low Stock Only"}
                </Button>
              </div>
            </div>

            {partsArray.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-900">No parts found</h3>
                <p className="mt-2 text-gray-500">There are no parts in the inventory.</p>
                <div className="mt-6">
                  <Button onClick={() => { resetPartForm(); setShowPartModal(true); }}>
                    Add Part
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Part Details
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Part Number
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock Level
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {partsArray.map((part) => (
                        <tr key={part.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{part.name}</div>
                            {part.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{part.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{part.partNumber || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(part.price)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {parseInt(part.stockLevel || 0)} units
                            </div>
                            <div className="text-xs text-gray-500">
                              Min: {parseInt(part.minStockLevel || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(part.stockLevel, part.minStockLevel)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {part.supplier_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="info" 
                                size="sm"
                                onClick={() => handleEditPart(part)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDeletePart(part.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Suppliers Section */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Suppliers</h2>
                <p className="text-gray-600">List of registered suppliers</p>
              </div>
            </div>

            {suppliersArray.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-900">No suppliers found</h3>
                <p className="mt-2 text-gray-500">There are no suppliers in the system.</p>
                <div className="mt-6">
                  <Button onClick={() => { resetSupplierForm(); setShowSupplierModal(true); }}>
                    Add Supplier
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact Person
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {suppliersArray.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{supplier.contactPerson || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{supplier.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{supplier.email || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="info" 
                                size="sm"
                                onClick={() => handleEditSupplier(supplier)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleDeleteSupplier(supplier.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Part Modal */}
      <Modal isOpen={showPartModal} onClose={() => setShowPartModal(false)} title={editingPart ? "Edit Part" : "Add New Part"} size="lg">
        <form onSubmit={handlePartSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Part Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={partFormData.name}
                onChange={handlePartInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Part Number
              </label>
              <input
                type="text"
                name="partNumber"
                id="partNumber"
                value={partFormData.partNumber}
                onChange={handlePartInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={partFormData.description}
                onChange={handlePartInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                name="price"
                id="price"
                value={partFormData.price}
                onChange={handlePartInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                step="0.01"
              />
            </div>
            <div>
              <label htmlFor="stockLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Level
              </label>
              <input
                type="number"
                name="stockLevel"
                id="stockLevel"
                value={partFormData.stockLevel}
                onChange={handlePartInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="minStockLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Stock Level
              </label>
              <input
                type="number"
                name="minStockLevel"
                id="minStockLevel"
                value={partFormData.minStockLevel}
                onChange={handlePartInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <select
                id="supplierId"
                name="supplierId"
                value={partFormData.supplierId}
                onChange={handlePartInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowPartModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingPart ? "Update Part" : "Add Part"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Supplier Modal */}
      <Modal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} title={editingSupplier ? "Edit Supplier" : "Add New Supplier"} size="lg">
        <form onSubmit={handleSupplierSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={supplierFormData.name}
                onChange={handleSupplierInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                id="contactPerson"
                value={supplierFormData.contactPerson}
                onChange={handleSupplierInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={supplierFormData.email}
                onChange={handleSupplierInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="phone"
                id="phone"
                value={supplierFormData.phone}
                onChange={handleSupplierInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={3}
                value={supplierFormData.address}
                onChange={handleSupplierInputChange}
                className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowSupplierModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingSupplier ? "Update Supplier" : "Add Supplier"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PartsManagementPage;