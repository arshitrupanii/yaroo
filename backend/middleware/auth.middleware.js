import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';
import { verifyTokenOptions } from '../lib/utils.js';
import { ApiError } from '../lib/ApiError.js';

export const authMiddleware = async (req, res, next) => {
    const token = req.cookies?.ChatAppToken;

    try {
        if (!token) {
            throw new ApiError(401, 'Unauthorized user', { code: 'UNAUTHORIZED' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, verifyTokenOptions);

        const user = await User.findById(decoded.userId).select("-password -createdAt -updatedAt");

        if (!user) {
            throw new ApiError(401, 'Unauthorized user', { code: 'UNAUTHORIZED' });
        }

        if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
            throw new ApiError(401, 'Password changed recently. Please log in again', { code: 'TOKEN_STALE' });
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return next(new ApiError(401, 'Invalid or expired token', { code: 'INVALID_TOKEN' }));
        }
        return next(error);
    }
}
