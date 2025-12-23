import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import jobcardService from '../../services/jobcardService';
import partsService from '../../services/partsService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const AssignedJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobCards, setJobCards] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskData, setTaskData] = useState({ task_name: '', task_cost: '' });
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [partData, setPartData] = useState({ part_id: '', quantity: '' });
  // Added state for cost estimation modal
  const [showCostEstimationModal, setShowCostEstimationModal] = useState(false);
  const [costEstimationData, setCostEstimationData] = useState({
    tasks: [{ task_name: '', task_cost: '' }],
    parts: [{ part_id: '', quantity: '' }]
  });
  // Added state for filtering and searching
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadJobCards();
    loadParts();
  }, []);

  const loadJobCards = async () => {
    try {
      setLoading(true);
      // Get job cards assigned to this mechanic
      const data = await jobcardService.getMechanicJobCards(user.id);
      setJobCards(data);
    } catch (error) {
      console.error('Error loading job cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParts = async () => {
    try {
      const data = await partsService.getAllParts();
      setParts(data);
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

  const openAcceptModal = (jobCard) => {
    setSelectedJobCard(jobCard);
    setShowAcceptModal(true);
  };

  const openDetailsModal = (jobCard) => {
    setSelectedJobCard(jobCard);
    setShowDetailsModal(true);
  };


  const openAddTaskModal = (jobCard) => {
    setSelectedJobCard(jobCard);
    setTaskData({ task_name: '', task_cost: '' });
    setShowAddTaskModal(true);
  };

  const openAddPartModal = (jobCard) => {
    setSelectedJobCard(jobCard);
    setPartData({ part_id: '', quantity: '' });
    setShowAddPartModal(true);
  };

  // Added function to open cost estimation modal
  const openCostEstimationModal = (jobCard) => {
    setSelectedJobCard(jobCard);
    setCostEstimationData({
      tasks: [{ task_name: '', task_cost: '' }],
      parts: [{ part_id: '', quantity: '' }]
    });
    setShowCostEstimationModal(true);
  };

  const handleAcceptJob = async () => {
    try {
      // Update job card status to "in_progress"
      await jobcardService.updateJobCardStatus(selectedJobCard.id, { status: 'in_progress' });
      
      setShowAcceptModal(false);
      loadJobCards(); // Refresh the list
      alert('Job accepted successfully!');
    } catch (error) {
      console.error('Error accepting job:', error);
      alert('Failed to accept job. Please try again.');
    }
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


  const handleAddTask = async () => {
    try {
      if (!taskData.task_name || !taskData.task_cost) {
        alert('Please fill in all fields');
        return;
      }
      
      await jobcardService.addTaskToJobCard(selectedJobCard.id, taskData);
      setShowAddTaskModal(false);
      loadJobCards(); // Refresh the list
      alert('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task. Please try again.');
    }
  };

  const handleAddPart = async () => {
    try {
      if (!partData.part_id || !partData.quantity) {
        alert('Please fill in all fields');
        return;
      }
      
      await jobcardService.addSparePartToJobCard(selectedJobCard.id, partData);
      setShowAddPartModal(false);
      loadJobCards(); // Refresh the list
      alert('Part added successfully!');
    } catch (error) {
      console.error('Error adding part:', error);
      alert('Failed to add part. Please try again.');
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
          await jobcardService.addTaskToJobCard(selectedJobCard.id, task);
        }
      }
      
      // Add all parts
      for (const part of costEstimationData.parts) {
        if (part.part_id && part.quantity) {
          await jobcardService.addSparePartToJobCard(selectedJobCard.id, part);
        }
      }
      
      setShowCostEstimationModal(false);
      loadJobCards(); // Refresh the list
      alert('Cost estimation saved successfully!');
    } catch (error) {
      console.error('Error saving cost estimation:', error);
      alert('Failed to save cost estimation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter job cards by status
  const pendingJobs = jobCards.filter(job => job.status === 'pending');
  const inProgressJobs = jobCards.filter(job => job.status === 'in_progress');
  const completedJobs = jobCards.filter(job => job.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assigned Jobs</h1>
            <p className="text-lg text-gray-600">View and manage your assigned service jobs</p>
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
          {jobCards.length === 0 && !loading ? (
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
                {jobCards
                  .filter(job => filter === 'all' || job.status === filter)
                  .filter(job => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                      (job.customer_name && job.customer_name.toLowerCase().includes(term)) ||
                      (job.model && job.model.toLowerCase().includes(term)) ||
                      (job.service_type && job.service_type.toLowerCase().includes(term))
                    );
                  })
                  .map((jobCard) => (
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
            </>
          )}
        </div>
      </div>
      
      {/* Accept Job Modal */}
      {showAcceptModal && (
        <Modal 
          isOpen={showAcceptModal} 
          onClose={() => setShowAcceptModal(false)} 
          title={`Accept Job #${String(selectedJobCard?.id || '').substring(0, 8)}`}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-800">Job Details</h4>
              <p className="mt-1 text-sm text-blue-700">
                Customer: {selectedJobCard?.customer_name || 'N/A'}<br/>
                Vehicle: {selectedJobCard?.model || 'N/A'} ({selectedJobCard?.year || 'N/A'})<br/>
                Service: {selectedJobCard?.service_type || 'N/A'}
              </p>
            </div>
            <p>Are you sure you want to accept this job and mark it as "In Progress"?</p>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowAcceptModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleAcceptJob}
            >
              Accept Job
            </Button>
          </div>
        </Modal>
      )}

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



      {/* Add Task Modal */}
      {showAddTaskModal && (
        <Modal 
          isOpen={showAddTaskModal} 
          onClose={() => setShowAddTaskModal(false)} 
          title={`Add Task to Job #${String(selectedJobCard?.id || '').substring(0, 8)}`}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="task_name" className="block text-sm font-medium text-gray-700">
                Task Name
              </label>
              <input
                type="text"
                id="task_name"
                value={taskData.task_name}
                onChange={(e) => setTaskData({...taskData, task_name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task name"
              />
            </div>
            
            <div>
              <label htmlFor="task_cost" className="block text-sm font-medium text-gray-700">
                Task Cost ($)
              </label>
              <input
                type="number"
                id="task_cost"
                value={taskData.task_cost}
                onChange={(e) => setTaskData({...taskData, task_cost: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task cost"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowAddTaskModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddTask}
            >
              Add Task
            </Button>
          </div>
        </Modal>
      )}

      {/* Add Part Modal */}
      {showAddPartModal && (
        <Modal 
          isOpen={showAddPartModal} 
          onClose={() => setShowAddPartModal(false)} 
          title={`Add Part to Job #${String(selectedJobCard?.id || '').substring(0, 8)}`}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="part_id" className="block text-sm font-medium text-gray-700">
                Part
              </label>
              <select
                id="part_id"
                value={partData.part_id}
                onChange={(e) => setPartData({...partData, part_id: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a part</option>
                {parts.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.part_name} ({part.part_number}) - ${(typeof part.price === 'number' ? part.price : parseFloat(part.price || 0)).toFixed(2)} (Stock: {part.quantity})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                value={partData.quantity}
                onChange={(e) => setPartData({...partData, quantity: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quantity"
                min="1"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowAddPartModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddPart}
            >
              Add Part
            </Button>
          </div>
        </Modal>
      )}

      {/* Cost Estimation Modal */}
      {showCostEstimationModal && (
        <Modal 
          isOpen={showCostEstimationModal} 
          onClose={() => setShowCostEstimationModal(false)} 
          title={`Cost Estimation for Job #${String(selectedJobCard?.id || '').substring(0, 8)}`}
          size="large"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Labor Costs</h3>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Parts Costs</h3>
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
                          {p.part_name} ({p.part_number}) - ${(typeof p.price === 'number' ? p.price : parseFloat(p.price || 0)).toFixed(2)} (Stock: {p.quantity})
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
              onClick={() => setShowCostEstimationModal(false)}
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
  );
};

export default AssignedJobsPage;