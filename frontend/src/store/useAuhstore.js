import { create } from "zustand";
import { Axiosinstance, SOCKET_URL } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { formatApiError } from "../lib/apiError";


export const useAuthStore = create((set, get) => ({
  authUser: null,
  isLoading: false,
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
      toast.success("Account created successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(formatApiError(error, "Signup failed"));
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (data) => {
    set({ isLoading: true });

    try {
      const res = await Axiosinstance.post("/auth/login", data);

      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(formatApiError(error, "Login failed"));
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await Axiosinstance.post("/auth/logout");

      set({ authUser: null });
      toast.success("Logged out successfully");

      get().disconnectSocket();
    } catch (error) {
      toast.error(formatApiError(error, "Logout failed"));
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true });

    try {
      const res = await Axiosinstance.post("/auth/forgot-password", { email });
      toast.success(res.data.message);
      return res.data;
    } catch (error) {
      toast.error(formatApiError(error, "Forgot password failed"));
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
      toast.success("Password reset successfully");
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(formatApiError(error, "Reset password failed"));
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true });

    try {
      const res = await Axiosinstance.put("/auth/update-profile", data);

      set({ authUser: res.data });
      toast.success("Profile updated successfully");

    } catch (error) {
      toast.error(formatApiError(error, "Profile update failed"));
    } finally {
      set({ isLoading: false });
    }
  },

  connectSocket: () => {
    try {
      const { authUser } = get();
      
      if (!authUser || get().socket?.connected) return;
      
      const socket = io(SOCKET_URL, {
        query: {
          userId: authUser._id,
        },
      });
      
      socket.connect();
      
      set({ socket: socket });

      socket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
      });


    } catch (error) {
      if (import.meta.env.MODE === "development") {
        console.error("Error connecting socket:", error);
      }
    }
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },

}));
