import User from '../model/user.model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateToken } from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';
import { ApiError } from '../lib/ApiError.js';
import { sendPasswordResetEmail } from '../lib/email.js';

const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password) => (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 128 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
);

const toPublicUser = (user) => ({
    _id: user._id,
    firstname: user.firstname,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
});

const forgotPasswordResponse = { message: 'If an account exists for that email, a password reset link has been created' };
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const profileImagePattern = /^data:image\/(?:jpeg|png|webp);base64,([a-zA-Z0-9+/]+={0,2})$/;

const buildUsername = (user) => (
    user.username ||
    user.email?.split('@')[0]?.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 20) ||
    `user${user._id.toString().slice(-8)}`
);

const ensureUsername = async (user) => {
    if (user.username) return user;

    const baseUsername = buildUsername(user).padEnd(3, '0');
    let nextUsername = baseUsername;
    let suffix = 1;

    while (await User.exists({ username: nextUsername, _id: { $ne: user._id } })) {
        nextUsername = `${baseUsername.slice(0, 20)}${suffix}`;
        suffix += 1;
    }

    user.username = nextUsername;
    await user.save({ validateBeforeSave: false });
    return user;
};

export const signup = async (req, res) => {
    const { firstname, email, password, username } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const trimmedFirstname = firstname?.trim();
    const normalizedUsername = username?.trim().toLowerCase() || normalizedEmail?.split('@')[0]?.replace(/[^a-z0-9_]/g, '').slice(0, 20);

    if (!trimmedFirstname || !normalizedEmail || !password) {
        throw new ApiError(400, 'All fields are required', { code: 'VALIDATION_ERROR' });
    }

    if (trimmedFirstname.length < 2 || trimmedFirstname.length > 30) {
        throw new ApiError(400, 'Firstname must be between 2 and 30 characters', { code: 'VALIDATION_ERROR' });
    }

    if (normalizedEmail.length > 254 || !isValidEmail(normalizedEmail)) {
        throw new ApiError(400, 'Invalid email format', { code: 'VALIDATION_ERROR' });
    }

    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
        throw new ApiError(400, 'Username must be 3-24 characters and only use letters, numbers, or underscore', { code: 'VALIDATION_ERROR' });
    }

    if (!isStrongPassword(password)) {
        throw new ApiError(400, 'Password must be 8-128 characters and include uppercase, lowercase, and a number', { code: 'WEAK_PASSWORD' });
    }

    const existingUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
    });

    if (existingUser) {
        throw new ApiError(409, existingUser.email === normalizedEmail ? 'User already exists' : 'Username already taken', { code: 'USER_EXISTS' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const savedUser = await User.create({
        firstname: trimmedFirstname,
        username: normalizedUsername,
        email: normalizedEmail,
        password: hashedPassword
    });

    generateToken(savedUser._id, res);

    return res.status(201).json(toPublicUser(savedUser));
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || typeof password !== 'string' || !password || password.length > 128) {
        throw new ApiError(400, 'All fields are required', { code: 'VALIDATION_ERROR' });
    }

    if (normalizedEmail.length > 254 || !isValidEmail(normalizedEmail)) {
        throw new ApiError(400, 'Invalid email format', { code: 'VALIDATION_ERROR' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
        throw new ApiError(400, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
    }

    generateToken(user._id, res);

    await ensureUsername(user);

    return res.status(200).json(toPublicUser(user));
};

export const logout = async (req, res) => {
    res.clearCookie('ChatAppToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: '/'
    });

    return res.status(200).json({ message: 'Logout successful' });
};

export const updateProfile = async (req, res) => {
    const { profilePicture } = req.body;
    const userId = req.user._id;

    if (typeof profilePicture !== 'string') {
        throw new ApiError(400, 'Profile pic is required', { code: 'VALIDATION_ERROR' });
    }

    const imageMatch = profilePicture.match(profileImagePattern);
    if (!imageMatch) {
        throw new ApiError(400, 'Only JPEG, PNG, or WebP profile images are allowed', { code: 'INVALID_IMAGE' });
    }

    const padding = imageMatch[1].endsWith('==') ? 2 : imageMatch[1].endsWith('=') ? 1 : 0;
    const imageBytes = Math.floor(imageMatch[1].length * 3 / 4) - padding;
    if (imageBytes > MAX_PROFILE_IMAGE_BYTES) {
        throw new ApiError(413, 'Profile image must be 5MB or smaller', { code: 'IMAGE_TOO_LARGE' });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
        folder: "uploads",
        quality: "auto:eco",
        fetch_format: "auto",
        width: 1600,
        crop: "limit"
    });

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePicture: uploadResponse.secure_url },
        { new: true }
    );

    return res.status(200).json(toPublicUser(updatedUser));
};

export const checkAuth = async (req, res) => {
    const user = await User.findById(req.user._id);
    await ensureUsername(user);
    return res.status(200).json(toPublicUser(user));
};

export const forgotPassword = async (req, res) => {
    const email = normalizeEmail(req.body.email);

    if (!email || !isValidEmail(email)) {
        throw new ApiError(400, 'Valid email is required', { code: 'VALIDATION_ERROR' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(200).json(forgotPasswordResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetBaseUrl = process.env.PASSWORD_RESET_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${resetBaseUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

    await sendPasswordResetEmail({ to: user.email, resetUrl });

    if (process.env.NODE_ENV !== "production") {
        return res.status(200).json({
            ...forgotPasswordResponse,
            resetToken,
            resetUrl
        });
    }

    return res.status(200).json(forgotPasswordResponse);
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!/^[a-f0-9]{64}$/i.test(token || '')) {
        throw new ApiError(400, 'Reset token is required', { code: 'VALIDATION_ERROR' });
    }

    if (!isStrongPassword(password)) {
        throw new ApiError(400, 'Password must be 8-128 characters and include uppercase, lowercase, and a number', { code: 'WEAK_PASSWORD' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
        throw new ApiError(400, 'Reset token is invalid or expired', { code: 'INVALID_RESET_TOKEN' });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date(Date.now() - 1000);
    await user.save();

    generateToken(user._id, res);

    return res.status(200).json(toPublicUser(user));
};
