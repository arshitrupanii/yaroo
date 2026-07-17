import { create } from "zustand";
import toast from "react-hot-toast";
import { Axiosinstance } from "../lib/axios";
import { useAuthStore } from "./useAuhstore";
import { formatApiError } from "../lib/apiError";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  friendRequests: { friends: [], sent: [], received: [] },
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  typingUsers: {},

  getUsers: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await Axiosinstance.get("/messages/users");
      set({ users: res.data });

    } catch (error) {
      console.error("error in get user : ", error);
      toast.error(formatApiError(error, "Could not load users"));

    } finally {
      set({ isUsersLoading: false });
    }
  },

  searchUsers: async (username) => {
    const searchText = username.trim();

    if (!searchText) {
      return get().getUsers();
    }

    set({ isUsersLoading: true });

    try {
      const res = await Axiosinstance.get(`/messages/search/${encodeURIComponent(searchText)}`);
      set({ users: res.data });

    } catch (error) {
      console.error("error in search user : ", error);
      toast.error(formatApiError(error, "Could not search users"));

    } finally {
      set({ isUsersLoading: false });
    }
  },

  getFriendRequests: async () => {
    try {
      const res = await Axiosinstance.get("/friends");
      set({ friendRequests: res.data });
    } catch (error) {
      console.error("error in get friends : ", error);
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

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await Axiosinstance.get(`/messages/${userId}`);
      set({ messages: res.data });

    } catch (error) {
      console.error("error in get message : ", error);
      toast.error(formatApiError(error, "Could not load messages"));

    } finally {
      set({ isMessagesLoading: false });
    }
  },
  
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();

    try {
      const res = await Axiosinstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });

    } catch (error) {
      console.error("error in send message : ", error);
      toast.error(formatApiError(error, "Could not send message"));
    }
  },

  editMessage: async (messageId, text) => {
    try {
      const res = await Axiosinstance.put(`/messages/${messageId}`, { text });
      set({
        messages: get().messages.map((message) => (
          message._id === messageId ? res.data : message
        ))
      });
    } catch (error) {
      toast.error(formatApiError(error, "Could not edit message"));
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await Axiosinstance.delete(`/messages/${messageId}`);
      set({ messages: get().messages.filter((message) => message._id !== messageId) });
    } catch (error) {
      toast.error(formatApiError(error, "Could not delete message"));
    }
  },

  emitTyping: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (selectedUser && socket) socket.emit("typing", { receiverId: selectedUser._id });
  },

  emitStopTyping: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (selectedUser && socket) socket.emit("stopTyping", { receiverId: selectedUser._id });
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });

    socket.on("messageUpdated", (updatedMessage) => {
      set({
        messages: get().messages.map((message) => (
          message._id === updatedMessage._id ? updatedMessage : message
        ))
      });
    });

    socket.on("messageDeleted", ({ _id }) => {
      set({ messages: get().messages.filter((message) => message._id !== _id) });
    });

    socket.on("messagesSeen", () => {
      set({
        messages: get().messages.map((message) => (
          message.senderId === useAuthStore.getState().authUser?._id
            ? { ...message, status: "seen" }
            : message
        ))
      });
    });

    socket.on("typing", ({ senderId }) => {
      set({ typingUsers: { ...get().typingUsers, [senderId]: true } });
    });

    socket.on("stopTyping", ({ senderId }) => {
      const nextTypingUsers = { ...get().typingUsers };
      delete nextTypingUsers[senderId];
      set({ typingUsers: nextTypingUsers });
    });

    socket.on("friendUpdate", () => {
      get().getFriendRequests();
      get().getUsers();
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageUpdated");
    socket.off("messageDeleted");
    socket.off("messagesSeen");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("friendUpdate");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
