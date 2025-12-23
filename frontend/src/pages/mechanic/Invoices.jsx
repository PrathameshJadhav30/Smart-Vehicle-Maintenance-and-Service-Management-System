import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import invoiceService from '../../services/invoiceService';
import jobcardService from '../../services/jobcardService';
import partsService from '../../services/partsService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';

const MechanicInvoicesPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filter, setFilter] = useState('all');
  const [jobCardDetails, setJobCardDetails] = useState({});
  const [parts, setParts] = useState([]);
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Adjust as needed
  
  // Edit cost estimation modal state
  const [showEditCostModal, setShowEditCostModal] = useState(false);
  const [editingJobCardId, setEditingJobCardId] = useState(null);
  const [costEstimationData, setCostEstimationData] = useState({
    tasks: [{ task_name: '', task_cost: '' }],
    parts: [{ part_id: '', quantity: '' }]
  });

  useEffect(() => {
    loadInvoices();
    loadParts();
  }, [filter, user.id]);
  
  const loadParts = async () => {
    try {
      const data = await partsService.getAllParts();
      setParts(data);
    } catch (error) {
      console.error('Error loading parts:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // Get only invoices related to the mechanic's job cards
      let data = await invoiceService.getMechanicInvoices(user.id);
      
      // Filter by payment status if needed
      if (filter !== 'all') {
        data = data.filter(invoice => invoice.status === filter);
      }
      
      setInvoices(data);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobCardDetails = async (jobCardId) => {
    try {
      const details = await jobcardService.getJobCardById(jobCardId);
      setJobCardDetails(prev => ({
        ...prev,
        [jobCardId]: details
      }));
    } catch (error) {
      console.error('Error loading job card details:', error);
    }
  };
  
  // Added functions for cost estimation
  const addTaskField = () => {
    setCostEstimationData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { task_name: '', task_cost: '' }]
    }));
  };

  const addPartField = () => {
    setCostEstimationData(prev => ({
      ...prev,
      parts: [...prev.parts, { part_id: '', quantity: '' }]
    }));
  };

  const updateTaskField = (index, field, value) => {
    const updatedTasks = [...costEstimationData.tasks];
    updatedTasks[index][field] = value;
    setCostEstimationData(prev => ({
      ...prev,
      tasks: updatedTasks
    }));
  };

  const updatePartField = (index, field, value) => {
    const updatedParts = [...costEstimationData.parts];
    updatedParts[index][field] = value;
    setCostEstimationData(prev => ({
      ...prev,
      parts: updatedParts
    }));
  };

  const removeTaskField = (index) => {
    if (costEstimationData.tasks.length > 1) {
      const updatedTasks = [...costEstimationData.tasks];
      updatedTasks.splice(index, 1);
      setCostEstimationData(prev => ({
        ...prev,
        tasks: updatedTasks
      }));
    }
  };

  const removePartField = (index) => {
    if (costEstimationData.parts.length > 1) {
      const updatedParts = [...costEstimationData.parts];
      updatedParts.splice(index, 1);
      setCostEstimationData(prev => ({
        ...prev,
        parts: updatedParts
      }));
    }
  };

  const handleSaveCostEstimation = async () => {
    try {
      // Add all tasks
      for (const task of costEstimationData.tasks) {
        if (task.task_name && task.task_cost) {
          await jobcardService.addTaskToJobCard(editingJobCardId, task);
        }
      }
      
      // Add all parts
      for (const part of costEstimationData.parts) {
        if (part.part_id && part.quantity) {
          // Create the part object with the correct structure
          const partData = {
            part_id: part.part_id,
            quantity: parseInt(part.quantity)
          };
          await jobcardService.addSparePartToJobCard(editingJobCardId, partData);
        }
      }
      
      setShowEditCostModal(false);
      loadInvoices(); // Refresh the list
      loadJobCardDetails(editingJobCardId); // Refresh job card details
      showToast.success('Cost estimation saved successfully!');
    } catch (error) {
      console.error('Error saving cost estimation:', error);
      showToast.error('Failed to save cost estimation. Please try again.');
    }
  };
  
  const openEditCostModal = (jobCardId) => {
    setEditingJobCardId(jobCardId);
    
    // Load existing tasks and parts if available
    const jobCardData = jobCardDetails[jobCardId];
    if (jobCardData) {
      const tasks = jobCardData.tasks && jobCardData.tasks.length > 0 
        ? jobCardData.tasks.map(task => ({
            task_name: task.task_name,
            task_cost: task.task_cost
          }))
        : [{ task_name: '', task_cost: '' }];
          
      const parts = jobCardData.parts && jobCardData.parts.length > 0 
        ? jobCardData.parts.map(part => ({
            part_id: part.part_id,
            quantity: part.quantity
          }))
        : [{ part_id: '', quantity: '' }];
          
      setCostEstimationData({
        tasks,
        parts
      });
    } else {
      setCostEstimationData({
        tasks: [{ task_name: '', task_cost: '' }],
        parts: [{ part_id: '', quantity: '' }]
      });
    }
    
    setShowEditCostModal(true);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      unpaid: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    const statusText = {
      unpaid: 'Unpaid',
      paid: 'Paid',
      cancelled: 'Cancelled'
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const viewInvoiceDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
    
    // Load job card details if not already loaded
    if (invoice.jobcard_id && !jobCardDetails[invoice.jobcard_id]) {
      loadJobCardDetails(invoice.jobcard_id);
    }
  };

  const handlePaymentStatusUpdate = async (invoiceId, status) => {
    setConfirmationAction(() => async () => {
      try {
        await invoiceService.updatePaymentStatus(invoiceId, { status, payment_method: 'cash' });
        loadInvoices();
        showToast.success(`Invoice marked as ${status} successfully!`);
      } catch (error) {
        console.error('Error updating payment status:', error);
        showToast.error('Failed to update payment status. Please try again.');
      }
    });
    
    setShowConfirmation(true);
  };

  const handleConfirmationAction = () => {
    if (confirmationAction) {
      confirmationAction();
    }
    setShowConfirmation(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Ensure invoices is always an array
  const invoicesArray = Array.isArray(invoices) ? invoices : [];
  
  // Pagination calculations
  const totalPages = Math.ceil(invoicesArray.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = invoicesArray.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
              <p className="mt-1 text-base sm:text-lg text-gray-600">Manage and track service invoices</p>
            </div>
            <div className="w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full block pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white shadow-sm"
              >
                <option value="all">All Invoices</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {invoicesArray.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 rounded-full p-4 inline-flex">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {filter === 'all' 
                ? "You don't have any invoices right now. Invoices will appear here once job cards are completed."
                : `You don't have any ${filter} invoices. Try changing the filter.`}
            </p>
            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={loadInvoices}
                className="inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </Button>
            </div>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">#{String(invoice.id || '').substring(0, 3)}</span>
                      </div>
                      <div className="ml-3 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Invoice #{String(invoice.id || '').substring(0, 8)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(invoice.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start text-sm text-gray-600">
                      <svg className="flex-shrink-0 mr-2 mt-0.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{invoice.customer_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-start text-sm text-gray-600">
                      <svg className="flex-shrink-0 mr-2 mt-0.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{invoice.model || ''} {invoice.vin ? `(${invoice.vin})` : ''}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(invoice.grand_total)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      variant="primary" 
                      size="small"
                      onClick={() => viewInvoiceDetails(invoice)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    {invoice.status !== 'paid' && (
                      <Button 
                        variant="success" 
                        size="small"
                        onClick={() => handlePaymentStatusUpdate(invoice.id, 'paid')}
                        className="flex-1"
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                      {Math.min(startIndex + itemsPerPage, invoicesArray.length)}
                    </span>{' '}
                    of <span className="font-medium">{invoicesArray.length}</span> results
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
          </>
        )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <Modal 
          isOpen={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          title={`Invoice #${String(selectedInvoice.id || '').substring(0, 8)}`}
        >
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
                  <div className="mt-1">
                    {getStatusBadge(selectedInvoice.status)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(selectedInvoice.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                  <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">
                    {formatCurrency(selectedInvoice.grand_total)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Job Card</h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">#{String(selectedInvoice.jobcard_id || '').substring(0, 8)}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Labor Cost</h3>
                <p className="mt-1 text-base sm:text-lg font-medium text-gray-900">
                  {formatCurrency(selectedInvoice.labor_total)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Parts Cost</h3>
                <p className="mt-1 text-base sm:text-lg font-medium text-gray-900">
                  {formatCurrency(selectedInvoice.parts_total)}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">Customer Information</h3>
              <div className="flex flex-col sm:flex-row items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-700 font-bold">
                    {selectedInvoice.customer_name ? selectedInvoice.customer_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedInvoice.customer_name || 'N/A'}
                  </p>
                  {selectedInvoice.customer_email && (
                    <p className="mt-1 text-sm text-gray-500">{selectedInvoice.customer_email}</p>
                  )}
                  {selectedInvoice.customer_phone && (
                    <p className="mt-1 text-sm text-gray-500">{selectedInvoice.customer_phone}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-base font-medium text-gray-900 mb-3">Vehicle Information</h3>
              <div className="flex flex-col sm:flex-row items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="mt-2 sm:mt-0 sm:ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedInvoice.model} {selectedInvoice.year ? `(${selectedInvoice.year})` : ''}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Job Card Details */}
            {jobCardDetails[selectedInvoice.jobcard_id] && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-purple-800">Job Card Details</h3>
                  {selectedInvoice.status === 'unpaid' && (
                    <Button 
                      variant="primary"
                      size="small"
                      onClick={() => openEditCostModal(selectedInvoice.jobcard_id)}
                      className="text-xs px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      Edit Cost Estimation
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Mechanic:</span> <span className="text-gray-900">{jobCardDetails[selectedInvoice.jobcard_id].jobcard?.mechanic_name || 'N/A'}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Status:</span> <span className="text-gray-900">{jobCardDetails[selectedInvoice.jobcard_id].jobcard?.status || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                
                {/* Tasks */}
                {jobCardDetails[selectedInvoice.jobcard_id].tasks?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-100">
                    <h4 className="text-md font-medium text-purple-700 mb-2">Tasks</h4>
                    <div className="space-y-2">
                      {jobCardDetails[selectedInvoice.jobcard_id].tasks.map(task => (
                        <div key={task.id} className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                          <span className="text-sm text-gray-700">{task.task_name}</span>
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(task.task_cost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Parts */}
                {jobCardDetails[selectedInvoice.jobcard_id]?.parts?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-100">
                    <h4 className="text-md font-medium text-purple-700 mb-2">Parts Used</h4>
                    <div className="space-y-2">
                      {jobCardDetails[selectedInvoice.jobcard_id].parts.map(part => {
                        // Find the part details from the parts list to get the name and number
                        const partDetails = parts.find(p => p.id === part.part_id);
                        return (
                          <div key={part.id} className="flex justify-between items-center py-2 px-3 bg-white rounded-lg">
                            <span className="text-sm text-gray-700">{partDetails?.part_name || 'N/A'} ({partDetails?.part_number || 'N/A'}) x {part.quantity}</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(part.total_price)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Edit Cost Estimation Modal */}
            {showEditCostModal && (
              <Modal 
                isOpen={showEditCostModal} 
                onClose={() => setShowEditCostModal(false)} 
                title={`Edit Cost Estimation for Job Card #${String(editingJobCardId || '').substring(0, 8)}`}
                size="large"
              >
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Labor Costs</h3>
                    {costEstimationData.tasks.map((task, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 mb-3">
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={task.task_name}
                            onChange={(e) => updateTaskField(index, 'task_name', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Task name"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="number"
                            value={task.task_cost}
                            onChange={(e) => updateTaskField(index, 'task_cost', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Cost"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-2 flex space-x-2">
                          {costEstimationData.tasks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTaskField(index)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addTaskField}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Another Task
                    </button>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Parts Costs</h3>
                    {costEstimationData.parts.map((part, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 mb-3">
                        <div className="col-span-5">
                          <select
                            value={part.part_id}
                            onChange={(e) => updatePartField(index, 'part_id', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select a part</option>
                            {parts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.part_name} ({p.part_number}) - {(typeof p.price === 'number' ? p.price : parseFloat(p.price || 0)).toFixed(2)} (Stock: {p.quantity})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-5">
                          <input
                            type="number"
                            value={part.quantity}
                            onChange={(e) => updatePartField(index, 'quantity', e.target.value)}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Quantity"
                            min="1"
                          />
                        </div>
                        <div className="col-span-2 flex space-x-2">
                          {costEstimationData.parts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePartField(index)}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addPartField}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Another Part
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowEditCostModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleSaveCostEstimation}
                  >
                    Save Cost Estimation
                  </Button>
                </div>
              </Modal>
            )}
          </div>
          
          <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-2">
            <Button 
              onClick={() => setShowDetailsModal(false)}
              className="px-6 py-2"
            >
              Close
            </Button>
            {selectedInvoice.status !== 'paid' && (
              <Button 
                variant="success"
                onClick={() => {
                  setConfirmationAction(() => async () => {
                    try {
                      await invoiceService.updatePaymentStatus(selectedInvoice.id, { status: 'paid', payment_method: 'cash' });
                      loadInvoices();
                      showToast.success('Invoice marked as paid successfully!');
                      setShowDetailsModal(false);
                    } catch (error) {
                      console.error('Error updating payment status:', error);
                      showToast.error('Failed to update payment status. Please try again.');
                    }
                  });
                                    
                  setShowConfirmation(true);
                }}
                className="px-6 py-2"
              >
                Mark as Paid
              </Button>
            )}
          </div>
        </Modal>
      )}
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmationAction}
        title="Confirm Action"
        message="Are you sure you want to mark this invoice as paid?"
      />
      
      </div>
    </div>
  );
};

export default MechanicInvoicesPage;