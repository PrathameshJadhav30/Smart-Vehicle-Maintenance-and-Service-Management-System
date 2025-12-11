import express from 'express';
import { clearDatabase } from '../controllers/clearController.js';

const router = express.Router();

// Clear database (development only, no authentication required)
router.post('/', clearDatabase);

export default router;