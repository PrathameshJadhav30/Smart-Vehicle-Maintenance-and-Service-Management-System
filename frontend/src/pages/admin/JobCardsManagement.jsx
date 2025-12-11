import React, { useState, useEffect } from 'react';
import jobcardService from '../../services/jobcardService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const JobCardsManagementPage = () => {
  const [jobCards, setJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);

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
    return new Date(dateString).toLocaleDateString('en-US', {
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Job Cards Management</h1>
          </div>

          {jobCardsArray.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No job cards found</h3>
              <p className="mt-1 text-gray-500">There are no job cards in the system.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {jobCardsArray.map((jobCard) => (
                  <li key={jobCard.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          Job Card #{String(jobCard.id || '').substring(0, 8)}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex space-x-2">
                          {getStatusBadge(jobCard.status)}
                          {getPriorityBadge(jobCard.priority)}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Customer: {jobCard.booking?.customer?.name}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            Vehicle: {jobCard.booking?.vehicle?.make} {jobCard.booking?.vehicle?.model}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>
                            Created: {formatDate(jobCard.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                          Assigned to: {jobCard.assignedMechanic?.name || 'Unassigned'}
                        </p>
                        <div className="flex space-x-2">
                          <Button 
                            variant="secondary" 
                            size="small"
                            onClick={() => viewJobCardDetails(jobCard)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="danger" 
                            size="small"
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
        <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={`Job Card #${String(selectedJobCard.id || '').substring(0, 8)}`}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm text-gray-900">{getStatusBadge(selectedJobCard.status)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Priority</h3>
              <p className="mt-1 text-sm text-gray-900">{getPriorityBadge(selectedJobCard.priority)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedJobCard.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Estimated Hours</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedJobCard.estimated_hours || selectedJobCard.estimatedHours || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedJobCard.booking?.customer?.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vehicle</h3>
              <p className="mt-1 text-sm text-gray-900">
                {selectedJobCard.booking?.vehicle?.make} {selectedJobCard.booking?.vehicle?.model} ({selectedJobCard.booking?.vehicle?.year})
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Assigned Mechanic</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedJobCard.assignedMechanic?.name || 'Unassigned'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Created At</h3>
              <p className="mt-1 text-sm text-gray-900">{formatDate(selectedJobCard.created_at || selectedJobCard.createdAt)}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default JobCardsManagementPage;