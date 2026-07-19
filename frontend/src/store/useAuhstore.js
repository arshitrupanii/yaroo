import { create } from "zustand";
import { Axiosinstance, SOCKET_URL } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { formatAuthError } from "../lib/apiError";


export const useAuthStore = create((set, get) => ({
  authUser: null,
  isLoading: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await Axiosinstance.get("/auth/check");

      set({ authUser: res.data })

      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false })
    }
  },

  signup: async (data) => {
    set({ isLoading: true });

    try {
      const res = await Axiosinstance.post("/auth/signup", data);

      set({ authUser: res.data });
      toast.success("Account created");

      get().connectSocket();
    } catch (error) {
      toast.error(formatAuthError(error, "signup"));
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (data) => {
    set({ isLoading: true });

    try {
      const res = await Axiosinstance.post("/auth/login", data);

      set({ authUser: res.data });
      toast.success("Welcome back");

      get().connectSocket();
    } catch (error) {
      toast.error(formatAuthError(error, "login"));
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await Axiosinstance.post("/auth/logout");

      set({ authUser: null });
      toast.success("Signed out");

      get().disconnectSocket();
    } catch (error) {
      toast.error(formatAuthError(error, "logout"));
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true });

    try {
      const res = await Axiosinstance.post("/auth/forgot-password", { email });
      toast.success("Reset link sent if the email exists");
      return res.data;
    } catch (error) {
      toast.error(formatAuthError(error, "forgotPassword"));
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true });

    try {
      const res = await Axiosinstance.post(`/auth/reset-password/${token}`, { password });
      set({ authUser: res.data });
      toast.success("Password updated");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(formatAuthError(error, "resetPassword"));
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, isUpdatingProfile: true });

    try {
      const res = await Axiosinstance.put("/auth/update-profile", data);

      set({ authUser: res.data });
      toast.success("Profile updated");

    } catch (error) {
      toast.error(formatAuthError(error, "updateProfile"));
    } finally {
      set({ isLoading: false, isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    try {
      const { authUser } = get();
      
      if (!authUser || get().socket?.connected) return;
      
      const socket = io(SOCKET_URL, {
        autoConnect: false,
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ["websocket", "polling"],
      });
      
      socket.connect();
      
      set({ socket: socket });

      socket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
      });

      socket.on("connect_error", (error) => {
        if (error.message === "Unauthorized socket") {
          socket.disconnect();
          set({ socket: null, onlineUsers: [] });
        }

        if (import.meta.env.MODE === "development") {
          console.error("Socket connection error:", error.message);
        }
      });
    } catch (error) {
      if (import.meta.env.MODE === "development") {
        console.error("Error connecting socket:", error);
      }
    }
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },

}));
