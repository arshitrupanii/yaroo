import User from '../model/user.model.js';
import Message from '../model/message.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUserFromSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password -createdAt -updatedAt");

        return res.status(200).json(filteredUsers);

    } catch (error) {
        console.log("error in get User From Sidebar :  ", error);
        return res.status(500).json({ message: 'Internal error Get User' });
    }
}

export const getMessage = async (req, res) => {
    try {
        const { id: userToChatid } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatid },
                { senderId: userToChatid, receiverId: myId }
            ]
        }).sort({ createdAt: 1 });

        return res.status(200).json(messages);

    } catch (error) {
        console.log("error in get Message :  ", error);
        return res.status(500).json({ message: 'Internal error Get Message' });
    }
}

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({ message: 'Text is required' });
        }

        let imageUrl;

        if (image) {
            // it compress image and save
            const uploadResponse = await cloudinary.uploader.upload(image, {
                folder: "uploads",
                quality: "auto:eco",
                fetch_format: "auto",
                width: 1600,
                crop: "limit"
            });

            imageUrl = uploadResponse.secure_url;
        }


        const newMessage = new Message({ senderId, receiverId, text, image: imageUrl });
        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        return res.status(201).json(newMessage);

    } catch (error) {
        console.log("error in send message :  ", error)
        return res.status(500).json({ message: 'Internal error Send Message' });
    }
}