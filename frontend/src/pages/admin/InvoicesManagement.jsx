import React, { useState, useEffect } from 'react';
import invoiceService from '../../services/invoiceService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../../components/ConfirmationModal';

const InvoicesManagementPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]); // Store all invoices for KPI calculation

  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filter, setFilter] = useState('all');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  // Toast context
  const { showToast, addToast } = useToast();
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  


  useEffect(() => {
    loadInvoices();
    
    // Set up real-time updates
    const handleInvoiceCreated = () => {
      loadInvoices();
    };
    
    window.addEventListener('invoiceCreated', handleInvoiceCreated);
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('invoiceCreated', handleInvoiceCreated);
    };
  }, []);

  const loadInvoices = async (page = 1, currentFilter = filter) => {
    try {
      setLoading(true);
      const response = await invoiceService.getAllInvoices({ page, limit: pagination.limit, status: currentFilter === 'all' ? '' : currentFilter });
      console.log('Invoices response:', response); // Debug log
      
      // Handle different response structures
      let data = [];
      let paginationData = null;
      
      if (response.invoices && response.pagination) {
        // Paginated response
        data = response.invoices;
        paginationData = response.pagination;
      } else if (Array.isArray(response)) {
        // Array response (backward compatibility)
        data = response;
        // Calculate pagination data from array
        paginationData = {
          currentPage: 1,
          totalPages: 1,
          totalItems: response.length,
          itemsPerPage: response.length
        };
      } else {
        // Fallback
        data = response.invoices || [];
        paginationData = {
          currentPage: 1,
          totalPages: 1,
          totalItems: data.length,
          itemsPerPage: data.length
        };
      }
      
      // Debug log to see what data we have
      if (Array.isArray(data) && data.length > 0) {
        console.log('Sample invoice data:', data[0]); // Debug log
      }
      
      // Update pagination state
      if (paginationData) {
        setPagination({
          page: paginationData.currentPage,
          limit: paginationData.itemsPerPage,
          total: paginationData.totalItems,
          pages: paginationData.totalPages
        });
      }
      
      // Store all invoices for KPI calculation
      setAllInvoices(data); 
      
      // Apply filter if not 'all'
      if (currentFilter !== 'all') {
        data = data.filter(invoice => invoice.status === currentFilter);
      }
      
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
      addToast('Failed to load invoices. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load invoices when pagination or filter changes
  useEffect(() => {
    loadInvoices(pagination.page, filter);
  }, [pagination.page, filter]);

  // Recalculate filtered invoices when filter changes
  useEffect(() => {
    if (filter === 'all') {
      // Load all invoices with current pagination
      loadInvoices(pagination.page, 'all');
    } else {
      // Load filtered invoices with current pagination
      loadInvoices(pagination.page, filter);
    }
  }, [filter]);

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: 'bg-green-100 text-green-800 border border-green-200',
      unpaid: 'bg-amber-100 text-amber-800 border border-amber-200',
      overdue: 'bg-red-100 text-red-800 border border-red-200'
    };
    
    const statusText = {
      paid: 'Paid',
      unpaid: 'Unpaid',
      overdue: 'Overdue'
    };
    
    return (
      <span className={`px-3 py-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    // Handle various data types
    if (amount === null || amount === undefined) return '₹0';
    if (typeof amount === 'string') {
      const num = parseFloat(amount);
      if (isNaN(num)) return '₹0';
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
        }).format(num);
    }
    if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const viewInvoiceDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  const handlePaymentStatusUpdate = async (invoiceId, status) => {
    setConfirmationMessage(`Are you sure you want to mark this invoice as ${status}?`);
    setConfirmationAction(() => async () => {
      try {
        await invoiceService.updatePaymentStatus(invoiceId, { status: status });
        loadInvoices(); // Reload all data to update KPIs
        if (addToast) {
          addToast(`Invoice marked as ${status} successfully.`, 'success');
        } else {
          console.warn('addToast is not available');
        }
      } catch (error) {
        console.error('Error updating payment status:', error);
        if (addToast) {
          addToast('Failed to update payment status. Please try again.', 'error');
        } else {
          console.warn('addToast is not available');
        }
      }
    });
    setShowConfirmation(true);
  };
    
    
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  // Ensure invoices is always an array
  const invoicesArray = Array.isArray(invoices) ? invoices : [];
  const allInvoicesArray = Array.isArray(allInvoices) ? allInvoices : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoices Management</h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage and track all service invoices
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative rounded-lg shadow-sm w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  placeholder="Search invoices..."
                  // Add search functionality if needed
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full md:w-44 pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white transition-all duration-200"
              >
                <option value="all">All Invoices</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          {/* Stats Summary - Now calculated based on all invoices */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">{allInvoicesArray.length}</h3>
                  <p className="text-sm text-gray-500">Total Invoices</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {allInvoicesArray.filter(inv => inv.status === 'paid').length}
                  </h3>
                  <p className="text-sm text-gray-500">Paid Invoices</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-amber-100">
                  <svg className="h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {allInvoicesArray.filter(inv => inv.status === 'unpaid').length}
                  </h3>
                  <p className="text-sm text-gray-500">Pending Payment</p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          {invoicesArray.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">No invoices found</h3>
              <p className="mt-2 text-gray-500">
                {filter !== 'all' ? `There are no ${filter} invoices.` : 'There are no invoices available.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoicesArray.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-blue-600">
                            #{String(invoice.id || '').substring(0, 8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.customer_name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invoice.model || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(invoice.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusBadge(invoice.status)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-bold text-gray-900">
                            {formatCurrency(invoice.grand_total || invoice.total || invoice.amount || invoice.parts_total || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="info" 
                              size="sm"
                              onClick={() => viewInvoiceDetails(invoice)}
                            >
                              <svg className="-ml-0.5 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </Button>

                            {invoice.status !== 'paid' && (
                              <Button 
                                variant="success" 
                                size="sm"
                                onClick={() => handlePaymentStatusUpdate(invoice.id, 'paid')}
                              >
                                Mark Paid
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1}
                    className={`relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${pagination.page <= 1 ? 'cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'} cursor-pointer`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.pages}
                    className={`relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${pagination.page >= pagination.pages ? 'cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'} cursor-pointer`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> to{' '}
                      <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page <= 1}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pagination.page <= 1 ? 'cursor-not-allowed bg-gray-100' : 'bg-white hover:text-gray-500'} cursor-pointer`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        // Calculate the page numbers to show
                        let pageNum;
                        if (pagination.pages <= 5) {
                          // If total pages <= 5, show all pages
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          // If we're at the beginning, show 1, 2, 3, 4, 5
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          // If we're at the end, show last 5 pages
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          // Show current page in the middle
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                            aria-current={pagination.page === pageNum ? 'page' : undefined}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pagination.page === pageNum ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'} cursor-pointer`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                        disabled={pagination.page >= pagination.pages}
                        className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pagination.page >= pagination.pages ? 'cursor-not-allowed bg-gray-100' : 'bg-white hover:text-gray-500'} cursor-pointer`}
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

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <Modal 
          isOpen={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          title={`Invoice Details #${String(selectedInvoice.id || '').substring(0, 8)}`}
          size="md"
        >
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Invoice #{String(selectedInvoice.id || '').substring(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Created on {formatDate(selectedInvoice.created_at)}
                  </p>
                </div>
                <div className="flex items-center">
                  {getStatusBadge(selectedInvoice.status)}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Amount</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {formatCurrency(selectedInvoice.grand_total || selectedInvoice.total || selectedInvoice.amount || selectedInvoice.parts_total || 0)}
                  </p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Due Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedInvoice.created_at)}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-4">Customer Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Name</p>
                    <p className="font-medium text-gray-900">{selectedInvoice.customer_name || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-4">Vehicle Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Model</p>
                    <p className="font-medium text-gray-900">{selectedInvoice.model || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            {selectedInvoice.status !== 'paid' && (
              <Button 
                variant="success"
                onClick={() => {
                  handlePaymentStatusUpdate(selectedInvoice.id, 'paid');
                  setShowDetailsModal(false);
                }}
              >
                Mark as Paid
              </Button>
            )}
            <Button 
              variant="secondary" 
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
      

      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setConfirmationAction(null);
        }}
        onConfirm={async () => {
          if (confirmationAction) {
            await confirmationAction();
          }
          setShowConfirmation(false);
          setConfirmationAction(null);
        }}
        message={confirmationMessage}
      />
    </div>
  );
};

export default InvoicesManagementPage;