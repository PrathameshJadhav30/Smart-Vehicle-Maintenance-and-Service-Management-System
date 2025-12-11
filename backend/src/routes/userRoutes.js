import express from 'express';
import { getUsers, updateUserRole, deleteUser, getMechanics } from '../controllers/userController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, roleMiddleware('admin'), getUsers);

// Update user role (admin only)
router.put('/:id/role', 
  authMiddleware, 
  roleMiddleware('admin'),
  [
    body('role').isIn(['customer', 'mechanic', 'admin']).withMessage('Valid role is required')
  ],
  validate,
  updateUserRole
);

// Delete user (admin only)
router.delete('/:id', 
  authMiddleware, 
  roleMiddleware('admin'),
  deleteUser
);

// Get all mechanics (admin only)
router.get('/mechanics', 
  authMiddleware, 
  roleMiddleware('admin'),
  getMechanics
);

export default router;