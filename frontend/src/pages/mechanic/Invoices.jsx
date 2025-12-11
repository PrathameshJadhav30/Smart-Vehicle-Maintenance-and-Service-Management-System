import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import invoiceService from '../../services/invoiceService';
import jobcardService from '../../services/jobcardService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const MechanicInvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filter, setFilter] = useState('all');
  const [jobCardDetails, setJobCardDetails] = useState({});

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // Get all invoices (mechanics can view all invoices)
      let data = await invoiceService.getAllInvoices();
      
      // Filter by payment status if needed
      if (filter !== 'all') {
        data = data.filter(invoice => invoice.status === filter);
      }
      
      setInvoices(data);
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
    if (window.confirm(`Are you sure you want to mark this invoice as ${status}?`)) {
      try {
        await invoiceService.updatePaymentStatus(invoiceId, { status, payment_method: 'cash' });
        loadInvoices();
        alert(`Invoice marked as ${status} successfully!`);
      } catch (error) {
        console.error('Error updating payment status:', error);
        alert('Failed to update payment status. Please try again.');
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

  // Ensure invoices is always an array
  const invoicesArray = Array.isArray(invoices) ? invoices : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <div className="flex space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Invoices</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {invoicesArray.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-gray-500">There are no invoices matching your current filter.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {invoicesArray.map((invoice) => (
                  <li key={invoice.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          Invoice #{String(invoice.id || '').substring(0, 8)}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Customer: {invoice.customer?.name || 'N/A'}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            Vehicle: {invoice.jobCard?.vehicle?.make} {invoice.jobCard?.vehicle?.model}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>
                            Created: {formatDate(invoice.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(invoice.grand_total)}
                        </p>
                        <div className="flex space-x-2">
                          <Button 
                            variant="secondary" 
                            size="small"
                            onClick={() => viewInvoiceDetails(invoice)}
                          >
                            View Details
                          </Button>
                          {invoice.status !== 'paid' && (
                            <Button 
                              variant="success" 
                              size="small"
                              onClick={() => handlePaymentStatusUpdate(invoice.id, 'paid')}
                            >
                              Mark as Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <Modal 
          isOpen={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          title={`Invoice #${String(selectedInvoice.id || '').substring(0, 8)}`}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
              <p className="mt-1 text-sm text-gray-900">{getStatusBadge(selectedInvoice.status)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="mt-1 text-sm text-gray-900 text-lg font-bold">
                {formatCurrency(selectedInvoice.grand_total)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Labor Cost</h3>
              <p className="mt-1 text-sm text-gray-900">
                {formatCurrency(selectedInvoice.labor_total)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Parts Cost</h3>
              <p className="mt-1 text-sm text-gray-900">
                {formatCurrency(selectedInvoice.parts_total)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedInvoice.customer?.name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer Email</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedInvoice.customer?.email || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer Phone</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedInvoice.customer?.phone || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vehicle</h3>
              <p className="mt-1 text-sm text-gray-900">
                {selectedInvoice.jobCard?.vehicle?.make} {selectedInvoice.jobCard?.vehicle?.model} ({selectedInvoice.jobCard?.vehicle?.year})
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Job Card</h3>
              <p className="mt-1 text-sm text-gray-900">#{String(selectedInvoice.jobcard_id || '').substring(0, 8)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1 text-sm text-gray-900">{formatDate(selectedInvoice.created_at)}</p>
            </div>
            
            {/* Job Card Details */}
            {jobCardDetails[selectedInvoice.jobcard_id] && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500">Job Card Details</h3>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Mechanic:</span> {jobCardDetails[selectedInvoice.jobcard_id].jobcard?.mechanic_name || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Status:</span> {jobCardDetails[selectedInvoice.jobcard_id].jobcard?.status || 'N/A'}
                  </p>
                  {jobCardDetails[selectedInvoice.jobcard_id].jobcard?.percent_complete && (
                    <p className="text-sm">
                      <span className="font-medium">Progress:</span> {jobCardDetails[selectedInvoice.jobcard_id].jobcard.percent_complete}%
                    </p>
                  )}
                  
                  {/* Tasks */}
                  {jobCardDetails[selectedInvoice.jobcard_id].tasks?.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-500">Tasks</h4>
                      <ul className="mt-1 space-y-1">
                        {jobCardDetails[selectedInvoice.jobcard_id].tasks.map(task => (
                          <li key={task.id} className="text-sm flex justify-between">
                            <span>{task.task_name}</span>
                            <span>{formatCurrency(task.task_cost)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Parts */}
                  {jobCardDetails[selectedInvoice.jobcard_id].parts?.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-500">Parts Used</h4>
                      <ul className="mt-1 space-y-1">
                        {jobCardDetails[selectedInvoice.jobcard_id].parts.map(part => (
                          <li key={part.id} className="text-sm flex justify-between">
                            <span>{part.part_name} ({part.part_number}) x {part.quantity}</span>
                            <span>{formatCurrency(part.total_price)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
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
            <Button onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MechanicInvoicesPage;