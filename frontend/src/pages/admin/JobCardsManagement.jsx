import React, { useState, useEffect } from 'react';
import jobcardService from '../../services/jobcardService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const JobCardsManagementPage = () => {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadJobCards();
  }, []);

  const loadJobCards = async () => {
    try {
      setLoading(true);
      const data = await jobcardService.getAllJobCards();
      setJobCards(data);
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
    if (window.confirm('Are you sure you want to delete this job card? This action cannot be undone.')) {
      try {
        await jobcardService.deleteJobCard(jobCardId);
        loadJobCards();
      } catch (error) {
        console.error('Error deleting job card:', error);
        alert('Failed to delete job card. Please try again.');
      }
    }
  };

  // Ensure jobCards is always an array
  const jobCardsArray = Array.isArray(jobCards) ? jobCards : [];
  
  // Filter job cards based on status
  const filteredJobCards = jobCardsArray.filter(jobCard => {
    if (filterStatus === 'all') return true;
    return jobCard.status === filterStatus;
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
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Cards Management</h1>
              <p className="mt-2 text-lg text-gray-600">Manage and track all job cards</p>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="mb-6 flex flex-wrap gap-3">
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

          {filteredJobCards.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">No job cards found</h3>
              <p className="mt-2 text-gray-500">
                {filterStatus === 'all' 
                  ? 'There are no job cards in the system.' 
                  : `There are no job cards with status "${filterStatus === 'in_progress' ? 'In Progress' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}".`}
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
    </div>
  );
};

export default JobCardsManagementPage;