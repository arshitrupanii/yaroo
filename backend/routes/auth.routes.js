import express from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, logout, updateProfile, checkAuth, forgotPassword, resetPassword  } from '../controllers/auth.controller.js';
import {authMiddleware} from '../middleware/auth.middleware.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { ApiError } from '../lib/ApiError.js';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new ApiError(429, 'Too many auth attempts. Please try again later', { code: 'AUTH_RATE_LIMITED' }));
    }
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
        next(new ApiError(429, 'Too many password reset attempts. Please try again later', { code: 'PASSWORD_RESET_RATE_LIMITED' }));
    }
});

router.post('/signup' , authLimiter, asyncHandler(signup));
router.post('/login', authLimiter, asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.post('/forgot-password', passwordResetLimiter, asyncHandler(forgotPassword));
router.post('/reset-password/:token', passwordResetLimiter, asyncHandler(resetPassword));
router.put('/update-profile', authMiddleware, asyncHandler(updateProfile));
router.get('/check', authMiddleware, asyncHandler(checkAuth));

export default router;
