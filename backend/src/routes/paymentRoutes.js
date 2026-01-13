import express from 'express';
import { body } from 'express-validator';
import {
  processPayment,
  getPaymentHistory,
  refundPayment
} from '../controllers/paymentController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Import the mockPayment controller from invoiceController
import { mockPayment } from '../controllers/invoiceController.js';


// Add POST endpoint for mock payment
router.post('/mock',
  [
    body('invoiceId').isInt().withMessage('Valid invoice ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('method').isIn(['cash', 'card', 'bank_transfer']).withMessage('Valid payment method is required')
  ],
  validate,
  mockPayment
);

/* ================= Process Payment ================= */
router.post(
  '/process',
  roleMiddleware('mechanic', 'admin', 'customer'),
  [
    body('invoiceId').isInt().withMessage('Valid invoice ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('method').isIn(['cash', 'card', 'bank_transfer']).withMessage('Valid payment method is required')
  ],
  validate,
  processPayment
);

/* ================= Payment History ================= */
router.get(
  '/history/:invoiceId',
  roleMiddleware('mechanic', 'admin', 'customer'),
  getPaymentHistory
);

/* ================= Refund Payment ================= */
router.post(
  '/refund/:paymentId',
  roleMiddleware('admin'),
  [
    body('reason').optional().trim()
  ],
  validate,
  refundPayment
);

export default router;