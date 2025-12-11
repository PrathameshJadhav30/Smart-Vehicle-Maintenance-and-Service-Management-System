import express from 'express';
import { seedDatabase } from '../controllers/seedController.js';

const router = express.Router();

// Seed database (development only, no authentication required)
router.post('/', seedDatabase);

export default router;