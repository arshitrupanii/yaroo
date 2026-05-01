import { create } from "zustand";
import toast from "react-hot-toast";
import { Axiosinstance } from "../lib/axios";
import { useAuthStore } from "./useAuhstore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });

    try {
      const res = await Axiosinstance.get("/messages/users");
      set({ users: res.data });

    } catch (error) {
      console.error("error in get user : ", error);
      toast.error(error.response.data.message);

    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await Axiosinstance.get(`/messages/${userId}`);
      set({ messages: res.data });

    } catch (error) {
      console.error("error in get message : ", error);
      toast.error(error.response.data.message);

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
      toast.error(error.response.data.message);
    }
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
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));