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

/* ================= Mock Payments Route ================= */
router.get('/mock', (req, res) => {
  const mockPayments = [
    {
      id: 1,
      invoiceId: 101,
      amount: 2500.00,
      method: 'card',
      status: 'completed',
      date: new Date('2025-12-01T10:30:00')
    },
    {
      id: 2,
      invoiceId: 102,
      amount: 1200.50,
      method: 'cash',
      status: 'pending',
      date: new Date('2025-12-02T12:15:00')
    },
    {
      id: 3,
      invoiceId: 103,
      amount: 3400.75,
      method: 'bank_transfer',
      status: 'completed',
      date: new Date('2025-12-03T09:00:00')
    },
    {
      id: 4,
      invoiceId: 104,
      amount: 500.00,
      method: 'card',
      status: 'failed',
      date: new Date('2025-12-03T14:45:00')
    }
  ];

  res.json({
    success: true,
    message: 'Mock payments fetched successfully',
    data: mockPayments
  });
});

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