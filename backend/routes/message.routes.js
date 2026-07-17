import express from 'express';
import { deleteMessage, editMessage, getUserFromSidebar, getSearchUser, getMessage, sendMessage } from '../controllers/message.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = express.Router();

router.get('/users', authMiddleware, asyncHandler(getUserFromSidebar));
router.get('/search/:username', authMiddleware, asyncHandler(getSearchUser));
router.get('/:id', authMiddleware, asyncHandler(getMessage));
router.post('/send/:id', authMiddleware, asyncHandler(sendMessage));
router.put('/:id', authMiddleware, asyncHandler(editMessage));
router.delete('/:id', authMiddleware, asyncHandler(deleteMessage));

export default router;
