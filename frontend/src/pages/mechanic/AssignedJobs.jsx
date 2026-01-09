import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobcardService from '../../services/jobcardService';
import partsService from '../../services/partsService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import useDebounce from '../../hooks/useDebounce';

const AssignedJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobCards, setJobCards] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  // Added state for filtering and searching
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Adjust as needed

  useEffect(() => {
    loadJobCards();
    loadParts();
  }, []);

  const loadJobCards = async () => {
    try {
      setLoading(true);
      // Get job cards assigned to this mechanic
      const data = await jobcardService.getMechanicJobCards(user.id);
      // Handle both paginated and non-paginated responses
      let jobCardsData = [];
      if (Array.isArray(data)) {
        // Direct array response (backward compatibility)
        jobCardsData = data;
      } else if (data && data.jobcards) {
        // Paginated response
        jobCardsData = data.jobcards;
      }
      setJobCards(jobCardsData);
    } catch (error) {
      console.error('Error loading job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParts = async () => {
    try {
      const data = await partsService.getAllParts();
      // Ensure data is always an array
      const partsData = Array.isArray(data) ? data : [];
      setParts(partsData);
    } catch (error) {
      console.error('Error loading parts:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  const openDetailsModal = (jobCard) => {
    setSelectedJobCard(jobCard);
    setShowDetailsModal(true);
  };








  const handleMarkAsCompleted = async (jobCardId) => {
    if (window.confirm('Are you sure you want to mark this job as completed?')) {
      try {
        // Update job card status to "completed"
        await jobcardService.updateJobCardStatus(jobCardId, { status: 'completed' });
        
        loadJobCards(); // Refresh the list
        alert('Job marked as completed! Invoice has been automatically generated with all cost estimations.');
      } catch (error) {
        console.error('Error completing job:', error);
        if (error.response && error.response.data && error.response.data.message) {
          alert(`Failed to complete job: ${error.response.data.message}`);
        } else {
          alert('Failed to complete job. Please try again.');
        }
      }
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Ensure jobCards is always an array before filtering
  const jobCardsArray = Array.isArray(jobCards) ? jobCards : jobCards || [];
  
  // Filter and search logic
  const filteredJobCards = jobCardsArray
    .filter(job => filter === 'all' || job.status === filter)
    .filter(job => {
      if (!debouncedSearchTerm) return true;
      const term = debouncedSearchTerm.toLowerCase();
      return (
        (job.customer_name && job.customer_name.toLowerCase().includes(term)) ||
        (job.model && job.model.toLowerCase().includes(term)) ||
        (job.service_type && job.service_type.toLowerCase().includes(term))
      );
    });
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredJobCards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobCards = filteredJobCards.slice(startIndex, startIndex + itemsPerPage);

  // Filter job cards by status (for stats display)
  const pendingJobs = jobCardsArray.filter(job => job.status === 'pending');
  const inProgressJobs = jobCardsArray.filter(job => job.status === 'in_progress');
  const completedJobs = jobCardsArray.filter(job => job.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Assigned Jobs</h1>
              <p className="text-lg text-gray-600">View and manage your assigned service jobs</p>
            </div>
          </div>
          
          {/* Global Controls - Enhanced */}
          <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
                    placeholder="Search job cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select 
                  className="block w-full sm:w-48 pl-4 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl bg-white shadow-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  role="combobox"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <Button variant="secondary" onClick={loadJobCards} className="py-3 px-6">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          
          {/* Show unified empty state when no job cards */}
          {jobCardsArray.length === 0 && !loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">No job cards found</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">You don't have any assigned job cards at the moment. New job cards will appear here when they are assigned to you.</p>
            </div>
          ) : (
            <>
              {/* Stats Overview - Enhanced */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl shadow-sm border border-yellow-100 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-xl p-4 shadow-inner">
                      <svg className="h-8 w-8 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-6">
                      <h3 className="text-sm font-medium text-yellow-800 uppercase tracking-wide">Pending Jobs</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{pendingJobs.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-xl p-4 shadow-inner">
                      <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-6">
                      <h3 className="text-sm font-medium text-blue-800 uppercase tracking-wide">In Progress</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{inProgressJobs.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-sm border border-green-100 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-xl p-4 shadow-inner">
                      <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-6">
                      <h3 className="text-sm font-medium text-green-800 uppercase tracking-wide">Completed</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{completedJobs.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Filtered Job Cards */}
              <div className="space-y-4">
                {paginatedJobCards.map((jobCard) => (
                  <div key={jobCard.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">#{String(jobCard.id).substring(0, 4)}</span>
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-900">Job #{String(jobCard.id).substring(0, 8)}</h3>
                            <p className="text-sm text-gray-500 mt-1">{getStatusBadge(jobCard.status)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>
                              {jobCard.status === 'completed' ? 'Completed' : jobCard.status === 'in_progress' ? 'Started' : 'Created'}: {formatDate(jobCard.status === 'completed' ? jobCard.completed_at : jobCard.status === 'in_progress' ? jobCard.started_at : jobCard.created_at)}
                            </span>
                          </div>
                          {jobCard.status === 'in_progress' && jobCard.percent_complete && (
                            <div className="text-xs text-blue-600 font-medium">
                              {jobCard.percent_complete}% Complete
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                            <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-xs text-gray-500">Customer</p>
                            <p className="text-sm font-medium text-gray-900">{jobCard.customer_name || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center">
                            <svg className="h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-xs text-gray-500">Vehicle</p>
                            <p className="text-sm font-medium text-gray-900">{jobCard.model} ({jobCard.year || 'N/A'})</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                            <svg className="h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-xs text-gray-500">Service</p>
                            <p className="text-sm font-medium text-gray-900">{jobCard.service_type || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      
                      
                      
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          variant="primary" 
                          size="small"
                          onClick={() => openDetailsModal(jobCard)}
                          className="px-4 py-2"
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="primary" 
                          size="small"
                          onClick={() => navigate('/mechanic/job-cards')}
                          className="px-4 py-2"
                        >
                          Job Card
                        </Button>
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
                          {Math.min(startIndex + itemsPerPage, filteredJobCards.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredJobCards.length}</span> results
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
        </div>
      </div>
      


      {/* Job Details Modal */}
      {showDetailsModal && selectedJobCard && (
        <Modal 
          isOpen={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          title={`Job Card #${String(selectedJobCard.id || '').substring(0, 8)}`}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm text-gray-900">{getStatusBadge(selectedJobCard.status)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedJobCard.customer_name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vehicle</h3>
              <p className="mt-1 text-sm text-gray-900">
                {selectedJobCard.model} ({selectedJobCard.year || 'N/A'})
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Service Type</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedJobCard.service_type || 'N/A'}</p>
            </div>


            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1 text-sm text-gray-900">{formatDate(selectedJobCard.created_at)}</p>
            </div>
            {selectedJobCard.started_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Started At</h3>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedJobCard.started_at)}</p>
              </div>
            )}
            {selectedJobCard.completed_at && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Completed At</h3>
                <p className="mt-1 text-sm text-gray-900">{formatDate(selectedJobCard.completed_at)}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default AssignedJobsPage;