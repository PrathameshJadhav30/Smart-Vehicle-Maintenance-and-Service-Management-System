import express from 'express';
import { body } from 'express-validator';
import {
  createJobCard,
  getJobCards,
  getJobCardById,
  getJobCardByBookingId,
  getJobCardNotes,
  addTask,
  assignMechanic,
  addSparePart,
  updateStatus,
  updateProgress,
  getCompletedJobCards,
  deleteJobCard,
  getMechanicJobCards
} from '../controllers/jobcardController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create job card (mechanic/admin)
router.post('/',
  roleMiddleware('mechanic', 'admin'),
  [
    body('customer_id').optional().isInt().withMessage('Valid customer ID is required'),
    body('vehicle_id').isInt().withMessage('Valid vehicle ID is required'),
    body('booking_id').optional().isInt().withMessage('Valid booking ID is required'),
    body('notes').optional().trim()
  ],
  validate,
  createJobCard
);

// Get all job cards (admin/mechanic)
router.get('/',
  roleMiddleware('admin', 'mechanic'),
  getJobCards
);

// Get job card by ID
router.get('/:id',
  roleMiddleware('admin', 'mechanic'),
  getJobCardById
);

// Get job card by booking ID
router.get('/booking/:bookingId',
  roleMiddleware('admin', 'mechanic'),
  getJobCardByBookingId
);

// Get completed job cards (admin/mechanic)
router.get('/completed',
  roleMiddleware('admin', 'mechanic'),
  getCompletedJobCards
);

// Get mechanic job cards
router.get('/mechanic/:id',
  roleMiddleware('admin', 'mechanic'),
  getMechanicJobCards
);

// Get job card notes
router.get('/:id/notes',
  roleMiddleware('admin', 'mechanic'),
  getJobCardNotes
);

// Add task to job card (mechanic/admin)
router.put('/:id/add-task',
  roleMiddleware('mechanic', 'admin'),
  [
    body('task_name').trim().notEmpty().withMessage('Task name is required'),
    body('task_cost').isFloat({ min: 0 }).withMessage('Valid task cost is required')
  ],
  validate,
  addTask
);

// Assign mechanic to job card (mechanic/admin)
router.put('/:id/add-mechanic',
  roleMiddleware('mechanic', 'admin'),
  [
    body('mechanic_id').isInt().withMessage('Valid mechanic ID is required')
  ],
  validate,
  assignMechanic
);

// Add spare part to job card (mechanic/admin)
router.put('/:id/add-sparepart',
  roleMiddleware('mechanic', 'admin'),
  [
    body('part_id').isInt().withMessage('Valid part ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Valid quantity is required')
  ],
  validate,
  addSparePart
);

// Update job card status (mechanic/admin)
router.put('/:id/update-status',
  roleMiddleware('mechanic', 'admin'),
  [
    body('status').trim().notEmpty().withMessage('Status is required')
  ],
  validate,
  updateStatus
);

// Update job card progress (mechanic/admin)
router.put('/:id/update-progress',
  roleMiddleware('mechanic', 'admin'),
  [
    body('percentComplete').isInt({ min: 0, max: 100 }).withMessage('Percent complete must be between 0 and 100'),
    body('notes').optional().trim()
  ],
  validate,
  updateProgress
);

// Delete job card (admin)
router.delete('/:id',
  roleMiddleware('admin'),
  deleteJobCard
);

export default router;