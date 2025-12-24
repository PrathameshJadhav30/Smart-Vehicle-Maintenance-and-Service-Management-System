import express from 'express';
import { body } from 'express-validator';
import {
  createInvoice,
  getInvoiceById,
  getInvoiceByBookingId,
  getCustomerInvoices,
  getAllInvoices,
  getMechanicInvoices,
  updatePaymentStatus,
  updateInvoice,
  mockPayment
} from '../controllers/invoiceController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create invoice (mechanic/admin)
router.post('/',
  roleMiddleware('mechanic', 'admin'),
  [
    body('jobcard_id').isInt().withMessage('Valid job card ID is required'),
    body('customer_id').isInt().withMessage('Valid customer ID is required'),
    body('parts_total').isFloat({ min: 0 }).withMessage('Valid parts total is required'),
    body('labor_total').isFloat({ min: 0 }).withMessage('Valid labor total is required'),
    body('grand_total').isFloat({ min: 0 }).withMessage('Valid grand total is required')
  ],
  validate,
  createInvoice
);

// Get invoice by ID
router.get('/:id',
  roleMiddleware('admin', 'mechanic', 'customer'),
  getInvoiceById
);

// Get invoice by booking ID
router.get('/booking/:bookingId',
  roleMiddleware('admin', 'mechanic', 'customer'),
  getInvoiceByBookingId
);

// Get customer invoices
router.get('/customer/:id',
  roleMiddleware('admin', 'customer'),
  getCustomerInvoices
);

// Get mechanic invoices (mechanic/admin)
router.get('/mechanic/:id',
  roleMiddleware('admin', 'mechanic'),
  getMechanicInvoices
);

// Get all invoices (admin)
router.get('/',
  roleMiddleware('admin'),
  getAllInvoices
);

// Update payment status (mechanic/admin)
router.put('/:id/payment',
  roleMiddleware('mechanic', 'admin'),
  [
    body('status').isIn(['unpaid', 'paid', 'cancelled']).withMessage('Valid status is required'),
    body('payment_method').optional().trim()
  ],
  validate,
  updatePaymentStatus
);

// Update invoice details (mechanic/admin)
router.put('/:id',
  roleMiddleware('mechanic', 'admin'),
  [
    body('parts_total').optional().isFloat({ min: 0 }).withMessage('Parts total must be a valid number'),
    body('labor_total').optional().isFloat({ min: 0 }).withMessage('Labor total must be a valid number'),
    body('grand_total').optional().isFloat({ min: 0 }).withMessage('Grand total must be a valid number')
  ],
  validate,
  updateInvoice
);

// Mock payment processing
router.post('/mock',
  roleMiddleware('admin', 'mechanic', 'customer'),
  [
    body('invoiceId').isInt().withMessage('Valid invoice ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('method').trim().notEmpty().withMessage('Payment method is required')
  ],
  validate,
  mockPayment
);

export default router;