import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import bookingService from '../../services/bookingService';
import jobcardService from '../../services/jobcardService';
import invoiceService from '../../services/invoiceService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { formatBookingDateWithoutTime } from '../../utils/dateFormatter';
import { formatCurrency } from '../../utils/currencyFormatter';

const AssignedBookingsPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('booking_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);

  // Predefined service types matching the booking form
  const serviceTypes = [
    'Oil Change',
    'Brake Inspection',
    'Engine Tune-up',
    'Tire Rotation',
    'Battery Check',
    'AC Service',
    'General Maintenance'
  ];

  const loadBookings = async () => {
    try {
      setLoading(true);
      let data;

      if (hasRole('admin')) {
        const response = await bookingService.getAllBookings();
        data = response.bookings || [];
      } else if (hasRole('mechanic')) {
        data = await bookingService.getMechanicBookings(user.id);
      } else {
        console.error('Unauthorized access');
        return;
      }

      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      alert('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user.id, hasRole]);

  // Apply filters whenever bookings, filter, or searchTerm change
  useEffect(() => {
    let result = [...bookings];
    
    // Apply service type filter
    if (filter !== 'all') {
      result = result.filter(booking => booking.service_type === filter);
    }
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(booking => 
        booking.customer_name.toLowerCase().includes(term) ||
        (booking.make && booking.make.toLowerCase().includes(term)) ||
        (booking.model && booking.model.toLowerCase().includes(term)) ||
        booking.service_type.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'customer':
          aValue = a.customer_name || '';
          bValue = b.customer_name || '';
          break;
        case 'vehicle':
          aValue = (a.make || '') + (a.model || '');
          bValue = (b.make || '') + (b.model || '');
          break;
        case 'service':
          aValue = a.service_type || '';
          bValue = b.service_type || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default: // booking_date
          aValue = new Date(a.booking_date + 'T' + a.booking_time);
          bValue = new Date(b.booking_date + 'T' + b.booking_time);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredBookings(result);
  }, [bookings, filter, searchTerm, sortBy, sortOrder]);
  const getStatusColor = (status) => ({
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-blue-100 text-blue-800',
    assigned: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-rose-100 text-rose-800',
    rejected: 'bg-rose-100 text-rose-800'
  }[status] || 'bg-gray-100 text-gray-800');

  const StatusBadge = ({ status }) => (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status.replace('_', ' ')}
    </span>
  );

  const handleViewDetails = (bookingId) => {
    const booking = filteredBookings.find(b => b.id === bookingId) || bookings.find(b => b.id === bookingId);
    if (!booking) return alert('Booking not found');
    setSelectedBooking(booking);
    setShowBookingDetailsModal(true);
  };
  const closeBookingDetailsModal = () => {
    setShowBookingDetailsModal(false);
    setSelectedBooking(null);
  };

  const handleViewInvoice = async (bookingId) => {
    try {
      const invoiceData = await invoiceService.getInvoiceByBookingId(bookingId);
      if (!invoiceData?.invoice) return alert('No invoice found');
      setSelectedInvoice(invoiceData);
      setShowInvoiceModal(true);
    } catch {
      alert('Failed to load invoice');
    }
  };

  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-2">Service Bookings</h1>
      <p className="text-gray-600 mb-6">Manage and review service bookings</p>

      {/* Filter Controls */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
            <div className="flex flex-col">
              <label htmlFor="serviceFilter" className="block text-sm font-medium text-gray-700 mb-1.5">
                Filter by Service Type
              </label>
              <div className="relative">
                <select
                  id="serviceFilter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm appearance-none"
                >
                  <option value="all">All Services</option>
                  {serviceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col">
              <label htmlFor="searchInput" className="block text-sm font-medium text-gray-700 mb-1.5">
                Search Bookings
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="searchInput"
                  placeholder="Search customers, vehicles, services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between md:justify-end pt-4 md:pt-0">
            <span className="text-sm text-gray-600 hidden md:block">
              Showing <span className="font-medium">{filteredBookings.length}</span> of <span className="font-medium">{bookings.length}</span> bookings
            </span>
            <button
              onClick={() => {
                setFilter('all');
                setSearchTerm('');
              }}
              className="ml-4 inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
            >
              <svg className="-ml-0.5 mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Mobile view of results count */}
        <div className="mt-3 md:hidden">
          <span className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredBookings.length}</span> of <span className="font-medium">{bookings.length}</span> bookings
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Vehicle</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Appointment</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{booking.customer_name}</td>
                  <td className="px-6 py-4">{booking.make} {booking.model}</td>
                  <td className="px-6 py-4">
                    {formatBookingDateWithoutTime(booking.booking_date, booking.booking_time)}
                  </td>
                  <td className="px-6 py-4">{booking.service_type}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetails(booking.id)}
                      className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                    >
                      View
                    </button>
                    {booking.status === 'assigned' && (
                      <button
                        onClick={() => navigate('/mechanic/assigned-jobs')}
                        className="ml-2 px-3 py-1 text-xs rounded bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                      >
                        Start Assigned Work
                      </button>
                    )}
                    {booking.status === 'in_progress' && (
                      <button
                        onClick={() => navigate('/mechanic/assigned-jobs')}
                        className="ml-2 px-3 py-1 text-xs rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 cursor-pointer"
                      >
                        Continue Work
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <button
                        disabled
                        className="ml-2 px-3 py-1 text-xs rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                      >
                        Work Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No bookings found matching the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Details Modal */}
      {showBookingDetailsModal && selectedBooking && (
        <Modal 
          isOpen 
          onClose={closeBookingDetailsModal} 
          title={`Booking #${selectedBooking.id}`}
          size="md"
        >
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedBooking.make && selectedBooking.model 
                      ? `${selectedBooking.make} ${selectedBooking.model}` 
                      : (selectedBooking.model || 'Unknown Vehicle')}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedBooking.year && `Year: ${selectedBooking.year}`}
                  </p>
                </div>
                <span className={`px-3 py-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${
                  selectedBooking.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  selectedBooking.status === 'approved' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  selectedBooking.status === 'assigned' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                  selectedBooking.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  selectedBooking.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                  selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                  selectedBooking.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {selectedBooking.status === 'pending' ? 'Pending' :
                   selectedBooking.status === 'approved' ? 'Approved' :
                   selectedBooking.status === 'assigned' ? 'Assigned' :
                   selectedBooking.status === 'in_progress' ? 'In Progress' :
                   selectedBooking.status === 'completed' ? 'Completed' :
                   selectedBooking.status === 'cancelled' ? 'Cancelled' :
                   selectedBooking.status === 'rejected' ? 'Rejected' :
                   selectedBooking.status || 'Unknown'}
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">VIN</p>
                  <p className="font-medium text-gray-900">{selectedBooking.vin || 'N/A'}</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Service Type</p>
                  <p className="font-medium text-gray-900">{selectedBooking.service_type || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-4">Customer Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Name</p>
                    <p className="font-medium text-gray-900">{selectedBooking.customer_name || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Phone</p>
                    <p className="font-medium text-gray-900">{selectedBooking.customer_phone || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</p>
                    <p className="font-medium text-gray-900">{selectedBooking.customer_email || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <h4 className="text-base font-bold text-gray-900 mb-4">Appointment Details</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Date</p>
                    <p className="font-medium text-gray-900">
                      {formatBookingDateWithoutTime(selectedBooking.booking_date, selectedBooking.booking_time) || 'N/A'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Additional Notes</p>
                    <p className="font-medium text-gray-900">{selectedBooking.notes || 'None'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button 
              variant="secondary" 
              onClick={closeBookingDetailsModal}
            >
              Close
            </Button>
          </div>
        </Modal>
      )}      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <Modal isOpen onClose={closeInvoiceModal} title={`Invoice #${selectedInvoice.invoice.id}`}>
          <p><strong>Total:</strong> {formatCurrency(selectedInvoice.invoice.grand_total)}</p>
          <div className="mt-4 text-right">
            <Button onClick={closeInvoiceModal}>Close</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssignedBookingsPage;
