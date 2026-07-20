import { create } from "zustand";
import toast from "react-hot-toast";
import { Axiosinstance } from "../lib/axios";
import { useAuthStore } from "./useAuhstore";
import { formatApiError } from "../lib/apiError";

const PINNED_CHATS_KEY = "yaroo:pinned-chats";
const MAX_NOTIFICATIONS = 20;

const loadPinnedUserIds = () => {
  try {
    return JSON.parse(localStorage.getItem(PINNED_CHATS_KEY) || "[]");
  } catch {
    return [];
  }
};

const savePinnedUserIds = (pinnedUserIds) => {
  localStorage.setItem(PINNED_CHATS_KEY, JSON.stringify(pinnedUserIds));
};

let usersAbortController = null;
let usersRequestId = 0;
let messageSocketHandlers = null;

const normalizeMessages = (messages) => {
  const messagesById = new Map();
  messages.forEach((message) => {
    if (message?._id) messagesById.set(message._id, message);
  });

  return Array.from(messagesById.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

const upsertMessage = (messages, nextMessage) => {
  if (!nextMessage?._id) return messages;
  const exists = messages.some((message) => message._id === nextMessage._id);
  if (!exists) return normalizeMessages([...messages, nextMessage]);

  return normalizeMessages(
    messages.map((message) => (message._id === nextMessage._id ? { ...message, ...nextMessage } : message))
  );
};

const upsertGroup = (groups, nextGroup) => {
  if (!nextGroup?._id) return groups;
  const exists = groups.some((group) => group._id === nextGroup._id);
  const nextGroups = exists
    ? groups.map((group) => (group._id === nextGroup._id ? { ...group, ...nextGroup } : group))
    : [nextGroup, ...groups];

  return nextGroups.sort((a, b) => {
    const aTime = new Date(a.lastMessage?.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.lastMessage?.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });
};

const isRequestCanceled = (error) => (
  error?.code === "ERR_CANCELED" || error?.name === "CanceledError"
);

const logStoreError = (...args) => {
  if (import.meta.env.DEV) console.error(...args);
};

const updateUserUnreadCount = (users, userId, updater) => (
  users.map((user) => (
    user._id === userId
      ? { ...user, unreadCount: Math.max(0, updater(user.unreadCount || 0)) }
      : user
  ))
);

const updateGroupUnreadCount = (groups, groupId, updater) => (
  groups.map((group) => (
    group._id === groupId
      ? { ...group, unreadCount: Math.max(0, updater(group.unreadCount || 0)) }
      : group
  ))
);

const updateUserLastMessage = (users, userId, lastMessage) => (
  users.map((user) => (user._id === userId ? { ...user, lastMessage } : user))
);

const updateGroupLastMessage = (groups, groupId, lastMessage) => (
  groups.map((group) => (group._id === groupId ? { ...group, lastMessage } : group))
);

const updateLastMessageIfMatching = (items, message) => (
  items.map((item) => (
    item.lastMessage?._id === message._id
      ? { ...item, lastMessage: { ...item.lastMessage, ...message } }
      : item
  ))
);

const clearLastMessageIfMatching = (items, messageId) => (
  items.map((item) => (item.lastMessage?._id === messageId ? { ...item, lastMessage: null } : item))
);

const getMessageSenderId = (message) => (
  typeof message?.senderId === "object" ? message.senderId?._id : message?.senderId
);

const getDisplayName = (user) => user?.firstname || user?.username || "Someone";

const getConversationName = (conversation) => (
  conversation?.type === "group" ? conversation.name : getDisplayName(conversation)
);

const getMessagePreview = (message) => {
  if (message?.text?.trim()) return message.text.trim();
  if (message?.image) return "Sent an image";
  return "Sent a message";
};

const getFriendNotificationMessage = (payload = {}) => {
  if (payload.silent) return null;
  const name = getDisplayName(payload.from);

  if (payload.type === "friend_request_received") return `${name} sent you a friend request`;
  if (payload.type === "friend_request_accepted") return `${name} accepted your request`;
  if (payload.type === "friend_request_rejected") return `${name} declined your request`;
  if (payload.type === "friend_removed") return `${name} removed you from friends`;

  return null;
};

const addNotificationToList = (notifications, notification) => {
  const withoutDuplicate = notifications.filter((item) => item.id !== notification.id);
  return [notification, ...withoutDuplicate].slice(0, MAX_NOTIFICATIONS);
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  notifications: [],
  unreadNotificationCount: 0,
  friendRequests: { friends: [], sent: [], received: [] },
  selectedUser: null,
  pinnedUserIds: loadPinnedUserIds(),
  userSearchText: "",
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: {},

  getUsers: async () => {
    usersAbortController?.abort();
    usersAbortController = new AbortController();
    const requestId = ++usersRequestId;

    set({ isUsersLoading: true });

    try {
      const res = await Axiosinstance.get("/messages/users", {
        signal: usersAbortController.signal,
      });
      if (requestId !== usersRequestId) return;
      set({ users: res.data });
    } catch (error) {
      if (isRequestCanceled(error)) return;
      logStoreError("error in get user : ", error);
      toast.error(formatApiError(error, "Could not load users"));
    } finally {
      if (requestId === usersRequestId) set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    try {
      const res = await Axiosinstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      logStoreError("error in get groups : ", error);
      toast.error(formatApiError(error, "Could not load groups"));
    }
  },

  createGroup: async ({ name, memberIds }) => {
    try {
      const res = await Axiosinstance.post("/groups", { name, memberIds });
      set({
        groups: upsertGroup(get().groups, res.data),
        selectedUser: res.data,
        messages: [],
      });
      toast.success("Group created");
    } catch (error) {
      toast.error(formatApiError(error, "Could not create group"));
      throw error;
    }
  },

  searchUsers: async (username) => {
    const searchText = username.trim();
    if (!searchText) return get().getUsers();

    usersAbortController?.abort();
    usersAbortController = new AbortController();
    const requestId = ++usersRequestId;

    set({ isUsersLoading: true });

    try {
      const res = await Axiosinstance.get(`/messages/search/${encodeURIComponent(searchText)}`, {
        signal: usersAbortController.signal,
      });
      if (requestId !== usersRequestId) return;
      set({ users: res.data });
    } catch (error) {
      if (isRequestCanceled(error)) return;
      logStoreError("error in search user : ", error);
      toast.error(formatApiError(error, "Could not search users"));
    } finally {
      if (requestId === usersRequestId) set({ isUsersLoading: false });
    }
  },

  getFriendRequests: async () => {
    try {
      const res = await Axiosinstance.get("/friends");
      set({ friendRequests: res.data });
    } catch (error) {
      logStoreError("error in get friends : ", error);
      toast.error(formatApiError(error, "Could not load friends"));
    }
  },

  sendFriendRequest: async (userId) => {
    try {
      await Axiosinstance.post(`/friends/request/${userId}`);
      toast.success("Friend request sent");
      await get().getFriendRequests();
      await get().getUsers();
    } catch (error) {
      toast.error(formatApiError(error, "Could not send friend request"));
    }
  },

  acceptFriendRequest: async (userId) => {
    try {
      await Axiosinstance.post(`/friends/accept/${userId}`);
      toast.success("Friend request accepted");
      await get().getFriendRequests();
      await get().getUsers();
    } catch (error) {
      toast.error(formatApiError(error, "Could not accept friend request"));
    }
  },

  rejectFriendRequest: async (userId) => {
    try {
      await Axiosinstance.post(`/friends/reject/${userId}`);
      toast.success("Friend request rejected");
      await get().getFriendRequests();
    } catch (error) {
      toast.error(formatApiError(error, "Could not reject friend request"));
    }
  },

  getMessages: async (conversationId) => {
    const { selectedUser } = get();
    const isGroup = selectedUser?.type === "group";
    set({ isMessagesLoading: true });

    try {
      const res = await Axiosinstance.get(isGroup ? `/groups/${conversationId}/messages` : `/messages/${conversationId}`);
      set({
        messages: normalizeMessages(res.data),
        users: isGroup ? get().users : updateUserUnreadCount(get().users, conversationId, () => 0),
        groups: isGroup ? updateGroupUnreadCount(get().groups, conversationId, () => 0) : get().groups,
      });
    } catch (error) {
      logStoreError("error in get message : ", error);
      toast.error(formatApiError(error, "Could not load messages"));
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  markMessagesSeen: async (userId) => {
    try {
      await Axiosinstance.patch(`/messages/seen/${userId}`);
      set({ users: updateUserUnreadCount(get().users, userId, () => 0) });
    } catch (error) {
      logStoreError("error in mark messages seen : ", error);
    }
  },

  markGroupMessagesSeen: async (groupId) => {
    try {
      await Axiosinstance.patch(`/groups/${groupId}/seen`);
      set({ groups: updateGroupUnreadCount(get().groups, groupId, () => 0) });
    } catch (error) {
      logStoreError("error in mark group messages seen : ", error);
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser } = get();
    const isGroup = selectedUser?.type === "group";

    try {
      const res = await Axiosinstance.post(
        isGroup ? `/messages/group/${selectedUser._id}/send` : `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({
        messages: upsertMessage(get().messages, res.data),
        users: isGroup ? get().users : updateUserLastMessage(get().users, selectedUser._id, res.data),
        groups: isGroup ? updateGroupLastMessage(get().groups, selectedUser._id, res.data) : get().groups,
      });
    } catch (error) {
      logStoreError("error in send message : ", error);
      toast.error(formatApiError(error, "Could not send message"));
      throw error;
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await Axiosinstance.put(`/messages/${messageId}`, { text });
      set({
        messages: get().messages.map((message) => (message._id === messageId ? res.data : message)),
        users: updateLastMessageIfMatching(get().users, res.data),
        groups: updateLastMessageIfMatching(get().groups, res.data),
      });
    } catch (error) {
      toast.error(formatApiError(error, "Could not edit message"));
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await Axiosinstance.delete(`/messages/${messageId}`);
      set({
        messages: get().messages.filter((message) => message._id !== messageId),
        users: clearLastMessageIfMatching(get().users, messageId),
        groups: clearLastMessageIfMatching(get().groups, messageId),
      });
      await get().getUsers();
      await get().getGroups();
    } catch (error) {
      toast.error(formatApiError(error, "Could not delete message"));
    }
  },

  emitTyping: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (selectedUser?.type === "group") return;
    if (selectedUser && socket) socket.emit("typing", { receiverId: selectedUser._id });
  },

  emitStopTyping: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (selectedUser?.type === "group") return;
    if (selectedUser && socket) socket.emit("stopTyping", { receiverId: selectedUser._id });
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    if (messageSocketHandlers?.socket === socket) return;

    const handleNewMessage = (newMessage, ack) => {
      const { selectedUser } = get();
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;

      if (typeof ack === "function") ack({ received: true, messageId: newMessage._id });

      if (!isMessageSentFromSelectedUser) {
        const sender = newMessage.sender || get().users.find((user) => user._id === newMessage.senderId);
        const notification = {
          id: `message-${newMessage._id}`,
          type: "message",
          title: getDisplayName(sender),
          body: getMessagePreview(newMessage),
          userId: newMessage.senderId,
          createdAt: newMessage.createdAt || new Date().toISOString(),
          read: false,
        };

        set((state) => ({
          users: updateUserLastMessage(
            updateUserUnreadCount(state.users, newMessage.senderId, (count) => count + 1),
            newMessage.senderId,
            newMessage
          ),
          notifications: addNotificationToList(state.notifications, notification),
          unreadNotificationCount: state.notifications.some((item) => item.id === notification.id && !item.read)
            ? state.unreadNotificationCount
            : state.unreadNotificationCount + 1,
        }));

        toast(`${getDisplayName(sender)}: ${getMessagePreview(newMessage)}`, { id: `message-${newMessage._id}` });
        return;
      }

      set({
        messages: upsertMessage(get().messages, newMessage),
        users: updateUserLastMessage(
          updateUserUnreadCount(get().users, newMessage.senderId, () => 0),
          newMessage.senderId,
          newMessage
        ),
      });
      get().markMessagesSeen(newMessage.senderId);
    };

    const handleNewGroupMessage = (newMessage) => {
      const { selectedUser } = get();
      const authUserId = useAuthStore.getState().authUser?._id;
      const groupId = newMessage.groupId;
      const senderId = getMessageSenderId(newMessage);
      const isSelectedGroup = selectedUser?.type === "group" && selectedUser._id === groupId;
      const sender = typeof newMessage.senderId === "object" ? newMessage.senderId : null;

      if (senderId === authUserId) {
        set({
          messages: isSelectedGroup ? upsertMessage(get().messages, newMessage) : get().messages,
          groups: updateGroupLastMessage(get().groups, groupId, newMessage),
        });
        return;
      }

      if (isSelectedGroup) {
        set({
          messages: upsertMessage(get().messages, newMessage),
          groups: updateGroupLastMessage(updateGroupUnreadCount(get().groups, groupId, () => 0), groupId, newMessage),
        });
        get().markGroupMessagesSeen(groupId);
        return;
      }

      const group = get().groups.find((item) => item._id === groupId) || newMessage.group;
      const notification = {
        id: `group-message-${newMessage._id}`,
        type: "message",
        title: getConversationName(group),
        body: `${getDisplayName(sender)}: ${getMessagePreview(newMessage)}`,
        userId: groupId,
        conversationType: "group",
        createdAt: newMessage.createdAt || new Date().toISOString(),
        read: false,
      };

      set((state) => ({
        groups: updateGroupLastMessage(
          updateGroupUnreadCount(state.groups, groupId, (count) => count + 1),
          groupId,
          newMessage
        ),
        notifications: addNotificationToList(state.notifications, notification),
        unreadNotificationCount: state.notifications.some((item) => item.id === notification.id && !item.read)
          ? state.unreadNotificationCount
          : state.unreadNotificationCount + 1,
      }));

      toast(`${getConversationName(group)}: ${getMessagePreview(newMessage)}`, {
        id: `group-message-${newMessage._id}`,
      });
    };

    const handleGroupUpdated = (group) => {
      set({ groups: upsertGroup(get().groups, group) });
    };

    const handleMessageUpdated = (updatedMessage) => {
      const { selectedUser } = get();
      const authUserId = useAuthStore.getState().authUser?._id;
      const senderId = getMessageSenderId(updatedMessage);
      const belongsToSelectedConversation = selectedUser && (
        (selectedUser.type === "group" && updatedMessage.groupId === selectedUser._id)
        || (senderId === selectedUser._id && updatedMessage.receiverId === authUserId)
        || (senderId === authUserId && updatedMessage.receiverId === selectedUser._id)
      );
      const alreadyVisible = get().messages.some((message) => message._id === updatedMessage._id);

      if (!belongsToSelectedConversation && !alreadyVisible) return;

      set({
        messages: upsertMessage(get().messages, updatedMessage),
        users: updateLastMessageIfMatching(get().users, updatedMessage),
        groups: updateLastMessageIfMatching(get().groups, updatedMessage),
      });
    };

    const handleMessageDeleted = ({ _id, senderId, groupId, status }) => {
      const messageWasVisible = get().messages.some((message) => message._id === _id);
      const selectedUserId = get().selectedUser?._id;
      const shouldClearUnread = !messageWasVisible && status !== "seen" && senderId && senderId !== selectedUserId;

      set({
        messages: get().messages.filter((message) => message._id !== _id),
        users: groupId ? get().users : shouldClearUnread
          ? clearLastMessageIfMatching(updateUserUnreadCount(get().users, senderId, (count) => count - 1), _id)
          : clearLastMessageIfMatching(get().users, _id),
        groups: groupId ? clearLastMessageIfMatching(get().groups, _id) : get().groups,
      });
    };

    const handleMessagesSeen = ({ by }) => {
      const authUserId = useAuthStore.getState().authUser?._id;

      set({
        messages: get().messages.map((message) => (
          message.senderId === authUserId && message.receiverId === by
            ? { ...message, status: "seen" }
            : message
        ))
      });
    };

    const handleTyping = ({ senderId }) => {
      set({ typingUsers: { ...get().typingUsers, [senderId]: true } });
    };

    const handleStopTyping = ({ senderId }) => {
      const nextTypingUsers = { ...get().typingUsers };
      delete nextTypingUsers[senderId];
      set({ typingUsers: nextTypingUsers });
    };

    const handleFriendUpdate = async (payload = {}) => {
      const message = getFriendNotificationMessage(payload);
      if (message) {
        const notification = {
          id: `${payload.type}-${payload.from?._id || Date.now()}`,
          type: "friend",
          title: "Friends",
          body: message,
          createdAt: new Date().toISOString(),
          read: false,
        };

        set((state) => ({
          notifications: addNotificationToList(state.notifications, notification),
          unreadNotificationCount: state.notifications.some((item) => item.id === notification.id && !item.read)
            ? state.unreadNotificationCount
            : state.unreadNotificationCount + 1,
        }));

        if (payload.type === "friend_request_accepted") toast.success(message);
        else toast(message);
      }

      await get().getFriendRequests();
      await get().getUsers();
    };

    const handleReconnect = () => {
      const { selectedUser } = get();
      if (selectedUser?._id) get().getMessages(selectedUser._id);
      get().getFriendRequests();
      get().getUsers();
      get().getGroups();
    };

    messageSocketHandlers = {
      socket,
      handleNewMessage,
      handleNewGroupMessage,
      handleGroupUpdated,
      handleMessageUpdated,
      handleMessageDeleted,
      handleMessagesSeen,
      handleTyping,
      handleStopTyping,
      handleFriendUpdate,
      handleReconnect,
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.on("groupUpdated", handleGroupUpdated);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("friendUpdate", handleFriendUpdate);
    socket.io.on("reconnect", handleReconnect);
  },

  unsubscribeFromMessages: () => {
    const handlers = messageSocketHandlers;
    if (!handlers?.socket) return;

    handlers.socket.off("newMessage", handlers.handleNewMessage);
    handlers.socket.off("newGroupMessage", handlers.handleNewGroupMessage);
    handlers.socket.off("groupUpdated", handlers.handleGroupUpdated);
    handlers.socket.off("messageUpdated", handlers.handleMessageUpdated);
    handlers.socket.off("messageDeleted", handlers.handleMessageDeleted);
    handlers.socket.off("messagesSeen", handlers.handleMessagesSeen);
    handlers.socket.off("typing", handlers.handleTyping);
    handlers.socket.off("stopTyping", handlers.handleStopTyping);
    handlers.socket.off("friendUpdate", handlers.handleFriendUpdate);
    handlers.socket.io.off("reconnect", handlers.handleReconnect);
    messageSocketHandlers = null;
  },

  togglePinnedUser: (userId) => {
    const pinnedUserIds = get().pinnedUserIds;
    const nextPinnedUserIds = pinnedUserIds.includes(userId)
      ? pinnedUserIds.filter((id) => id !== userId)
      : [userId, ...pinnedUserIds];

    savePinnedUserIds(nextPinnedUserIds);
    set({ pinnedUserIds: nextPinnedUserIds });
  },

  setUserSearchText: (userSearchText) => set({ userSearchText }),

  markNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
    unreadNotificationCount: 0,
  })),

  clearNotifications: () => set({ notifications: [], unreadNotificationCount: 0 }),

  setSelectedUser: (selectedUser) => set({
    selectedUser,
    users: selectedUser && selectedUser.type !== "group"
      ? updateUserUnreadCount(get().users, selectedUser._id, () => 0)
      : get().users,
    groups: selectedUser?.type === "group"
      ? updateGroupUnreadCount(get().groups, selectedUser._id, () => 0)
      : get().groups,
  }),
}));
