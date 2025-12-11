import express from 'express';
import { body } from 'express-validator';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleHistory,
  getUserVehicles
} from '../controllers/vehicleController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create vehicle
router.post('/',
  [
    body('vin').trim().notEmpty().withMessage('VIN is required'),
    body('model').trim().notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: 2100 }).withMessage('Valid year is required'),
    body('engine_type').optional().trim()
  ],
  validate,
  createVehicle
);

// Get all vehicles
router.get('/', getVehicles);

// Get vehicles by user ID
router.get('/user/:id', getUserVehicles);

// Get vehicle by ID
router.get('/:id', getVehicleById);

// Get vehicle service history
router.get('/:id/history', getVehicleHistory);

// Update vehicle
router.put('/:id',
  roleMiddleware('customer', 'mechanic', 'admin'),
  [
    body('model').optional().trim().notEmpty(),
    body('year').optional().isInt({ min: 1900, max: 2100 }),
    body('engine_type').optional().trim()
  ],
  validate,
  updateVehicle
);

// Delete vehicle
router.delete('/:id', 
  roleMiddleware('customer', 'admin'),
  deleteVehicle
);

export default router;
