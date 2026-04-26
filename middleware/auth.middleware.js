import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';

export const authMiddleware = async (req, res, next) => {
    const token = req.cookies?.ChatAppToken;

    try {
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized user' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password -createdAt -updatedAt");

        if (!user) {
            return res.status(401).json({ message: 'Un-authorized user' });
        }

        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        console.log("error in authMiddleware : ", error);
        return res.status(500).json({ message: 'Internal error' });
    }
}

