import express from 'express';
import {
    acceptFriendRequest,
    getFriendsOverview,
    rejectFriendRequest,
    removeFriend,
    sendFriendRequest
} from '../controllers/friend.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = express.Router();

router.get('/', authMiddleware, asyncHandler(getFriendsOverview));
router.post('/request/:userId', authMiddleware, asyncHandler(sendFriendRequest));
router.post('/accept/:userId', authMiddleware, asyncHandler(acceptFriendRequest));
router.post('/reject/:userId', authMiddleware, asyncHandler(rejectFriendRequest));
router.delete('/:userId', authMiddleware, asyncHandler(removeFriend));

export default router;
