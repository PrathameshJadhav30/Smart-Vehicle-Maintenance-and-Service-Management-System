import express from 'express';
import {
  getVehicleAnalytics,
  getPartsUsage,
  getRevenueAnalytics,
  getDashboardStats,
  getMechanicPerformance
} from '../controllers/analyticsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// ------------------ Routes ------------------

// Vehicle analytics (admin only)
router.get(
  '/vehicles',
  authMiddleware,
  roleMiddleware('admin'),
  getVehicleAnalytics
);

// Parts usage analytics (admin only)
router.get(
  '/parts-usage',
  authMiddleware,
  roleMiddleware('admin'),
  getPartsUsage
);

// Revenue analytics (admin only)
router.get(
  '/revenue',
  authMiddleware,
  roleMiddleware('admin'),
  getRevenueAnalytics
);

// Dashboard stats (admin only)
router.get(
  '/dashboard-stats',
  authMiddleware,
  roleMiddleware('admin'),
  getDashboardStats
);

// Mechanic performance (admin + mechanic)
router.get(
  '/mechanic-performance',
  authMiddleware,
  roleMiddleware('admin', 'mechanic'),
  getMechanicPerformance
);

export default router;
