import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import invoiceService from '../../services/invoiceService';
import paymentService from '../../services/paymentService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const InvoicesPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [filter, setFilter] = useState('all'); // all, paid, unpaid

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // Pass filter options to the service
      const options = {};
      if (filter === 'paid') {
        options.status = 'paid';
      } else if (filter === 'unpaid') {
        options.status = 'unpaid';
      }
      
      const data = await invoiceService.getCustomerInvoices(user.id, options);
      // Ensure we're working with an array
      const processedData = Array.isArray(data) ? data : [];
      setInvoices(processedData);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: 'bg-emerald-100 text-emerald-800',
      unpaid: 'bg-amber-100 text-amber-800',
      overdue: 'bg-rose-100 text-rose-800'
    };
    
    const statusText = {
      paid: 'Paid',
      unpaid: 'Unpaid',
      overdue: 'Overdue'
    };
    
    const statusIcons = {
      paid: (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      unpaid: (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      overdue: (
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusIcons[status] || (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
        {statusText[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    // Handle potential null or undefined dates
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    // Handle potential NaN or invalid amounts
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
      return '₹0.00';
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(numericAmount);
  };

  const viewInvoiceDetails = async (invoice) => {
    try {
      // Get detailed invoice information
      const detailedInvoice = await invoiceService.getInvoiceById(invoice.id);
      setSelectedInvoice(detailedInvoice);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error loading invoice details:', error);
      alert('Failed to load invoice details. Please try again.');
    }
  };

  const handlePayment = async (invoice) => {
    if (window.confirm(`Are you sure you want to pay ${formatCurrency(invoice.grand_total || invoice.totalAmount)} for this invoice?`)) {
      try {
        setProcessingPayment(true);
        
        // Process payment using the mock payment service
        const paymentData = {
          invoiceId: invoice.id,
          amount: invoice.grand_total || invoice.totalAmount,
          method: 'card' // Default to card payment
        };
        
        const result = await paymentService.mockPayment(paymentData);
        
        if (result.success) {
          alert('Payment processed successfully!');
          // Reload invoices to reflect the updated status
          loadInvoices();
        } else {
          alert('Payment failed. Please try again.');
        }
      } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed. Please try again.');
      } finally {
        setProcessingPayment(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Invoices</h1>
              <p className="mt-2 text-gray-600">View and manage your service invoices</p>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                All Invoices
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'paid' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                Paid
              </button>
              <button
                onClick={() => setFilter('unpaid')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'unpaid' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                Unpaid
              </button>
            </div>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center border border-gray-100 transition-all duration-300 hover:shadow-md">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100">
              <svg className="h-12 w-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-6 text-2xl font-bold text-gray-900">No invoices found</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">Invoices will appear here after your services are completed. Check back later or contact support if you believe this is an error.</p>
            <div className="mt-8">
              <Button 
                onClick={loadInvoices}
                className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Invoices
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Invoice #{String(invoice.id || '').substring(0, 8)}
                      </h3>
                      <div className="mt-2">
                        {getStatusBadge(invoice.status || invoice.paymentStatus)}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex items-center">
                      <div className="bg-gray-100 rounded-lg p-2 mr-3">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Vehicle</p>
                        <p className="font-medium text-gray-900">
                          {invoice.vehicle?.make || invoice.make} {invoice.vehicle?.model || invoice.model}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">Due Date</p>
                      <div className="flex items-center mt-1">
                        <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-medium text-gray-900">
                          {formatDate(invoice.dueDate || invoice.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-sm">Issued</p>
                      <div className="flex items-center mt-1">
                        <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium text-gray-900">
                          {formatDate(invoice.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(invoice.grand_total || invoice.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 pb-6">
                  <div className="flex space-x-3">
                    <Button 
                      variant="secondary" 
                      size="medium"
                      onClick={() => viewInvoiceDetails(invoice)}
                      className="flex-1 justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-none min-w-[120px]"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </Button>
                    {(invoice.status !== 'paid' && invoice.paymentStatus !== 'paid') && (
                      <Button 
                        size="medium"
                        className="flex-1 px-4 py-2 rounded-lg justify-center min-w-[120px]"
                        onClick={() => handlePayment(invoice)}
                        disabled={processingPayment}
                      >
                        {processingPayment ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Pay Now
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <Modal 
          isOpen={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          title={`Invoice #${String(selectedInvoice.invoice.id || '').substring(0, 8)}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-2">
                  {getStatusBadge(selectedInvoice.invoice.status || selectedInvoice.invoice.paymentStatus)}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(selectedInvoice.invoice.grand_total || selectedInvoice.invoice.totalAmount)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-500">Labor Cost</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatCurrency(selectedInvoice.invoice.labor_total || 0)}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-500">Parts Cost</h3>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatCurrency(selectedInvoice.invoice.parts_total || 0)}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-500">Vehicle Information</h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Model</p>
                  <p className="font-medium text-gray-900">
                    {selectedInvoice.invoice.model || selectedInvoice.invoice.vehicle?.model || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">VIN</p>
                  <p className="font-medium text-gray-900">
                    {selectedInvoice.invoice.vin || selectedInvoice.invoice.vehicle?.vin || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
              <div className="mt-2">
                <p className="font-medium text-gray-900">
                  {selectedInvoice.invoice.customer_name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedInvoice.invoice.customer_email}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-500">Invoice Dates</h3>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500">Issued Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedInvoice.invoice.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(selectedInvoice.invoice.dueDate || selectedInvoice.invoice.created_at)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Tasks */}
            {selectedInvoice.tasks && selectedInvoice.tasks.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-500">Tasks Performed</h3>
                <div className="mt-3 space-y-3">
                  {selectedInvoice.tasks.map((task) => (
                    <div key={task.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <span className="font-medium text-gray-900">{task.task_name}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(task.task_cost)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                  <span className="font-medium text-gray-900">Total Labor Cost</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(selectedInvoice.tasks.reduce((sum, task) => sum + (parseFloat(task.task_cost) || 0), 0))}
                  </span>
                </div>
              </div>
            )}
            
            {/* Parts */}
            {selectedInvoice.parts && selectedInvoice.parts.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-500">Parts Used</h3>
                <div className="mt-3 space-y-3">
                  {selectedInvoice.parts.map((part) => (
                    <div key={part.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <span className="font-medium text-gray-900">{part.part_name}</span>
                        <span className="block text-xs text-gray-500">#{part.part_number}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(part.total_price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                  <span className="font-medium text-gray-900">Total Parts Cost</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(selectedInvoice.parts.reduce((sum, part) => sum + (parseFloat(part.total_price) || 0), 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button 
              onClick={() => setShowDetailsModal(false)}
              className="px-6 py-2.5"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InvoicesPage;