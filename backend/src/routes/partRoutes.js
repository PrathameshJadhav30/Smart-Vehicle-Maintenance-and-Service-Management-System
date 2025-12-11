// routes/partRoutes.js
import express from 'express';
import { body } from 'express-validator';
import {
  createPart,
  getParts,
  getPartById,
  updatePart,
  deletePart,
  getLowStockParts,
  getPartsUsage,
  createSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier
} from '../controllers/partController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// ================= Middleware =================
// All routes require authentication
router.use(authMiddleware);

// ================= Part Routes =================

// Create a new part (mechanic/admin only)
router.post('/',
  roleMiddleware('mechanic', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Part name is required'),
    body('part_number').optional().trim(),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Valid quantity is required'),
    body('reorder_level').optional().isInt({ min: 0 }),
    body('description').optional().trim()
  ],
  validate,
  createPart
);

// Get all parts
router.get('/', getParts);

// Get low stock parts (mechanic/admin only)
router.get('/low-stock',
  roleMiddleware('mechanic', 'admin'),
  getLowStockParts
);

// Get parts usage trends
router.get('/usage', getPartsUsage);

// ================= Supplier Routes =================

// Create a new supplier (mechanic/admin only)
router.post('/supplier',
  roleMiddleware('mechanic', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Supplier name is required'),
    body('contact_person').optional().trim(),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('address').optional().trim()
  ],
  validate,
  createSupplier
);

// Get all suppliers
router.get('/suppliers', getSuppliers);

// Update supplier (mechanic/admin only)
router.put('/supplier/:id',
  roleMiddleware('mechanic', 'admin'),
  [
    body('name').optional().trim().notEmpty(),
    body('contact_person').optional().trim(),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('address').optional().trim()
  ],
  validate,
  updateSupplier
);

// Delete supplier (admin only)
router.delete('/supplier/:id',
  roleMiddleware('admin'),
  deleteSupplier
);

// IMPORTANT: Parameterized routes must come AFTER specific routes
// Get part by ID
router.get('/:id', getPartById);

// Update part (mechanic/admin only)
router.put('/:id',
  roleMiddleware('mechanic', 'admin'),
  [
    body('name').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('quantity').optional().isInt({ min: 0 }),
    body('reorder_level').optional().isInt({ min: 0 }),
    body('description').optional().trim()
  ],
  validate,
  updatePart
);

// Delete part (admin only)
router.delete('/:id',
  roleMiddleware('admin'),
  deletePart
);

export default router;