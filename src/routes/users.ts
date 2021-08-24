import express from 'express';
const router = express.Router();

// Require controller modules.
import { user_controller } from '../controllers/userController';

/// user ROUTES ///
router.get('/', user_controller);

export default router;
