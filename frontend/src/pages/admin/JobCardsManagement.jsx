import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import jobcardService from '../../services/jobcardService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';

const JobCardsManagementPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    loadJobCards();
  }, [pagination.page, pagination.limit]);
  
  // Reset to page 1 when filter changes and reload data
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    if (!loading) {  // Only reload if not already loading
      loadJobCards();
    }
  }, [filterStatus]);

  const loadJobCards = async () => {
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
      
      const response = await jobcardService.getAllJobCards(params);
      
      // Handle different response formats
      let jobCardsData = [];
      let paginationData = null;
      
      if (Array.isArray(response)) {
        // If response is an array (old format), no pagination
        jobCardsData = response;
        paginationData = null;
      } else {
        // If response is an object, expect jobCards and pagination
        jobCardsData = response?.jobCards || response?.jobcards || [];
        paginationData = response?.pagination || null;
      }
      
      setJobCards(jobCardsData);
      
      if (paginationData) {
        // Update pagination with filtered data counts
        setPagination({
          page: paginationData.currentPage,
          limit: paginationData.itemsPerPage,
          total: paginationData.totalItems,
          pages: paginationData.totalPages
        });
      } else {
        // Fallback: if no pagination data, assume all data returned
        setPagination(prev => ({
          ...prev,
          total: jobCardsData.length,
          pages: jobCardsData.length > 0 ? 1 : 1 // At least 1 page if there are job cards
        }));
      }
    } catch (error) {
      console.error('Error loading job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    const statusText = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    
    const priorityText = {
      low: 'Low',
      medium: 'Medium',
      high: 'High'
    };
    
    return (
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityClasses[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priorityText[priority] || priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const viewJobCardDetails = (jobCard) => {
    setSelectedJobCard(jobCard);
    setShowDetailsModal(true);
  };

  const handleDelete = async (jobCardId) => {
    setConfirmationMessage('Are you sure you want to delete this job card? This action cannot be undone.');
    setConfirmationAction(() => async () => {
      try {
        await jobcardService.deleteJobCard(jobCardId);
        loadJobCards();
        showToast.success('Job card deleted successfully!');
      } catch (error) {
        console.error('Error deleting job card:', error);
        showToast.error('Failed to delete job card. Please try again.');
      }
    });
    setShowConfirmation(true);
  };

  // Ensure jobCards is always an array
  const jobCardsArray = Array.isArray(jobCards) ? jobCards : [];
  
  // Use the job cards as received from the backend since filtering is done server-side
  const filteredJobCards = jobCardsArray;

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
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
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
              <h1 className="text-3xl font-bold text-gray-900">Job Cards Management</h1>
              <p className="mt-2 text-lg text-gray-600">Manage and track all job cards</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium text-gray-700">Filter by Status:</span>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {filteredJobCards.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">No job cards found</h3>
              <p className="mt-2 text-gray-500">
                {filterStatus !== 'all' 
                  ? `There are no job cards with status "${filterStatus === 'in_progress' ? 'In Progress' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}".`
                  : 'There are no job cards in the system.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <ul className="divide-y divide-gray-200">
                {filteredJobCards.map((jobCard) => (
                  <li key={jobCard.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <div className="px-6 py-5">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">#{jobCard.id || 'N/A'}</span>
                          </div>
                          <div className="ml-4">
                            <p className="text-lg font-bold text-gray-900">Job Card #{jobCard.id || 'N/A'}</p>
                            <p className="text-sm text-gray-500 mt-1">Created: {jobCard.created_at ? formatDate(jobCard.created_at) : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(jobCard.status)}
                          {getPriorityBadge(jobCard.priority)}
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Customer</h4>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {jobCard.customer_name ? jobCard.customer_name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                            <p className="ml-2 text-sm font-medium text-gray-900 truncate">
                              {jobCard.customer_name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vehicle</h4>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="ml-2 text-sm font-medium text-gray-900 truncate">
                              {jobCard.model || '(N/A)'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Assigned To</h4>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <p className="ml-2 text-sm font-medium text-gray-900 truncate">
                              {jobCard.mechanic_name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-5 flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3 pt-4 border-t border-gray-100">
                        <div className="flex space-x-2">
                          <Button 
                            variant="info" 
                            size="sm"
                            onClick={() => viewJobCardDetails(jobCard)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDelete(jobCard.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                disabled={pagination.page <= 1}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${pagination.page <= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'}`}
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.pages) }))}
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
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                    disabled={pagination.page <= 1}
                    className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pagination.page <= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {(() => {
                    const delta = 2;
                    const range = [];
                    const rangeWithDots = [];
                    
                    for (let i = Math.max(1, pagination.page - delta); i <= Math.min(pagination.pages, pagination.page + delta); i++) {
                      range.push(i);
                    }
                    
                    if (range[0] > 1) {
                      rangeWithDots.push(1);
                      if (range[0] > 2) {
                        rangeWithDots.push('...');
                      }
                    }
                    
                    rangeWithDots.push(...range);
                    
                    if (rangeWithDots[rangeWithDots.length - 1] < pagination.pages) {
                      if (rangeWithDots[rangeWithDots.length - 1] < pagination.pages - 1) {
                        rangeWithDots.push('...');
                      }
                      rangeWithDots.push(pagination.pages);
                    }
                    
                    return rangeWithDots.map((pageNum, index) => (
                      typeof pageNum === 'number' ? (
                        <button
                          key={pageNum}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pagination.page === pageNum ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer'}`}
                        >
                          {pageNum}
                        </button>
                      ) : (
                        <span
                          key={`dots-${index}`}
                          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700"
                        >
                          ...
                        </span>
                      )
                    ));
                  })()}
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, pagination.pages) }))}
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
      </div>

      {/* Job Card Details Modal */}
      {selectedJobCard && (
        <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={`Job Card #${selectedJobCard?.id || 'N/A'}`} size="lg">
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-base font-bold text-gray-900 mb-4">Job Card Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <span className="text-sm font-medium">{getStatusBadge(selectedJobCard.status)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Priority</span>
                    <span className="text-sm font-medium">{getPriorityBadge(selectedJobCard.priority)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Created At</span>
                    <span className="text-sm font-medium text-gray-900">{selectedJobCard.created_at ? formatDate(selectedJobCard.created_at) : 'N/A'}</span>
                  </div>
                </div>
              </div>
                    
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-base font-bold text-gray-900 mb-4">Assignment</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-1">Customer</span>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {selectedJobCard.customer_name ? selectedJobCard.customer_name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{selectedJobCard.customer_name || 'N/A'}</span>
                    </div>
                  </div>
                        
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-1">Vehicle</span>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {selectedJobCard.model || '(N/A)'}
                      </span>
                    </div>
                  </div>
                        
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-1">Assigned Mechanic</span>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{selectedJobCard.mechanic_name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <Button variant="danger" onClick={() => setShowDetailsModal(false)}>
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

export default JobCardsManagementPage;