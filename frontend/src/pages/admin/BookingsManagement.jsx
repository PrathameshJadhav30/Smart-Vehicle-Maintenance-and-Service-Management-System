import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import bookingService from '../../services/bookingService';
import authService from '../../services/authService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { formatBookingDateWithoutTime } from '../../utils/dateFormatter';

const BookingsManagementPage = () => {
  const { hasRole } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedMechanic, setSelectedMechanic] = useState('');

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
      let data;
      
      if (filter === 'all') {
        const response = await bookingService.getAllBookings({ page: 1, limit: 100 }); // Get more bookings
        data = response?.bookings || [];
      } else {
        const response = await bookingService.getAllBookings({ page: 1, limit: 100 }); // Get more bookings
        const allBookings = response?.bookings || [];
        data = allBookings.filter(booking => booking.status === filter);
      }
      
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      console.error('Error response:', error.response?.data); // More detailed error logging
      alert('Failed to load bookings. Please try again.');
      setBookings([]); // Set to empty array on error
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
        alert('Failed to initialize data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const refreshBookings = () => {
    loadBookings();
  };

  const handleApprove = async (bookingId) => {
    if (window.confirm('Are you sure you want to approve this booking?')) {
      try {
        await bookingService.approveBooking(bookingId);
        loadBookings(); // Refresh the list
      } catch (error) {
        console.error('Error approving booking:', error);
        alert('Failed to approve booking. Please try again.');
      }
    }
  };

  const handleReject = async (bookingId) => {
    if (window.confirm('Are you sure you want to reject this booking?')) {
      try {
        await bookingService.rejectBooking(bookingId);
        loadBookings(); // Refresh the list
      } catch (error) {
        console.error('Error rejecting booking:', error);
        alert('Failed to reject booking. Please try again.');
      }
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingService.cancelBooking(bookingId);
        loadBookings(); // Refresh the list
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  const openAssignModal = (booking) => {
    setSelectedBooking(booking);
    setSelectedMechanic('');
    setShowAssignModal(true);
  };

  const handleAssignMechanic = async () => {
    if (!selectedMechanic) {
      alert('Please select a mechanic');
      return;
    }

    try {
      // Assign the booking to the mechanic (this will set booking status to 'assigned')
      await bookingService.assignBooking(selectedBooking.id, { 
        mechanicId: selectedMechanic 
      });

      setShowAssignModal(false);
      loadBookings(); // Refresh the list
      alert('Mechanic assigned successfully! The booking status is now "Assigned" and a job card has been created for the mechanic.');
    } catch (error) {
      console.error('Error assigning mechanic:', error);
      // Check if it's a job card creation error
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to assign mechanic: ${error.response.data.message}`);
      } else {
        alert('Failed to assign mechanic. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading bookings...</p>
      </div>
    );
  }

  // Ensure bookings is always an array
  const bookingsArray = Array.isArray(bookings) ? bookings : [];
  
  // Filter bookings based on search term
  const filteredBookings = bookingsArray.filter(booking => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (booking?.customer_name && booking.customer_name.toLowerCase().includes(searchTermLower)) ||
      (booking?.model && booking.model.toLowerCase().includes(searchTermLower)) ||
      (booking?.vin && booking.vin.toLowerCase().includes(searchTermLower)) ||
      (booking?.service_type && booking.service_type.toLowerCase().includes(searchTermLower))
    );
  });

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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={refreshBookings}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
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
                {searchTerm ? 'No bookings match your search.' : 'Get started by creating a new booking.'}
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
                            {booking.make || ''} {booking.model || 'Unknown Vehicle'} ({booking.year || 'N/A'})
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
                            {booking.status === 'pending' && (
                              <>
                                <Button 
                                  variant="success" 
                                  size="sm"
                                  onClick={() => handleApprove(booking.id)}
                                >
                                  Approve
                                </Button>
                                <Button 
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
    </div>
  );
};

export default BookingsManagementPage;