import express from 'express';
import { getUserFromSidebar, getMessage, sendMessage } from '../controllers/message.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/users', authMiddleware, getUserFromSidebar);
router.get('/:id', authMiddleware, getMessage);
router.post('/send/:id', authMiddleware, sendMessage);

export default router;