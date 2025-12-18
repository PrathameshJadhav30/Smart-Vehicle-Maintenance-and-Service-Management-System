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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('booking_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);

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
    const booking = bookings.find(b => b.id === bookingId);
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

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
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
            {bookings.map((booking) => (
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
                    className="px-3 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
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
