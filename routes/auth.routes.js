import express from 'express';
import { signup, login, logout, updateProfile, checkAuth  } from '../controllers/auth.controller.js';
import {authMiddleware} from '../middleware/auth.middleware.js';
import { loginValidator, signupValidator } from '../middleware/auth.validator.js';

const router = express.Router();

router.post('/signup', signupValidator ,signup);
router.post('/login', loginValidator, login);
router.post('/logout', logout);
router.put('/update-profile', authMiddleware, updateProfile);
router.get('/check', authMiddleware, checkAuth );

export default router;