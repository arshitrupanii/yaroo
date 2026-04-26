import User from '../model/user.model.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import cloudinary from '../lib/cloudinary.js';


export const signup = async (req, res) => {
    const { firstname, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const newUser = new User({
            firstname,
            email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();
        generateToken(savedUser._id, res);

        return res.status(201).json({
            _id: savedUser._id,
            firstname: savedUser.firstname,
            email: savedUser.email,
            profilePicture: savedUser.profilePicture,
        });

    } catch (error) {
        console.log("error in signup : ", error);
        return res.status(500).json({ message: "Signup failed" });
    }
};


export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        generateToken(user._id, res);

        return res.status(200).json({
            _id: user._id,
            firstname: user.firstname,
            email: user.email,
            profilePicture: user.profilePicture,
        });

    } catch (error) {
        console.log("error in login : ", error);
        return res.status(500).json({ message: "Login failed" });
    }
};


export const logout = async (req, res) => {
    try {
        res.clearCookie('ChatAppToken', { maxAge: 0 });
        return res.status(200).json({ message: 'Logout successful' });

    } catch (error) {
        console.log("error in logout : ", error);
        return res.status(500).json({ message: "Logout failed" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { profilePicture } = req.body;

        const userId = req.user._id;

        if (!profilePicture) {
            return res.status(400).json({ message: "Profile pic is required" });
        }

        // it compress image and save
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

        return res.status(200).json(updatedUser);

    } catch (error) {
        console.log("error in update profiles : ", error);
        return res.status(500).json({ message: "Update failed" });
    }
};

export const checkAuth = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json(user);

    } catch (error) {
        console.log("error in checkAuth : ", error);
        return res.status(500).json({ message: "Check auth failed" });
    }
}