import Group from "../model/group.model.js";
import Message from "../model/message.model.js";
import User from "../model/user.model.js";
import { ApiError } from "../lib/ApiError.js";
import { emitToUsers } from "../lib/socket.js";
import mongoose from "mongoose";

const userFields = "_id firstname username profilePicture";
const MAX_GROUP_MEMBERS = 100;

const toObjectIdString = (value) => value.toString();

const assertGroupMember = (group, userId) => {
  if (!group?.members.some((memberId) => memberId.toString() === userId.toString())) {
    throw new ApiError(403, "You are not in this group", { code: "GROUP_FORBIDDEN" });
  }
};

const decorateGroup = async (group, userId) => {
  const [unreadCount, lastMessage] = await Promise.all([
    Message.countDocuments({
      groupId: group._id,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
      deletedAt: { $exists: false },
      deletedFor: { $ne: userId },
    }),
    Message.findOne({
      groupId: group._id,
      deletedAt: { $exists: false },
      deletedFor: { $ne: userId },
    }).sort({ createdAt: -1 }).lean(),
  ]);

  return {
    ...group.toObject(),
    type: "group",
    unreadCount,
    lastMessage,
  };
};

export const getGroups = async (req, res) => {
  const userId = req.user._id;
  const groups = await Group.find({ members: userId })
    .populate("members", userFields)
    .populate("createdBy", userFields)
    .sort({ updatedAt: -1 });

  const decoratedGroups = await Promise.all(groups.map((group) => decorateGroup(group, userId)));

  return res.status(200).json(decoratedGroups);
};

export const createGroup = async (req, res) => {
  const creatorId = req.user._id;
  const name = req.body.name?.trim();
  const rawMemberIds = req.body.memberIds;
  const memberIds = Array.isArray(rawMemberIds)
    ? [...new Set(rawMemberIds.map(String))].filter(Boolean)
    : [];

  if (!name || name.length < 2 || name.length > 40) {
    throw new ApiError(400, "Group name must be between 2 and 40 characters", { code: "VALIDATION_ERROR" });
  }

  if (!Array.isArray(rawMemberIds) || memberIds.length < 1 || memberIds.length > MAX_GROUP_MEMBERS) {
    throw new ApiError(400, `Choose between 1 and ${MAX_GROUP_MEMBERS} friends`, { code: "VALIDATION_ERROR" });
  }

  if (memberIds.some((memberId) => !mongoose.Types.ObjectId.isValid(memberId))) {
    throw new ApiError(400, "Invalid group member", { code: "INVALID_ID" });
  }

  const creator = await User.findById(creatorId).select("friends");
  const friendIdSet = new Set((creator?.friends || []).map(toObjectIdString));
  const invalidMember = memberIds.find((memberId) => !friendIdSet.has(memberId));

  if (invalidMember) {
    throw new ApiError(403, "Groups can only include your friends", { code: "NOT_FRIENDS" });
  }

  const members = [creatorId, ...memberIds];
  const group = await Group.create({ name, createdBy: creatorId, members });
  const populatedGroup = await Group.findById(group._id)
    .populate("members", userFields)
    .populate("createdBy", userFields);

  const decoratedGroup = await decorateGroup(populatedGroup, creatorId);

  emitToUsers(members, "groupUpdated", decoratedGroup);

  return res.status(201).json(decoratedGroup);
};

export const getGroupMessages = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const group = await Group.findById(id).select("members");

  if (!group) throw new ApiError(404, "Group not found", { code: "GROUP_NOT_FOUND" });
  assertGroupMember(group, userId);

  await Message.updateMany(
    {
      groupId: group._id,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
      deletedAt: { $exists: false },
      deletedFor: { $ne: userId },
    },
    { $addToSet: { readBy: userId }, readAt: new Date() }
  );

  const messages = await Message.find({
    groupId: group._id,
    deletedAt: { $exists: false },
    deletedFor: { $ne: userId },
  })
    .populate("senderId", userFields)
    .sort({ createdAt: 1 });

  return res.status(200).json(messages);
};

export const markGroupMessagesSeen = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const group = await Group.findById(id).select("members");

  if (!group) throw new ApiError(404, "Group not found", { code: "GROUP_NOT_FOUND" });
  assertGroupMember(group, userId);

  const seenUpdate = await Message.updateMany(
    {
      groupId: group._id,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
      deletedAt: { $exists: false },
      deletedFor: { $ne: userId },
    },
    { $addToSet: { readBy: userId }, readAt: new Date() }
  );

  return res.status(200).json({ updatedCount: seenUpdate.modifiedCount });
};
