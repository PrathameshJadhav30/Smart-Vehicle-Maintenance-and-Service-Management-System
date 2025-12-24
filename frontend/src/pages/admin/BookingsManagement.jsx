import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import bookingService from '../../services/bookingService';
import authService from '../../services/authService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { formatBookingDateWithoutTime } from '../../utils/dateFormatter';

const BookingsManagementPage = () => {
  const { hasRole } = useAuth();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedMechanic, setSelectedMechanic] = useState('');
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const StatusBadge = ({ status }) => {
    const statusClasses = {
      pending: 'bg-amber-100 text-amber-800 border border-amber-200',
      approved: 'bg-blue-100 text-blue-800 border border-blue-200',
      assigned: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      completed: 'bg-green-100 text-green-800 border border-green-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      rejected: 'bg-red-100 text-red-800 border border-red-200'
    };
    
    const statusText = {
      pending: 'Pending',
      approved: 'Approved',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    
    return (
      <span className={`px-3 py-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {statusText[status] || status}
      </span>
    );
  };

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Only add status filter if it's not 'all'
      if (filter !== 'all') {
        params.status = filter;
      }
      
      // Add search term if present
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await bookingService.getAllBookings(params);
      
      // Handle different response formats
      let bookingsData = [];
      let paginationData = null;
      
      if (Array.isArray(response)) {
        // If response is an array (old format), no pagination
        bookingsData = response;
        paginationData = null;
      } else {
        // If response is an object, expect bookings and pagination
        bookingsData = response?.bookings || [];
        paginationData = response?.pagination || null;
      }
      
      setBookings(bookingsData);
      
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
          total: bookingsData.length,
          pages: bookingsData.length > 0 ? 1 : 1 // At least 1 page if there are bookings
        }));
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      console.error('Error response:', error.response?.data); // More detailed error logging
      showToast.error('Failed to load bookings. Please try again.');
      setBookings([]); // Set to empty array on error
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMechanics = async () => {
    try {
      const data = await authService.getAllMechanics();
      setMechanics(data || []);
    } catch (error) {
      console.error('Error loading mechanics:', error);
      console.error('Error response:', error.response?.data); // More detailed error logging
      setMechanics([]); // Set to empty array on error
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await Promise.all([loadBookings(), loadMechanics()]);
      } catch (error) {
        console.error('Error initializing data:', error);
        showToast.error('Failed to initialize data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [filter, pagination.page, pagination.limit]);
  
  // Reset to page 1 when filter or search changes and reload data
  useEffect(() => {
    // Only reset page and reload if not on page 1 already
    if (pagination.page !== 1) {
      setPagination(prev => ({
        ...prev,
        page: 1
      }));
    }
    if (!loading) {  // Only reload if not already loading
      loadBookings();
    }
  }, [filter, searchTerm]);
  
  const refreshBookings = () => {
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    loadBookings();
  };

  const handleApprove = async (bookingId) => {
    setConfirmationMessage('Are you sure you want to approve this booking?');
    setConfirmationAction(() => async () => {
      try {
        await bookingService.approveBooking(bookingId);
        loadBookings(); // Refresh the list
        showToast.success('Booking approved successfully!');
      } catch (error) {
        console.error('Error approving booking:', error);
        showToast.error('Failed to approve booking. Please try again.');
      }
    });
    setShowConfirmation(true);
  };

  const handleReject = async (bookingId) => {
    setConfirmationMessage('Are you sure you want to reject this booking?');
    setConfirmationAction(() => async () => {
      try {
        await bookingService.rejectBooking(bookingId);
        loadBookings(); // Refresh the list
        showToast.success('Booking rejected successfully!');
      } catch (error) {
        console.error('Error rejecting booking:', error);
        showToast.error('Failed to reject booking. Please try again.');
      }
    });
    setShowConfirmation(true);
  };

  const handleCancel = async (bookingId) => {
    setConfirmationMessage('Are you sure you want to cancel this booking?');
    setConfirmationAction(() => async () => {
      try {
        await bookingService.cancelBooking(bookingId);
        loadBookings(); // Refresh the list
        showToast.success('Booking cancelled successfully!');
      } catch (error) {
        console.error('Error cancelling booking:', error);
        showToast.error('Failed to cancel booking. Please try again.');
      }
    });
    setShowConfirmation(true);
  };

  const openAssignModal = (booking) => {
    setSelectedBooking(booking);
    setSelectedMechanic('');
    setShowAssignModal(true);
  };

  const openViewModal = (booking) => {
    setSelectedBooking(booking);
    setShowViewModal(true);
  };
  const handleAssignMechanic = async () => {
    if (!selectedMechanic) {
      showToast.error('Please select a mechanic');
      return;
    }

    try {
      // Assign the booking to the mechanic (this will set booking status to 'assigned')
      await bookingService.assignBooking(selectedBooking.id, { 
        mechanicId: selectedMechanic 
      });

      setShowAssignModal(false);
      loadBookings(); // Refresh the list
      showToast.success('Mechanic assigned successfully! The booking status is now "Assigned" and a job card has been created for the mechanic.');
    } catch (error) {
      console.error('Error assigning mechanic:', error);
      // Check if it's a job card creation error
      if (error.response && error.response.data && error.response.data.message) {
        showToast.error(`Failed to assign mechanic: ${error.response.data.message}`);
      } else {
        showToast.error('Failed to assign mechanic. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
        <p className="mt-4 text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  // Ensure bookings is always an array
  const bookingsArray = Array.isArray(bookings) ? bookings : [];
  
  // Use the bookings as received from the backend since filtering is done server-side
  const filteredBookings = bookingsArray;

  // Table cell component for consistent styling
  const TableCell = ({ children, className = '' }) => (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );

  // Table row component for consistent styling
  const TableRow = ({ children, className = '' }) => (
    <tr className={`hover:bg-gray-50 transition-colors duration-150 ${className}`}>
      {children}
    </tr>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage service bookings and assignments
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative rounded-lg shadow-sm w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full md:w-44 pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white transition-all duration-200"
              >
                <option value="all">All Bookings</option>
                <option value="approved">Approved</option>
                <option value="assigned">Assigned</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={refreshBookings}
                className="inline-flex items-center px-4 py-2.5 border border-blue-300 shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
              >
                <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">No bookings found</h3>
              <p className="mt-2 text-gray-500">
                {searchTerm || filter !== 'all' ? 'No bookings match your search or filter criteria.' : 'Get started by creating a new booking.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Appointment Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">{booking.customer_name}</div>
                          <div className="text-sm text-gray-500">{booking.customer_phone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {booking.make && booking.model ? `${booking.make} ${booking.model}` : (booking.model || 'Unknown Vehicle')} {booking.year && `(${booking.year})`}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {formatBookingDateWithoutTime(booking.booking_date, booking.booking_time) || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">
                            {booking.service_type}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <StatusBadge status={booking.status} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => openViewModal(booking)}
                            >
                              View
                            </Button>
                            {booking.status === 'pending' && (
                              <>
                                <Button 
                                  variant="success" 
                                  size="sm"
                                  onClick={() => handleApprove(booking.id)}
                                >
                                  Approve
                                </Button>                                <Button 
                                  variant="danger" 
                                  size="sm"
                                  onClick={() => handleReject(booking.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {booking.status === 'approved' && (
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => openAssignModal(booking)}
                              >
                                Assign Mechanic
                              </Button>
                            )}
                            {(booking.status === 'approved' || booking.status === 'assigned' || booking.status === 'in_progress') && (
                              <Button 
                                variant="danger" 
                                size="sm"
                                onClick={() => handleCancel(booking.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
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

      {/* Assign Mechanic Modal */}
      {showAssignModal && (
        <Modal 
          isOpen={showAssignModal} 
          onClose={() => setShowAssignModal(false)} 
          title={`Assign Mechanic to Booking #${selectedBooking?.id}`}
          size="md"
        >
          <div className="space-y-5 py-2">
            <div>
              <label htmlFor="mechanic" className="block text-sm font-medium text-gray-700 mb-1">
                Select Mechanic
              </label>
              <select
                id="mechanic"
                value={selectedMechanic}
                onChange={(e) => setSelectedMechanic(e.target.value)}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white transition-all duration-200"
              >
                <option value="">Select a mechanic</option>
                {Array.isArray(mechanics) && mechanics.map((mechanic) => (
                  <option key={mechanic.id} value={mechanic.id}>
                    {mechanic.name} ({mechanic.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800">Booking Details</h4>
              <p className="mt-2 text-sm text-blue-700">
                Customer: {selectedBooking?.customer_name || 'N/A'}<br/>
                Vehicle: {(selectedBooking?.make || '') + ' ' + (selectedBooking?.model || 'Unknown Vehicle')} ({selectedBooking?.year || 'N/A'})<br/>
                Service: {selectedBooking?.service_type || 'N/A'}
              </p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h4 className="text-sm font-medium text-amber-800">Important Notice</h4>
              <p className="mt-2 text-sm text-amber-700">
                Assigning a mechanic to this booking will automatically create a job card for them to work on.
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <Button 
              variant="secondary" 
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAssignMechanic}
            >
              Assign Mechanic & Create Job Card
            </Button>
          </div>
        </Modal>
      )}
      
      {/* View Booking Details Modal */}
      {showViewModal && (
        <Modal 
          isOpen={showViewModal} 
          onClose={() => setShowViewModal(false)} 
          title={`Booking #${selectedBooking?.id}`}
          size="md"
        >
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedBooking?.make && selectedBooking?.model 
                      ? `${selectedBooking.make} ${selectedBooking.model}` 
                      : (selectedBooking?.model || 'Unknown Vehicle')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedBooking?.year && `Year: ${selectedBooking.year}`}
                  </p>
                </div>
                <span className={`px-3 py-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                  selectedBooking?.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  selectedBooking?.status === 'approved' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  selectedBooking?.status === 'assigned' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                  selectedBooking?.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  selectedBooking?.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                  selectedBooking?.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                  selectedBooking?.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {selectedBooking?.status === 'pending' ? 'Pending' :
                   selectedBooking?.status === 'approved' ? 'Approved' :
                   selectedBooking?.status === 'assigned' ? 'Assigned' :
                   selectedBooking?.status === 'in_progress' ? 'In Progress' :
                   selectedBooking?.status === 'completed' ? 'Completed' :
                   selectedBooking?.status === 'cancelled' ? 'Cancelled' :
                   selectedBooking?.status === 'rejected' ? 'Rejected' :
                   selectedBooking?.status || 'Unknown'}
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">VIN</p>
                  <p className="font-medium text-gray-900">{selectedBooking?.vin || 'N/A'}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Service Type</p>
                  <p className="font-medium text-gray-900">{selectedBooking?.service_type || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-4">Customer Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Name</p>
                    <p className="font-medium text-gray-900">{selectedBooking?.customer_name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Phone</p>
                    <p className="font-medium text-gray-900">{selectedBooking?.customer_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-4">Appointment Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Date</p>
                    <p className="font-medium text-gray-900">
                      {formatBookingDateWithoutTime(selectedBooking?.booking_date, selectedBooking?.booking_time) || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Additional Notes</p>
                    <p className="font-medium text-gray-900">{selectedBooking?.notes || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {selectedBooking?.status === 'assigned' && selectedBooking?.assigned_mechanic && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-4">Assigned Mechanic</h4>
                <div className="flex items-center">
                  <div className="bg-indigo-100 rounded-full p-3">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">{selectedBooking.assigned_mechanic.name}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.assigned_mechanic.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button 
              variant="secondary" 
              onClick={() => setShowViewModal(false)}
            >
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

export default BookingsManagementPage;