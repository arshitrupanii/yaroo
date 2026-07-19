import mongoose from 'mongoose';
import User from '../model/user.model.js';
import { ApiError } from '../lib/ApiError.js';
import { emitToUser } from '../lib/socket.js';

const publicFields = '_id firstname username email profilePicture';

const toPublicUser = (user) => ({
    _id: user._id,
    firstname: user.firstname,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture
});

const ensureValidUserId = (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid user id', { code: 'INVALID_ID' });
    }
};

const hasId = (ids, userId) => ids.some((id) => id.toString() === userId.toString());

const emitFriendUpdate = (userId, payload = {}) => {
    emitToUser(userId, 'friendUpdate', payload);
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

    if (hasId(currentUser.friends, userId)) {
        throw new ApiError(409, 'You are already friends', { code: 'ALREADY_FRIENDS' });
    }

    if (hasId(currentUser.friendRequestsSent, userId)) {
        throw new ApiError(409, 'Friend request already sent', { code: 'REQUEST_ALREADY_SENT' });
    }

    const acceptsExistingRequest = hasId(currentUser.friendRequestsReceived, userId);

    if (acceptsExistingRequest) {
        currentUser.friends.addToSet(targetUser._id);
        targetUser.friends.addToSet(currentUser._id);
        currentUser.friendRequestsReceived.pull(targetUser._id);
        targetUser.friendRequestsSent.pull(currentUser._id);
    } else {
        currentUser.friendRequestsSent.addToSet(targetUser._id);
        targetUser.friendRequestsReceived.addToSet(currentUser._id);
    }

    await Promise.all([currentUser.save(), targetUser.save()]);

    emitFriendUpdate(targetUser._id, acceptsExistingRequest
        ? { type: 'friend_request_accepted', from: toPublicUser(currentUser) }
        : { type: 'friend_request_received', from: toPublicUser(currentUser) }
    );
    emitFriendUpdate(currentUser._id, { type: 'friends_changed', silent: true });

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

    if (!hasId(currentUser.friendRequestsReceived, userId)) {
        throw new ApiError(404, 'Friend request not found', { code: 'REQUEST_NOT_FOUND' });
    }

    currentUser.friends.addToSet(requester._id);
    requester.friends.addToSet(currentUser._id);
    currentUser.friendRequestsReceived.pull(requester._id);
    requester.friendRequestsSent.pull(currentUser._id);

    await Promise.all([currentUser.save(), requester.save()]);

    emitFriendUpdate(requester._id, { type: 'friend_request_accepted', from: toPublicUser(currentUser) });
    emitFriendUpdate(currentUser._id, { type: 'friends_changed', silent: true });

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

    if (!hasId(currentUser.friendRequestsReceived, userId)) {
        throw new ApiError(404, 'Friend request not found', { code: 'REQUEST_NOT_FOUND' });
    }

    currentUser.friendRequestsReceived.pull(requester._id);
    requester.friendRequestsSent.pull(currentUser._id);

    await Promise.all([currentUser.save(), requester.save()]);

    emitFriendUpdate(requester._id, { type: 'friend_request_rejected', from: toPublicUser(currentUser) });
    emitFriendUpdate(currentUser._id, { type: 'friends_changed', silent: true });

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

    if (!hasId(currentUser.friends, userId)) {
        throw new ApiError(409, 'You are not friends with this user', { code: 'NOT_FRIENDS' });
    }

    currentUser.friends.pull(friend._id);
    friend.friends.pull(currentUser._id);

    await Promise.all([currentUser.save(), friend.save()]);

    emitFriendUpdate(friend._id, { type: 'friend_removed', from: toPublicUser(currentUser) });
    emitFriendUpdate(currentUser._id, { type: 'friends_changed', silent: true });

    return res.status(200).json({ message: 'Friend removed' });
};
