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
        <Modal isOpen onClose={closeBookingDetailsModal} title={`Booking #${selectedBooking.id}`}>
          <p><strong>Customer:</strong> {selectedBooking.customer_name}</p>
          <p><strong>Vehicle:</strong> {selectedBooking.make} {selectedBooking.model}</p>
          <p><strong>Status:</strong> {selectedBooking.status}</p>
          <div className="mt-4 text-right">
            <Button onClick={closeBookingDetailsModal}>Close</Button>
          </div>
        </Modal>
      )}

      {/* Invoice Modal */}
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
