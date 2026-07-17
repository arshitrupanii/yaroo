import User from '../model/user.model.js';
import Message from '../model/message.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from "../lib/socket.js";
import { ApiError } from '../lib/ApiError.js';

const userFields = "-password -createdAt -updatedAt -friendRequestsSent -friendRequestsReceived";

const assertFriends = async (userId, otherUserId) => {
    const user = await User.findById(userId).select('friends');
    if (!user?.friends.some((id) => id.toString() === otherUserId.toString())) {
        throw new ApiError(403, 'You can only message friends', { code: 'NOT_FRIENDS' });
    }
};

export const getUserFromSidebar = async (req, res) => {
    const loggedInUserId = req.user._id;
    const currentUser = await User.findById(loggedInUserId)
        .populate('friends', '_id firstname username email profilePicture')
        .select('friends');

    return res.status(200).json(currentUser?.friends || []);
};

export const getSearchUser = async (req, res) => {
    const loggedInUserId = req.user._id;
    const { username } = req.params;

    if (!username || username.trim().length < 1) {
        throw new ApiError(400, 'Username is required', { code: 'VALIDATION_ERROR' });
    }

    const escapedUsername = username.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const currentUser = await User.findById(loggedInUserId).select('friends friendRequestsSent friendRequestsReceived');
    const users = await User.find({
        _id: { $ne: loggedInUserId },
        $or: [
            { firstname: { $regex: escapedUsername, $options: 'i' } },
            { username: { $regex: escapedUsername, $options: 'i' } }
        ]
    })
        .select(userFields)
        .limit(10);

    const decoratedUsers = users.map((user) => {
        const userObject = user.toObject();
        const id = user._id.toString();

        return {
            ...userObject,
            friendshipStatus: currentUser.friends.some((friendId) => friendId.toString() === id)
                ? 'friends'
                : currentUser.friendRequestsSent.some((friendId) => friendId.toString() === id)
                    ? 'sent'
                    : currentUser.friendRequestsReceived.some((friendId) => friendId.toString() === id)
                        ? 'received'
                        : 'none'
        };
    });

    return res.status(200).json(decoratedUsers);
};

export const getMessage = async (req, res) => {
    const { id: userToChatid } = req.params;
    const myId = req.user._id;

    await assertFriends(myId, userToChatid);

    const messages = await Message.find({
        deletedFor: { $ne: myId },
        $or: [
            { senderId: myId, receiverId: userToChatid },
            { senderId: userToChatid, receiverId: myId }
        ]
    }).sort({ createdAt: 1 });

    const seenUpdate = await Message.updateMany(
        {
            senderId: userToChatid,
            receiverId: myId,
            status: { $ne: 'seen' }
        },
        { status: 'seen', readAt: new Date() }
    );

    if (seenUpdate.modifiedCount > 0) {
        const senderSocketId = getReceiverSocketId(userToChatid);
        if (senderSocketId) {
            io.to(senderSocketId).emit("messagesSeen", { by: myId, conversationId: userToChatid });
        }
    }

    return res.status(200).json(messages);
};

export const sendMessage = async (req, res) => {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    await assertFriends(senderId, receiverId);

    if (!text && !image) {
        throw new ApiError(400, 'Text or image is required', { code: 'VALIDATION_ERROR' });
    }

    let imageUrl;

    if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: "uploads",
            quality: "auto:eco",
            fetch_format: "auto",
            width: 1600,
            crop: "limit"
        });

        imageUrl = uploadResponse.secure_url;
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    const newMessage = await Message.create({
        senderId,
        receiverId,
        text,
        image: imageUrl,
        status: receiverSocketId ? 'delivered' : 'sent'
    });

    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
};

export const editMessage = async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const senderId = req.user._id;

    if (!text?.trim()) {
        throw new ApiError(400, 'Message text is required', { code: 'VALIDATION_ERROR' });
    }

    const message = await Message.findOne({ _id: id, senderId, deletedAt: { $exists: false } });

    if (!message) {
        throw new ApiError(404, 'Message not found', { code: 'MESSAGE_NOT_FOUND' });
    }

    message.text = text.trim();
    message.editedAt = new Date();
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageUpdated", message);
    }

    return res.status(200).json(message);
};

export const deleteMessage = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({
        _id: id,
        $or: [{ senderId: userId }, { receiverId: userId }]
    });

    if (!message) {
        throw new ApiError(404, 'Message not found', { code: 'MESSAGE_NOT_FOUND' });
    }

    if (message.senderId.toString() === userId.toString()) {
        message.deletedAt = new Date();
        message.text = '';
        message.image = '';

        const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", { _id: message._id });
        }
    } else {
        message.deletedFor.addToSet(userId);
    }

    await message.save();

    return res.status(200).json({ message: 'Message deleted', messageId: id });
};
