import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import partsService from '../../services/partsService';
import Button from '../../components/Button';
import { formatCurrency } from '../../utils/currencyFormatter';

const PartsUsagePage = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSupplierPage, setCurrentSupplierPage] = useState(1);
  const itemsPerPage = 5; // Adjust as needed

  useEffect(() => {
    loadPartsData();
    loadSuppliers();
    
    // Reset to first page when filters change
    setCurrentPage(1);
    setCurrentSupplierPage(1);
  }, [showLowStock]);

  const filteredParts = parts.filter(part => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      part.name?.toLowerCase().includes(term) ||
      part.partNumber?.toLowerCase().includes(term) ||
      part.description?.toLowerCase().includes(term)
    );
  });
  
  // Parts pagination calculations
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParts = filteredParts.slice(startIndex, startIndex + itemsPerPage);
  
  // Suppliers pagination calculations
  const totalSupplierPages = Math.ceil(suppliers.length / itemsPerPage);
  const startSupplierIndex = (currentSupplierPage - 1) * itemsPerPage;
  const paginatedSuppliers = suppliers.slice(startSupplierIndex, startSupplierIndex + itemsPerPage);

  const loadPartsData = async () => {
    try {
      setLoading(true);
      let response;
      
      if (showLowStock) {
        response = await partsService.getLowStockParts();
      } else {
        response = await partsService.getAllParts();
      }
      
      // Handle both paginated and non-paginated responses
      let partsData = [];
      if (Array.isArray(response)) {
        // Direct array response (backward compatibility)
        partsData = response;
      } else if (response && response.parts) {
        // Paginated response
        partsData = response.parts;
      }
      
      // Map backend field names to frontend expected names
      const mappedData = partsData.map(part => ({
        ...part,
        partNumber: part.part_number || part.partNumber || '',
        stockLevel: part.quantity !== undefined ? part.quantity : (part.stockLevel || 0),
        minStockLevel: part.reorder_level !== undefined ? part.reorder_level : (part.minStockLevel || 0),
        price: part.price || 0,
        supplier_id: part.supplier_id || null
      }));
      
      setParts(mappedData);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await partsService.getAllSuppliers();
      
      // Handle both paginated and non-paginated responses
      let suppliersData = [];
      if (Array.isArray(response)) {
        // Direct array response (backward compatibility)
        suppliersData = response;
      } else if (response && response.suppliers) {
        // Paginated response
        suppliersData = response.suppliers;
      }
      
      // Map backend field names to frontend expected names if needed
      const mappedData = suppliersData.map(supplier => ({
        ...supplier,
        contactPerson: supplier.contact_person || supplier.contactPerson || ''
      }));
      
      setSuppliers(mappedData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <button 
                  onClick={() => navigate('/mechanic/dashboard')}
                  className="flex items-center text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border border-blue-300 mb-2 md:mb-0"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </button>
              </div>
              <div className="text-center md:text-center flex-1 md:mx-auto">
                <h1 className="text-3xl font-bold text-gray-900">Parts Inventory</h1>
                <p className="mt-2 text-gray-600">Browse and view spare parts inventory</p>
              </div>
            </div>
          </div>
          
          {/* Parts Management Section */}
          <div className="bg-white rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Parts Management</h2>
                  <p className="mt-1 text-gray-600">View available spare parts</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search parts..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Reset to first page when search term changes
                        setCurrentPage(1);
                        setCurrentSupplierPage(1);
                      }}
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
            </div>
            
            {filteredParts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-900">No parts found</h3>
                <p className="mt-2 text-gray-500">There are no parts matching your current filter.</p>
              </div>
            ) : (
              <div>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedParts.map((part) => (
                        <tr key={part.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {part.name}
                            </div>
                            {part.description && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {part.description}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {part.partNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(part.price)}
                            </div>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === totalPages 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(startIndex + itemsPerPage, filteredParts.length)}
                          </span>{' '}
                          of <span className="font-medium">{filteredParts.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-semibold ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-900 hover:bg-gray-50 cursor-pointer border border-gray-300'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            &larr;
                          </button>
                          
                          {/* Page numbers */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentPage === pageNumber
                                  ? 'z-10 bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 cursor-pointer border'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-semibold ${
                              currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-900 hover:bg-gray-50 cursor-pointer border border-gray-300'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            &rarr;
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Suppliers Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl font-bold text-gray-900">Suppliers</h2>
              <p className="mt-1 text-gray-600">List of registered suppliers</p>
            </div>
            
            {suppliers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-900">No suppliers found</h3>
                <p className="mt-2 text-gray-500">There are no suppliers in the system.</p>
              </div>
            ) : (
              <div>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {supplier.contactPerson || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {supplier.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {supplier.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Suppliers Pagination Controls */}
                {totalSupplierPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 mt-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentSupplierPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentSupplierPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentSupplierPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentSupplierPage(prev => Math.min(prev + 1, totalSupplierPages))}
                        disabled={currentSupplierPage === totalSupplierPages}
                        className={`relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentSupplierPage === totalSupplierPages 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startSupplierIndex + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(startSupplierIndex + itemsPerPage, suppliers.length)}
                          </span>{' '}
                          of <span className="font-medium">{suppliers.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentSupplierPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentSupplierPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-semibold ${
                              currentSupplierPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-900 hover:bg-gray-50 cursor-pointer border border-gray-300'
                            }`}
                          >
                            <span className="sr-only">Previous</span>
                            &larr;
                          </button>
                          
                          {/* Supplier Page numbers */}
                          {Array.from({ length: totalSupplierPages }, (_, i) => i + 1).map(pageNumber => (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentSupplierPage(pageNumber)}
                              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                currentSupplierPage === pageNumber
                                  ? 'z-10 bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 cursor-pointer border'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => setCurrentSupplierPage(prev => Math.min(prev + 1, totalSupplierPages))}
                            disabled={currentSupplierPage === totalSupplierPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-semibold ${
                              currentSupplierPage === totalSupplierPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-900 hover:bg-gray-50 cursor-pointer border border-gray-300'
                            }`}
                          >
                            <span className="sr-only">Next</span>
                            &rarr;
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartsUsagePage;