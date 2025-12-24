import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import jobcardService from '../../services/jobcardService';
import vehicleService from '../../services/vehicleService';
import authService from '../../services/authService';
import bookingService from '../../services/bookingService';
import partsService from '../../services/partsService';
import { formatCurrency } from '../../utils/currencyFormatter';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';

const JobCardsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobCards, setJobCards] = useState([]);
  const [filteredJobCards, setFilteredJobCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [parts, setParts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // Add status filter state
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Adjust as needed
  
  const [updateData, setUpdateData] = useState({
    status: '',
    notes: ''
  });
  
  const [showCostEstimationModal, setShowCostEstimationModal] = useState(false);
  const [costEstimationData, setCostEstimationData] = useState({
    tasks: [{ task_name: '', task_cost: '' }],
    parts: [{ part_id: '', quantity: '' }]
  });
  
  const { showToast } = useToast();
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);

  useEffect(() => {
    loadJobCards();
    loadDropdownData();
    loadParts();
  }, []);

  // New effect to handle viewing job card from URL parameter
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const viewJobCardId = queryParams.get('viewJobCard');
    const bookingId = queryParams.get('bookingId');
    
    if (viewJobCardId) {
      // First check if the job card is already in our list
      const jobCardToShow = jobCards.find(card => card.id == viewJobCardId);
      if (jobCardToShow) {
        viewJobCardDetails(jobCardToShow);
        // Remove the query parameter from the URL
        window.history.replaceState({}, document.title, "/mechanic/job-cards");
      } else {
        // If not found, fetch the specific job card
        fetchAndShowJobCard(viewJobCardId);
      }
    } else if (bookingId) {
      // Handle creating a job card from a booking
      createJobCardFromBooking(bookingId);
    }
  }, [jobCards, location.search]);

  // Function to create a job card from a booking
  const createJobCardFromBooking = async (bookingId) => {
    try {
      console.log('Creating job card from booking ID:', bookingId);
      
      // First, get the booking details
      const bookingData = await bookingService.getBookingById(bookingId);
      console.log('Booking data:', bookingData);
      
      if (!bookingData || !bookingData.booking) {
        showToast.error('Booking not found.');
        // Remove the query parameter from the URL
        window.history.replaceState({}, document.title, "/mechanic/job-cards");
        return;
      }
      
      const booking = bookingData.booking;
      
      // Create job card data
      const jobCardData = {
        customer_id: booking.customer_id,
        vehicle_id: booking.vehicle_id,
        booking_id: bookingId,
        priority: 'medium'
      };
      
      console.log('Creating job card with data:', jobCardData);
      
      // Create the job card
      const createdJobCard = await jobcardService.createJobCard(jobCardData);
      console.log('Created job card:', createdJobCard);
      
      // Refresh the job cards list
      await loadJobCards();
      
      // Show the newly created job card
      if (createdJobCard && createdJobCard.jobcard) {
        viewJobCardDetails(createdJobCard.jobcard);
      }
      
      // Remove the query parameter from the URL
      window.history.replaceState({}, document.title, "/mechanic/job-cards");
      
      showToast.success('Job card created successfully!');
    } catch (error) {
      console.error('Error creating job card from booking:', error);
      if (error.response && error.response.data && error.response.data.message) {
        showToast.error(`Failed to create job card: ${error.response.data.message}`);
      } else {
        showToast.error('Failed to create job card. Please try again.');
      }
      // Remove the query parameter from the URL
      window.history.replaceState({}, document.title, "/mechanic/job-cards");
    }
  };

  // Function to fetch and show a specific job card
  const fetchAndShowJobCard = async (jobCardId) => {
    try {
      console.log('Fetching job card with ID:', jobCardId);
      const jobCardData = await jobcardService.getJobCardById(jobCardId);
      console.log('Received job card data:', jobCardData);
      if (jobCardData && jobCardData.jobcard) {
        // Temporarily set this job card as selected to show in modal
        viewJobCardDetails(jobCardData.jobcard);
        // Remove the query parameter from the URL
        window.history.replaceState({}, document.title, "/mechanic/job-cards");
      } else {
        console.log('No job card found in response');
      }
    } catch (error) {
      console.error('Error fetching job card:', error);
      if (error.response) {
        console.error('Error response:', error.response);
      }
    }
  };

  const loadJobCards = async () => {
    try {
      setLoading(true);
      // Get job cards assigned to this specific mechanic
      const data = await jobcardService.getMechanicJobCards(user.id);
      console.log('Loaded job cards:', data);
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

  // Add useEffect to filter job cards when filterStatus or jobCards change
  useEffect(() => {
    const jobCardsArray = Array.isArray(jobCards) ? jobCards : jobCards || [];
    if (filterStatus === 'all') {
      setFilteredJobCards(jobCardsArray);
    } else {
      setFilteredJobCards(jobCardsArray.filter(card => card.status === filterStatus));
    }
    
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [jobCards, filterStatus]);

  const loadDropdownData = async () => {
    try {
      // Load vehicles and bookings for dropdowns
      const vehiclesData = await vehicleService.getAllVehicles({ noPagination: true });
      const bookingsData = await bookingService.getAllBookings({ noPagination: true });
      
      console.log('Loaded vehicles data:', vehiclesData);
      console.log('Loaded bookings data:', bookingsData);
      
      // Log the structure of the first vehicle if available
      if (vehiclesData && vehiclesData.length > 0) {
        console.log('First vehicle structure:', vehiclesData[0]);
        console.log('First vehicle ID type:', typeof vehiclesData[0].id);
        console.log('First vehicle ID value:', vehiclesData[0].id);
        
        // Log all vehicle IDs
        console.log('All vehicle IDs:', vehiclesData.map(v => ({ id: v.id, type: typeof v.id })));
      } else {
        console.log('No vehicles found in the system');
      }
      
      setVehicles(vehiclesData || []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      setBookings([]); // Set to empty array on error
    }
  };

  // Added function to load parts
  const loadParts = async () => {
    try {
      const response = await partsService.getAllParts();
      
      // Handle both paginated and non-paginated responses
      let partsData = [];
      if (Array.isArray(response)) {
        // Direct array response (backward compatibility)
        partsData = response;
      } else if (response && response.parts) {
        // Paginated response
        partsData = response.parts;
      }
      
      // Ensure parts is always an array
      setParts(Array.isArray(partsData) ? partsData : []);
    } catch (error) {
      console.error('Error loading parts:', error);
      setParts([]); // Set to empty array on error
    }
  };

  const reloadData = () => {
    loadJobCards();
    loadDropdownData();
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData({
      ...updateData,
      [name]: value
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating job card:', { jobId: selectedJobCard.id, updateData });
      
      // Validate that we have a selected job card
      if (!selectedJobCard || !selectedJobCard.id) {
        throw new Error('No job card selected');
      }
      
      // Check if status is being updated to 'completed'
      const isBeingCompleted = updateData.status === 'completed';
      
      // Update job card status and/or progress based on provided data
      if (updateData.status) {
        // Validate status before sending
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(updateData.status)) {
          throw new Error('Invalid status value');
        }
        await jobcardService.updateJobCardStatus(selectedJobCard.id, { status: updateData.status });
      }
      
      if (updateData.notes) {
        // Validate percentComplete is a valid integer between 0 and 100
        const percentComplete = parseInt(selectedJobCard.percent_complete || 0);
        if (isNaN(percentComplete) || percentComplete < 0 || percentComplete > 100) {
          console.warn('Invalid percentComplete value, defaulting to 0');
        }
        
        await jobcardService.updateJobCardProgress(selectedJobCard.id, { 
          notes: updateData.notes,
          percentComplete: isNaN(percentComplete) ? 0 : percentComplete
        });
      }
      
      setShowUpdateModal(false);
      setUpdateData({
        status: '',
        notes: ''
      });
      
      loadJobCards();
      
      // If job card was completed, show a success message
      if (isBeingCompleted) {
        showToast.success('Job card completed successfully! Invoice has been automatically generated with all cost estimations.');
      }
    } catch (error) {
      console.error('Error updating job card:', error);
      console.error('Request data:', { jobId: selectedJobCard.id, updateData });
      // Show more detailed error message
      if (error.response && error.response.data && error.response.data.message) {
        showToast.error(`Failed to update job card: ${error.response.data.message}`);
      } else {
        showToast.error('Failed to update job card. Please try again.');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-amber-100 text-amber-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-rose-100 text-rose-800'
    };
    
    const statusText = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${
          status === 'pending' ? 'bg-amber-500' :
          status === 'in_progress' ? 'bg-blue-500' :
          status === 'completed' ? 'bg-emerald-500' :
          status === 'cancelled' ? 'bg-rose-500' : 'bg-gray-500'
        }`}></span>
        {statusText[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityClasses = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-amber-100 text-amber-800',
      high: 'bg-rose-100 text-rose-800'
    };
    
    const priorityText = {
      low: 'Low',
      medium: 'Medium',
      high: 'High'
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${priorityClasses[priority] || 'bg-gray-100 text-gray-800'}`}>
        <span className={`w-2 h-2 rounded-full mr-2 ${
          priority === 'low' ? 'bg-gray-500' :
          priority === 'medium' ? 'bg-amber-500' :
          priority === 'high' ? 'bg-rose-500' : 'bg-gray-500'
        }`}></span>
        {priorityText[priority] || priority}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const viewJobCardDetails = (jobCard) => {
    console.log('Viewing job card details:', jobCard);
    setSelectedJobCard(jobCard);
    setShowDetailsModal(true);
  };
  
  const openUpdateModal = (jobCard) => {
    setSelectedJobCard(jobCard);
    setUpdateData({
      status: jobCard.status || '',
      notes: jobCard.notes || ''
    });
    setShowUpdateModal(true);
  };

  // Function to start working on a job (set status to in_progress)
  const startJob = async (jobCard) => {
    setConfirmationAction(() => async () => {
      try {
        // Update job card status to 'in_progress'
        await jobcardService.updateJobCardStatus(jobCard.id, { status: 'in_progress' });
        
        // Refresh the job cards list
        await loadJobCards();
        
        // Show success message
        showToast.success('Job started successfully! Status updated to "In Progress".');
        
        // Optionally open the update modal for adding notes
        // openUpdateModal(jobCard);
      } catch (error) {
        console.error('Error starting job:', error);
        if (error.response && error.response.data && error.response.data.message) {
          showToast.error(`Failed to start job: ${error.response.data.message}`);
        } else {
          showToast.error('Failed to start job. Please try again.');
        }
      }
    });
    
    setShowConfirmation(true);
  };

  // Added functions for cost estimation
  const openCostEstimationModal = (jobCard) => {
    setSelectedJobCard(jobCard);
    setCostEstimationData({
      tasks: [{ task_name: '', task_cost: '' }],
      parts: [{ part_id: '', quantity: '' }]
    });
    setShowCostEstimationModal(true);
  };

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
      // Validate that we have a selected job card
      if (!selectedJobCard || !selectedJobCard.id) {
        throw new Error('No job card selected');
      }
      
      // Additional validation to ensure job card exists
      const jobCardExists = jobCards.some(card => card.id === selectedJobCard.id);
      if (!jobCardExists) {
        throw new Error('Selected job card no longer exists. Please refresh the page and try again.');
      }
      
      // Add all tasks
      for (const task of costEstimationData.tasks) {
        // Only add tasks with both name and cost
        if (task.task_name && task.task_cost) {
          // Validate task data
          const taskCost = parseFloat(task.task_cost);
          if (isNaN(taskCost) || taskCost <= 0) {
            console.warn('Invalid task cost, skipping task:', task);
            continue;
          }
          
          await jobcardService.addTaskToJobCard(selectedJobCard.id, {
            task_name: task.task_name.trim(),
            task_cost: taskCost
          });
        }
      }
      
      // Add all parts
      for (const part of costEstimationData.parts) {
        // Only add parts with both ID and quantity
        if (part.part_id && part.quantity) {
          // Validate part data
          const partId = parseInt(part.part_id);
          const quantity = parseInt(part.quantity);
          
          if (isNaN(partId) || partId <= 0 || isNaN(quantity) || quantity <= 0) {
            console.warn('Invalid part data, skipping part:', part);
            continue;
          }
          
          await jobcardService.addSparePartToJobCard(selectedJobCard.id, {
            part_id: partId,
            quantity: quantity
          });
        }
      }
      
      setShowCostEstimationModal(false);
      loadJobCards(); // Refresh the list
      showToast.success('Cost estimation saved successfully!');
    } catch (error) {
      console.error('Error saving cost estimation:', error);
      // Show more detailed error message
      if (error.response && error.response.data && error.response.data.message) {
        showToast.error(`Failed to save cost estimation: ${error.response.data.message}`);
      } else if (error.message) {
        showToast.error(`Failed to save cost estimation: ${error.message}`);
      } else {
        showToast.error('Failed to save cost estimation. Please try again.');
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

  const handleConfirmationAction = () => {
    if (confirmationAction) {
      confirmationAction();
    }
    setShowConfirmation(false);
  };

  // Ensure filteredJobCards is always an array
  const filteredJobCardsArray = Array.isArray(filteredJobCards) ? filteredJobCards : filteredJobCards || [];
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredJobCardsArray.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobCards = filteredJobCardsArray.slice(startIndex, startIndex + itemsPerPage);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Job Cards</h1>
              <p className="mt-2 text-lg text-gray-600">Manage and track service job cards</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={reloadData} variant="primary" className="flex items-center bg-blue-600 hover:bg-blue-700 text-white">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Job Card Management</h2>
                <p className="mt-1 text-gray-600">View and update job cards assigned to you</p>
              </div>
              {/* Add filter dropdown */}
              <div className="mt-4 md:mt-0">
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
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
          
          {filteredJobCardsArray.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 rounded-full p-4 inline-flex">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No job cards found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {filterStatus === 'all' 
                  ? "You don't have any assigned job cards right now. New job cards will appear here once they are assigned to you by the admin."
                  : `You don't have any job cards with status "${filterStatus.replace('_', ' ')}". Try changing the filter.`}
              </p>
              <div className="flex justify-center">
                <Button
                  variant="primary"
                  onClick={reloadData}
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Card
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      {/* <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th> */}
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedJobCards.map((jobCard) => (
                      <tr key={jobCard.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                              <span className="text-white font-bold text-sm">#{String(jobCard.id).substring(0, 3)}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                #{String(jobCard.id).substring(0, 8)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {jobCard.booking_id ? `Booking #${String(jobCard.booking_id).substring(0, 8)}` : 'No booking'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                              <span className="text-gray-700 font-medium">
                                {jobCard.customer_name ? jobCard.customer_name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {jobCard.customer_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {jobCard.customer_email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {jobCard.model || 'N/A'} {jobCard.year || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {jobCard.service_type || 'No service type'}
                          </div>
                        </td>
                        {/* <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {jobCard.description || jobCard.notes || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(jobCard.priority)}
                        </td> */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(jobCard.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(jobCard.created_at || jobCard.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex flex-wrap justify-end gap-2">
                            {jobCard.status === 'pending' && (
                              <Button 
                                variant="success" 
                                size="sm"
                                onClick={() => startJob(jobCard)}
                                className="flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Start Job
                              </Button>
                            )}
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => viewJobCardDetails(jobCard)}
                              className="flex items-center bg-blue-600 hover:bg-blue-700"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </Button>
                            <Button 
                              variant="info" 
                              size="sm"
                              onClick={() => openCostEstimationModal(jobCard)}
                              className="flex items-center"
                              disabled={jobCard.status === 'completed'}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Cost Estimation
                            </Button>
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={() => openUpdateModal(jobCard)}
                              disabled={jobCard.status === 'completed'}
                              className="flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Update
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                          {Math.min(startIndex + itemsPerPage, filteredJobCardsArray.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredJobCardsArray.length}</span> results
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
            </div>
          )}
        </div>
      </div>

      {/* Job Card Details Modal */}
      {selectedJobCard && (
        <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={`Job Card #${String(selectedJobCard.id).substring(0, 8)}`}>
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">
                    {getStatusBadge(selectedJobCard.status)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                  <div className="mt-1">
                    {getPriorityBadge(selectedJobCard.priority)}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">{formatDate(selectedJobCard.created_at || selectedJobCard.createdAt)}</p>
                </div>
                {selectedJobCard.booking_id && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Booking ID</h3>
                    <p className="mt-1 text-sm font-medium text-gray-900">#{String(selectedJobCard.booking_id).substring(0, 8)}</p>
                  </div>
                )}
              </div>
            </div>
            
            {(selectedJobCard.description || selectedJobCard.notes) && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">{selectedJobCard.description || selectedJobCard.notes}</p>
                </div>
              </div>
            )}
            
            {selectedJobCard.estimatedHours && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Estimated Hours</h3>
                <p className="mt-1 text-sm font-medium text-gray-900">{selectedJobCard.estimatedHours}</p>
              </div>
            )}
            
            {(selectedJobCard.customer_name || selectedJobCard.customer_email) && (
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-700 font-bold">
                        {selectedJobCard.customer_name ? selectedJobCard.customer_name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedJobCard.customer_name}
                      </p>
                      {selectedJobCard.customer_email && (
                        <p className="mt-1 text-sm text-gray-500">{selectedJobCard.customer_email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(selectedJobCard.model) && (
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Vehicle Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-r from-emerald-100 to-teal-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedJobCard.model}
                      </p>
                      <div className="mt-1 text-sm text-gray-500">
                        {selectedJobCard.year && (
                          <span className="block">Year: {selectedJobCard.year}</span>
                        )}
                        {selectedJobCard.vin && (
                          <span className="block">VIN: {selectedJobCard.vin}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(selectedJobCard.service_type) && (
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Service Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedJobCard.service_type}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {(!selectedJobCard.service_type) && (
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-3">Service Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">
                        No service type specified
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    
      {/* Update Job Card Modal */}
      {selectedJobCard && (
        <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title={`Update Job Card #${String(selectedJobCard.id).substring(0, 8)}`}>
          <form onSubmit={handleUpdateSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={updateData.status}
                  onChange={handleUpdateChange}
                  className="mt-1 block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                >
                  <option value="">Select status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={updateData.notes}
                  onChange={handleUpdateChange}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                  placeholder="Add any notes about the job progress..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={() => setShowUpdateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Update Job Card
              </Button>
            </div>
          </form>
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
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Card Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedJobCard?.customer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium">{selectedJobCard?.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedJobCard?.status)}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Labor Costs</h3>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={addTaskField}
                  className="flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Task
                </Button>
              </div>
              
              <div className="space-y-3">
                {costEstimationData.tasks.map((task, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="md:col-span-5">
                      <input
                        type="text"
                        value={task.task_name}
                        onChange={(e) => updateTaskField(index, 'task_name', e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        placeholder="Task name"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                          type="number"
                          value={task.task_cost}
                          onChange={(e) => updateTaskField(index, 'task_cost', e.target.value)}
                          className="block w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          placeholder="Cost"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-center">
                      {costEstimationData.tasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTaskField(index)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Parts Costs</h3>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={addPartField}
                  className="flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Part
                </Button>
              </div>
              
              <div className="space-y-3">
                {costEstimationData.parts.map((part, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="md:col-span-5">
                      <select
                        value={part.part_id}
                        onChange={(e) => updatePartField(index, 'part_id', e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                      >
                        <option value="">Select a part</option>
                        {Array.isArray(parts) && parts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || p.part_name} ({p.part_number || p.partNumber}) - {formatCurrency(p.price)} (Stock: {p.quantity || p.stockLevel})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-5">
                      <input
                        type="number"
                        value={part.quantity}
                        onChange={(e) => updatePartField(index, 'quantity', e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        placeholder="Quantity"
                        min="1"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center">
                      {costEstimationData.parts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePartField(index)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-rose-700 bg-rose-100 hover:bg-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
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
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmationAction}
        title="Confirm Action"
        message="Are you sure you want to perform this action?"
      />
      
    </div>
  );
};

export default JobCardsPage;