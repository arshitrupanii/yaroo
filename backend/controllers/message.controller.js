import User from '../model/user.model.js';
import Message from '../model/message.model.js';
import Group from '../model/group.model.js';
import cloudinary from '../lib/cloudinary.js';
import { emitToUser, emitToUsers, emitToUserWithAck } from "../lib/socket.js";
import { ApiError } from '../lib/ApiError.js';

const userFields = "-password -createdAt -updatedAt -friendRequestsSent -friendRequestsReceived";
const publicUserFields = "_id firstname username email profilePicture";

const toPublicUser = (user) => ({
    _id: user._id,
    firstname: user.firstname,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture
});

const assertFriends = async (userId, otherUserId) => {
    const user = await User.findById(userId).select('friends');
    if (!user?.friends.some((id) => id.toString() === otherUserId.toString())) {
        throw new ApiError(403, 'You can only message friends', { code: 'NOT_FRIENDS' });
    }
};

const emitMessageWithDeliveryAck = (message, sender) => {
    const messagePayload = {
        ...message.toObject(),
        sender
    };

    emitToUserWithAck(message.receiverId, "newMessage", messagePayload, 5000, async (error, responses = []) => {
        const delivered = responses.some((response) => response?.received === true);

        if (!delivered) {
            if (error) console.warn(`Message ${message._id} was not acknowledged by receiver sockets`);
            return;
        }

        try {
            const deliveredMessage = await Message.findOneAndUpdate(
                { _id: message._id, status: 'sent' },
                { status: 'delivered' },
                { new: true }
            );

            if (!deliveredMessage) return;

            emitToUsers([message.senderId, message.receiverId], "messageUpdated", deliveredMessage);
        } catch (deliveryError) {
            console.error(`Failed to update delivery status for ${message._id}: ${deliveryError.message}`);
        }
    });
};

const getMemberIds = (group) => group.members.map((memberId) => memberId.toString());

const markConversationMessagesSeen = async (viewerId, senderId) => {
    const seenUpdate = await Message.updateMany(
        {
            senderId,
            receiverId: viewerId,
            status: { $ne: 'seen' },
            deletedAt: { $exists: false },
            deletedFor: { $ne: viewerId }
        },
        { status: 'seen', readAt: new Date() }
    );

    if (seenUpdate.modifiedCount > 0) {
        emitToUser(senderId, "messagesSeen", { by: viewerId, conversationId: viewerId });
    }

    return seenUpdate.modifiedCount;
};

export const getUserFromSidebar = async (req, res) => {
    const loggedInUserId = req.user._id;
    const currentUser = await User.findById(loggedInUserId)
        .populate('friends', '_id firstname username email profilePicture')
        .select('friends');

    const friends = currentUser?.friends || [];
    const friendIds = friends.map((friend) => friend._id);

    const unreadCounts = await Message.aggregate([
        {
            $match: {
                senderId: { $in: friendIds },
                receiverId: loggedInUserId,
                status: { $ne: 'seen' },
                deletedAt: { $exists: false },
                deletedFor: { $ne: loggedInUserId }
            }
        },
        { $group: { _id: '$senderId', count: { $sum: 1 } } }
    ]);

    const unreadCountByUserId = new Map(
        unreadCounts.map((item) => [item._id.toString(), item.count])
    );

    const lastMessages = friendIds.length > 0
        ? await Message.aggregate([
            {
                $match: {
                    deletedAt: { $exists: false },
                    deletedFor: { $ne: loggedInUserId },
                    $or: [
                        { senderId: loggedInUserId, receiverId: { $in: friendIds } },
                        { senderId: { $in: friendIds }, receiverId: loggedInUserId }
                    ]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $addFields: {
                    conversationUserId: {
                        $cond: [
                            { $eq: ['$senderId', loggedInUserId] },
                            '$receiverId',
                            '$senderId'
                        ]
                    }
                }
            },
            { $group: { _id: '$conversationUserId', message: { $first: '$$ROOT' } } }
        ])
        : [];

    const lastMessageByUserId = new Map(
        lastMessages.map((item) => [item._id.toString(), item.message])
    );

    const friendsWithUnreadCounts = friends.map((friend) => ({
        ...friend.toObject(),
        unreadCount: unreadCountByUserId.get(friend._id.toString()) || 0,
        lastMessage: lastMessageByUserId.get(friend._id.toString()) || null
    }));

    return res.status(200).json(friendsWithUnreadCounts);
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
    await markConversationMessagesSeen(myId, userToChatid);

    const messages = await Message.find({
        deletedAt: { $exists: false },
        deletedFor: { $ne: myId },
        $or: [
            { senderId: myId, receiverId: userToChatid },
            { senderId: userToChatid, receiverId: myId }
        ]
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
};

export const markMessagesSeen = async (req, res) => {
    const { id: userToChatid } = req.params;
    const myId = req.user._id;

    await assertFriends(myId, userToChatid);

    const updatedCount = await markConversationMessagesSeen(myId, userToChatid);

    return res.status(200).json({ updatedCount });
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

    const newMessage = await Message.create({
        senderId,
        receiverId,
        text,
        image: imageUrl,
        status: 'sent'
    });

    emitMessageWithDeliveryAck(newMessage, toPublicUser(req.user));

    return res.status(201).json(newMessage);
};

export const sendGroupMessage = async (req, res) => {
    const { text, image } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId).select('members name updatedAt');
    if (!group) throw new ApiError(404, 'Group not found', { code: 'GROUP_NOT_FOUND' });

    const memberIds = getMemberIds(group);
    if (!memberIds.includes(senderId.toString())) {
        throw new ApiError(403, 'You are not in this group', { code: 'GROUP_FORBIDDEN' });
    }

    if (!text && !image) {
        throw new ApiError(400, 'Text or image is required', { code: 'VALIDATION_ERROR' });
    }

    let imageUrl;

    if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
            folder: "uploads/groups",
            quality: "auto:eco",
            fetch_format: "auto",
            width: 1600,
            crop: "limit"
        });

        imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
        senderId,
        groupId,
        text,
        image: imageUrl,
        status: 'sent',
        readBy: [senderId]
    });

    await Group.findByIdAndUpdate(groupId, { updatedAt: new Date() });
    const populatedMessage = await Message.findById(newMessage._id).populate("senderId", publicUserFields);
    const payload = {
        ...populatedMessage.toObject(),
        group: { _id: group._id, name: group.name, members: group.members },
    };

    emitToUsers(memberIds, "newGroupMessage", payload);

    return res.status(201).json(populatedMessage);
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

    if (message.groupId) {
        const group = await Group.findById(message.groupId).select("members");
        if (group) emitToUsers(group.members, "messageUpdated", message);
    } else {
        emitToUser(message.receiverId, "messageUpdated", message);
    }

    return res.status(200).json(message);
};

export const deleteMessage = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findOne({
        _id: id,
        $or: [{ senderId: userId }, { receiverId: userId }, { groupId: { $exists: true } }]
    });

    if (!message) {
        throw new ApiError(404, 'Message not found', { code: 'MESSAGE_NOT_FOUND' });
    }

    if (message.groupId) {
        const group = await Group.findById(message.groupId).select("members");
        if (!group?.members.some((memberId) => memberId.toString() === userId.toString())) {
            throw new ApiError(403, 'You are not in this group', { code: 'GROUP_FORBIDDEN' });
        }
    }

    if (message.senderId.toString() === userId.toString()) {
        message.deletedAt = new Date();
        message.text = '';
        message.image = '';

        const payload = {
            _id: message._id,
            senderId: message.senderId,
            receiverId: message.receiverId,
            groupId: message.groupId,
            status: message.status
        };

        if (message.groupId) {
            const group = await Group.findById(message.groupId).select("members");
            if (group) emitToUsers(group.members, "messageDeleted", payload);
        } else {
            emitToUser(message.receiverId, "messageDeleted", payload);
        }
    } else {
        message.deletedFor.addToSet(userId);
    }

    await message.save();

    return res.status(200).json({ message: 'Message deleted', messageId: id });
};
