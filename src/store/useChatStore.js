import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSending: false,

  getUser: async () => {
    set({ isUsersLoading: true });
    try {
      const response = await axiosInstance.get("/messages/users");
      const usersWithFlags = response.data.map((user) => ({
        ...user,
        hasNewMessage: false,
        lastMessageTime: null,
      }));
      set({ users: usersWithFlags });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const response = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: response.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    set({ isSending: true });
    const { selectedUser, messages, users } = get();
    try {
      const response = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );

      // Update messages and move user to top
      const updatedUsers = users.map((user) =>
        user._id === selectedUser._id
          ? {
              ...user,
              lastMessageTime: new Date(),
              hasNewMessage: false, // No new message for sender
            }
          : user
      );

      updatedUsers.sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      set({
        messages: [...messages, response.data],
        users: updatedUsers,
        isSending: false,
      });
    } catch (error) {
      toast.error(error.message);
      set({ isSending: false });
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, users, messages } = get();
    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isCurrentChat = newMessage.senderId === selectedUser?._id;

      // Update user list and flag new message
      const updatedUsers = users.map((user) =>
        user._id === newMessage.senderId
          ? {
              ...user,
              hasNewMessage: !isCurrentChat,
              lastMessageTime: new Date(),
            }
          : user
      );

      updatedUsers.sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      set({
        messages: isCurrentChat ? [...messages, newMessage] : messages,
        users: updatedUsers,
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) =>
    set((state) => ({
      selectedUser,
      users: state.users.map((user) =>
        user._id === selectedUser._id ? { ...user, hasNewMessage: false } : user
      ),
    })),
}));
