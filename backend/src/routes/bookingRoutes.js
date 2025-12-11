import express from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  getCustomerBookings,
  getPendingBookings,
  getAllBookings,
  approveBooking,
  rejectBooking,
  cancelBooking,
  rescheduleBooking,
  getServiceCenterBookings,
  getBookingsByDateRange,
  getMechanicBookings,
  updateBookingStatus,
  confirmBooking,
  assignBooking,
  getBookingById
} from '../controllers/bookingController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create booking (customer only)
router.post('/',
  roleMiddleware('customer'),
  [
    body('vehicle_id').isInt().withMessage('Valid vehicle ID is required'),
    body('service_type').trim().notEmpty().withMessage('Service type is required'),
    body('booking_date').isDate().withMessage('Valid booking date is required'),
    body('booking_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM)'),
    body('notes').optional().trim()
  ],
  validate,
  createBooking
);

// Get pending bookings (mechanic/admin) - This must come before :id routes
router.get('/pending',
  roleMiddleware('mechanic', 'admin'),
  getPendingBookings
);

// Get booking by ID (mechanic/admin) - This must come after /pending route
router.get('/:id',
  roleMiddleware('mechanic', 'admin'),
  getBookingById
);

// Get customer bookings
router.get('/customer/:id', getCustomerBookings);

// Get all bookings (admin)
router.get('/',
  roleMiddleware('admin', 'mechanic'),
  getAllBookings
);

// Get service center bookings
router.get('/servicecenter/:id', getServiceCenterBookings);

// Get mechanic bookings
router.get('/mechanic/:id', getMechanicBookings);

// Get bookings by date range
router.get('/date-range', getBookingsByDateRange);

// Approve booking (admin only)
router.put('/:id/approve',
  roleMiddleware('admin'),
  approveBooking
);

// Reject booking (mechanic/admin)
router.put('/:id/reject',
  roleMiddleware('mechanic', 'admin'),
  rejectBooking
);

// Confirm booking (admin only)
router.put('/:id/confirm',
  roleMiddleware('admin'),
  confirmBooking
);

// Assign booking to mechanic (admin only)
router.put('/:id/assign',
  roleMiddleware('admin'),
  [
    body('mechanicId').isInt().withMessage('Valid mechanic ID is required')
  ],
  validate,
  assignBooking
);

// Cancel booking (customer/mechanic/admin)
router.put('/:id/cancel',
  roleMiddleware('customer', 'mechanic', 'admin'),
  [
    body('reason').optional().trim()
  ],
  validate,
  cancelBooking
);

// Reschedule booking (customer/mechanic/admin)
router.put('/:id/reschedule',
  roleMiddleware('customer', 'mechanic', 'admin'),
  [
    body('newDateTime.date').isDate().withMessage('Valid date is required'),
    body('newDateTime.time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required (HH:MM)'),
    body('reason').optional().trim()
  ],
  validate,
  rescheduleBooking
);

// Update booking status (admin only)
router.put('/:id/status',
  roleMiddleware('admin'),
  [
    body('status').trim().notEmpty().withMessage('Status is required')
  ],
  validate,
  updateBookingStatus
);

export default router;