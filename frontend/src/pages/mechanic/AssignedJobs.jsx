import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import jobcardService from '../../services/jobcardService';
import partsService from '../../services/partsService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

const AssignedJobsPage = () => {
  const { user } = useAuth();
  const [jobCards, setJobCards] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressData, setProgressData] = useState({ percentComplete: 0, notes: '' });
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

  const openProgressModal = (jobCard) => {
    console.log('Opening progress modal for job card:', jobCard);
    setSelectedJobCard(jobCard);
    setProgressData({ 
      percentComplete: jobCard.percent_complete || 0, 
      notes: jobCard.progress_notes || '' 
    });
    console.log('Initial progress data:', { 
      percentComplete: jobCard.percent_complete || 0, 
      notes: jobCard.progress_notes || '' 
    });
    setShowProgressModal(true);
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
        alert('Job marked as completed!');
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

  const handleUpdateProgress = async () => {
    try {
      // Validate percentComplete is a valid integer between 0 and 100
      const percentComplete = parseInt(progressData.percentComplete);
      if (isNaN(percentComplete) || percentComplete < 0 || percentComplete > 100) {
        alert('Completion percentage must be a number between 0 and 100');
        return;
      }
      
      const requestData = {
        percentComplete: percentComplete,
        notes: progressData.notes || ''
      };
      
      console.log('Sending progress update:', { jobId: selectedJobCard.id, requestData });
      await jobcardService.updateJobCardProgress(selectedJobCard.id, requestData);
      setShowProgressModal(false);
      loadJobCards(); // Refresh the list
      alert('Progress updated successfully!');
    } catch (error) {
      console.error('Error updating progress:', error);
      console.error('Request data:', { jobId: selectedJobCard.id, progressData });
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to update progress: ${error.response.data.message}`);
      } else {
        alert('Failed to update progress. Please try again.');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter job cards by status
  const pendingJobs = jobCards.filter(job => job.status === 'pending');
  const inProgressJobs = jobCards.filter(job => job.status === 'in_progress');
  const completedJobs = jobCards.filter(job => job.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Assigned Jobs</h1>
            <p className="mt-1 text-sm text-gray-500">View and manage your assigned service jobs</p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Jobs</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{pendingJobs.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{inProgressJobs.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{completedJobs.length}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Pending Jobs Section */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Jobs</h2>
            {pendingJobs.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No pending jobs</h3>
                <p className="mt-1 text-gray-500">You don't have any pending jobs at the moment.</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {pendingJobs.map((jobCard) => (
                    <li key={jobCard.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            Job #{String(jobCard.id).substring(0, 8)}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            {getStatusBadge(jobCard.status)}
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              Customer: {jobCard.booking?.customer?.name || 'N/A'}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              Vehicle: {jobCard.booking?.vehicle?.make} {jobCard.booking?.vehicle?.model} ({jobCard.booking?.vehicle?.year})
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>
                              Created: {formatDate(jobCard.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <p className="text-sm text-gray-500">
                            Service: {jobCard.booking?.serviceType || 'N/A'}
                          </p>
                          <div className="flex space-x-2">
                            <Button 
                              variant="secondary" 
                              size="small"
                              onClick={() => openDetailsModal(jobCard)}
                            >
                              View Details
                            </Button>
                            <Button 
                              variant="success" 
                              size="small"
                              onClick={() => openAcceptModal(jobCard)}
                            >
                              Accept Job
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
          
          {/* In Progress Jobs Section */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">In Progress Jobs</h2>
            {inProgressJobs.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No jobs in progress</h3>
                <p className="mt-1 text-gray-500">You don't have any jobs in progress at the moment.</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {inProgressJobs.map((jobCard) => (
                    <li key={jobCard.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            Job #{String(jobCard.id).substring(0, 8)}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            {getStatusBadge(jobCard.status)}
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              Customer: {jobCard.booking?.customer?.name || 'N/A'}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              Vehicle: {jobCard.booking?.vehicle?.make} {jobCard.booking?.vehicle?.model} ({jobCard.booking?.vehicle?.year})
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>
                              Started: {formatDate(jobCard.started_at)}
                            </span>
                          </div>
                        </div>
                        {jobCard.percent_complete && (
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Progress</span>
                              <span>{jobCard.percent_complete}%</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${jobCard.percent_complete}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        <div className="mt-2 flex justify-between items-center">
                          <p className="text-sm text-gray-500">
                            Service: {jobCard.booking?.serviceType || 'N/A'}
                          </p>
                          <div className="flex space-x-2">
                            <Button 
                              variant="secondary" 
                              size="small"
                              onClick={() => openDetailsModal(jobCard)}
                            >
                              View Details
                            </Button>
                            <Button 
                              variant="info" 
                              size="small"
                              onClick={() => openProgressModal(jobCard)}
                            >
                              Update Progress
                            </Button>
                            <Button 
                              variant="primary" 
                              size="small"
                              onClick={() => openAddTaskModal(jobCard)}
                            >
                              Add Task
                            </Button>
                            <Button 
                              variant="warning" 
                              size="small"
                              onClick={() => openAddPartModal(jobCard)}
                            >
                              Add Part
                            </Button>
                            {/* Added Cost Estimation button */}
                            <Button 
                              variant="info" 
                              size="small"
                              onClick={() => openCostEstimationModal(jobCard)}
                            >
                              Cost Estimation
                            </Button>
                            <Button 
                              variant="success" 
                              size="small"
                              onClick={() => handleMarkAsCompleted(jobCard.id)}
                            >
                              Mark as Completed
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
          
          {/* Completed Jobs Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Completed Jobs</h2>
            {completedJobs.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No completed jobs</h3>
                <p className="mt-1 text-gray-500">You haven't completed any jobs yet.</p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {completedJobs.map((jobCard) => (
                    <li key={jobCard.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            Job #{String(jobCard.id).substring(0, 8)}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            {getStatusBadge(jobCard.status)}
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              Customer: {jobCard.booking?.customer?.name || 'N/A'}
                            </p>
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              Vehicle: {jobCard.booking?.vehicle?.make} {jobCard.booking?.vehicle?.model} ({jobCard.booking?.vehicle?.year})
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>
                              Completed: {formatDate(jobCard.completed_at)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <p className="text-sm text-gray-500">
                            Service: {jobCard.booking?.serviceType || 'N/A'}
                          </p>
                          <div className="flex space-x-2">
                            <Button 
                              variant="secondary" 
                              size="small"
                              onClick={() => openDetailsModal(jobCard)}
                            >
                              View Details
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
                Customer: {selectedJobCard?.booking?.customer?.name}<br/>
                Vehicle: {selectedJobCard?.booking?.vehicle?.make} {selectedJobCard?.booking?.vehicle?.model} ({selectedJobCard?.booking?.vehicle?.year})<br/>
                Service: {selectedJobCard?.booking?.serviceType}
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
          title={`Job Details #${String(selectedJobCard.id || '').substring(0, 8)}`}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1 text-sm text-gray-900">{getStatusBadge(selectedJobCard.status)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedJobCard.booking?.customer?.name || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Vehicle</h3>
              <p className="mt-1 text-sm text-gray-900">
                {selectedJobCard.booking?.vehicle?.make} {selectedJobCard.booking?.vehicle?.model} ({selectedJobCard.booking?.vehicle?.year})
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Service Type</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedJobCard.booking?.serviceType || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedJobCard.notes || 'No notes provided'}</p>
            </div>
            {selectedJobCard.percent_complete && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                <div className="mt-1">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{selectedJobCard.percent_complete}% Complete</span>
                  </div>
                  <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${selectedJobCard.percent_complete}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            {selectedJobCard.progress_notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Progress Notes</h3>
                <p className="mt-1 text-sm text-gray-900">{selectedJobCard.progress_notes}</p>
              </div>
            )}
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

      {/* Update Progress Modal */}
      {showProgressModal && (
        <Modal 
          isOpen={showProgressModal} 
          onClose={() => setShowProgressModal(false)} 
          title={`Update Progress for Job #${String(selectedJobCard?.id || '').substring(0, 8)}`}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="percentComplete" className="block text-sm font-medium text-gray-700">
                Completion Percentage
              </label>
              <input
                type="range"
                id="percentComplete"
                min="0"
                max="100"
                value={progressData.percentComplete}
                onChange={(e) => setProgressData({...progressData, percentComplete: parseInt(e.target.value)})}
                className="w-full mt-1"
              />
              <div className="text-center text-sm text-gray-500 mt-1">
                {progressData.percentComplete}%
              </div>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Progress Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={progressData.notes}
                onChange={(e) => setProgressData({...progressData, notes: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add notes about the work progress..."
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowProgressModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpdateProgress}
            >
              Update Progress
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
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
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