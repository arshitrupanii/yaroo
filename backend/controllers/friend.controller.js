import mongoose from 'mongoose';
import User from '../model/user.model.js';
import { ApiError } from '../lib/ApiError.js';
import { getReceiverSocketId, io } from '../lib/socket.js';

const publicFields = '_id firstname username email profilePicture';

const ensureValidUserId = (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid user id', { code: 'INVALID_ID' });
    }
};

const emitFriendUpdate = (userId) => {
    const socketId = getReceiverSocketId(userId.toString());
    if (socketId) io.to(socketId).emit('friendUpdate');
};

export const getFriendsOverview = async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('friends', publicFields)
        .populate('friendRequestsSent', publicFields)
        .populate('friendRequestsReceived', publicFields)
        .select('friends friendRequestsSent friendRequestsReceived');

    return res.status(200).json({
        friends: user.friends,
        sent: user.friendRequestsSent,
        received: user.friendRequestsReceived
    });
};

export const sendFriendRequest = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    ensureValidUserId(userId);

    if (userId === currentUserId) {
        throw new ApiError(400, 'You cannot add yourself', { code: 'INVALID_FRIEND_REQUEST' });
    }

    const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(userId)
    ]);

    if (!targetUser) {
        throw new ApiError(404, 'User not found', { code: 'USER_NOT_FOUND' });
    }

    if (currentUser.friends.some((id) => id.toString() === userId)) {
        throw new ApiError(409, 'You are already friends', { code: 'ALREADY_FRIENDS' });
    }

    if (currentUser.friendRequestsSent.some((id) => id.toString() === userId)) {
        throw new ApiError(409, 'Friend request already sent', { code: 'REQUEST_ALREADY_SENT' });
    }

    if (currentUser.friendRequestsReceived.some((id) => id.toString() === userId)) {
        currentUser.friends.addToSet(targetUser._id);
        targetUser.friends.addToSet(currentUser._id);
        currentUser.friendRequestsReceived.pull(targetUser._id);
        targetUser.friendRequestsSent.pull(currentUser._id);
    } else {
        currentUser.friendRequestsSent.addToSet(targetUser._id);
        targetUser.friendRequestsReceived.addToSet(currentUser._id);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    emitFriendUpdate(targetUser._id);
    emitFriendUpdate(currentUser._id);

    return res.status(200).json({ message: 'Friend request updated' });
};

export const acceptFriendRequest = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    ensureValidUserId(userId);

    const [currentUser, requester] = await Promise.all([
        User.findById(currentUserId),
        User.findById(userId)
    ]);

    if (!requester) {
        throw new ApiError(404, 'User not found', { code: 'USER_NOT_FOUND' });
    }

    if (!currentUser.friendRequestsReceived.some((id) => id.toString() === userId)) {
        throw new ApiError(404, 'Friend request not found', { code: 'REQUEST_NOT_FOUND' });
    }

    currentUser.friends.addToSet(requester._id);
    requester.friends.addToSet(currentUser._id);
    currentUser.friendRequestsReceived.pull(requester._id);
    requester.friendRequestsSent.pull(currentUser._id);

    await Promise.all([currentUser.save(), requester.save()]);

    emitFriendUpdate(requester._id);
    emitFriendUpdate(currentUser._id);

    return res.status(200).json({ message: 'Friend request accepted' });
};

export const rejectFriendRequest = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    ensureValidUserId(userId);

    const [currentUser, requester] = await Promise.all([
        User.findById(currentUserId),
        User.findById(userId)
    ]);

    if (!requester) {
        throw new ApiError(404, 'User not found', { code: 'USER_NOT_FOUND' });
    }

    currentUser.friendRequestsReceived.pull(requester._id);
    requester.friendRequestsSent.pull(currentUser._id);

    await Promise.all([currentUser.save(), requester.save()]);

    emitFriendUpdate(requester._id);
    emitFriendUpdate(currentUser._id);

    return res.status(200).json({ message: 'Friend request rejected' });
};

export const removeFriend = async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    ensureValidUserId(userId);

    const [currentUser, friend] = await Promise.all([
        User.findById(currentUserId),
        User.findById(userId)
    ]);

    if (!friend) {
        throw new ApiError(404, 'User not found', { code: 'USER_NOT_FOUND' });
    }

    currentUser.friends.pull(friend._id);
    friend.friends.pull(currentUser._id);

    await Promise.all([currentUser.save(), friend.save()]);

    emitFriendUpdate(friend._id);
    emitFriendUpdate(currentUser._id);

    return res.status(200).json({ message: 'Friend removed' });
};
