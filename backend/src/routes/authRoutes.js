import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, updateProfile, changePassword, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';

const router = express.Router();

// Register
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['customer', 'mechanic', 'admin']).withMessage('Valid role is required'),
    body('phone').optional().trim(),
    body('address').optional().trim()
  ],
  validate,
  register
);

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  login
);

// Get profile (protected)
router.get('/profile', authMiddleware, getProfile);

// Update user profile (protected)
router.put('/users/:id',
  authMiddleware,
  [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('address').optional().trim()
  ],
  validate,
  updateProfile
);

// Change user password (protected)
router.put('/users/:id/change-password',
  authMiddleware,
  [
    body('oldPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validate,
  changePassword
);

// Forgot password
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  validate,
  forgotPassword
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  validate,
  resetPassword
);

export default router;
