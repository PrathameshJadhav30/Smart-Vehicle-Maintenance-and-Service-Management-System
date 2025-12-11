import express from 'express';
import { clearAllCache, getCacheStats } from '../controllers/cacheController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Clear all cache
router.post('/clear', clearAllCache);

// Get cache statistics
router.get('/stats', getCacheStats);

export default router;