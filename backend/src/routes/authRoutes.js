import express from 'express';
import { body } from 'express-validator';
import { createUser, register, login, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, refreshToken, logout } from '../controllers/authController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
const router = express.Router();

// Custom validator for strong password
const strongPasswordValidator = (field) => body(field)
  .isLength({ min: 6, max: 16 })
  .withMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} must be between 6 and 16 characters`)
  .matches(/[A-Z]/)
  .withMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} must contain at least one uppercase letter`)
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} must contain at least one special character`);

// Create user (admin only)
router.post('/create-user',
  authMiddleware,
  roleMiddleware('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required').matches(/^[a-zA-Z\s]+$/).withMessage('Name must contain only letters and spaces'),
    body('email').isEmail().withMessage('Valid email is required'),
    strongPasswordValidator('password'),
    body('role').isIn(['customer', 'mechanic', 'admin']).withMessage('Valid role is required'),
    body('phone').optional().trim(),
    body('address').optional().trim()
  ],
  validate,
  createUser
);

// Register
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').matches(/^[a-zA-Z\s]+$/).withMessage('Name must contain only letters and spaces'),
    body('email').isEmail().withMessage('Valid email is required'),
    strongPasswordValidator('password'),
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
    strongPasswordValidator('newPassword')
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
    strongPasswordValidator('newPassword')
  ],
  validate,
  resetPassword
);

// Refresh token
router.post('/refresh-token', refreshToken);

// Logout
router.post('/logout', logout);

export default router;
