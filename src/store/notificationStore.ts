import { create } from "zustand";
import type { Notification, NotificationUnreadCount } from "../types/notification.types";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  registerDevice,
  unregisterDevice,
} from "../services/notificationService";
import { useAuthStore } from "./authStore";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  registerDeviceToken: (registrationId: string, type: "android" | "ios" | "web") => Promise<void>;
  unregisterDeviceToken: (registrationId: string) => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    // Don't clear existing notifications while loading - prevents flash
    const currentNotifications = get().notifications;
    
    set({ isLoading: true, error: null });
    try {
      console.log("[NotificationStore] Fetching notifications...");
      const notifications = await getNotifications(token);
      console.log("[NotificationStore] Got notifications:", notifications.length, JSON.stringify(notifications).substring(0, 200));
      
      // Only update if we got actual data, otherwise keep existing
      if (notifications && notifications.length > 0) {
        set({ notifications, isLoading: false });
      } else if (currentNotifications.length > 0) {
        // Keep existing notifications if API returns empty
        console.log("[NotificationStore] API returned empty, keeping existing notifications");
        set({ isLoading: false });
      } else {
        set({ notifications: [], isLoading: false });
      }
    } catch (err: any) {
      console.error("[NotificationStore] fetchNotifications error:", err);
      // Keep existing notifications on error
      set({ error: err.message || "Failed to fetch notifications", isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      console.log("[NotificationStore] Fetching unread count...");
      const result = await getUnreadCount(token);
      console.log("[NotificationStore] Got unread count:", result);
      set({ unreadCount: result.unread_count });
    } catch (err: any) {
      console.error("[NotificationStore] fetchUnreadCount error:", err);
      // Don't set error for badge count failures - it's not critical
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      await markAsRead(token, notificationId);
      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err: any) {
      console.error("[NotificationStore] markAsRead error:", err);
      set({ error: err.message || "Failed to mark notification as read" });
    }
  },

  markAllNotificationsAsRead: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      await markAllAsRead(token);
      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (err: any) {
      console.error("[NotificationStore] markAllAsRead error:", err);
      set({ error: err.message || "Failed to mark all notifications as read" });
    }
  },

  registerDeviceToken: async (registrationId: string, type: "android" | "ios" | "web") => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      await registerDevice(token, { registration_id: registrationId, type });
      console.log("[NotificationStore] Device registered successfully");
    } catch (err: any) {
      console.error("[NotificationStore] registerDevice error:", err);
      // Don't set error - device registration is best-effort
    }
  },

  unregisterDeviceToken: async (registrationId: string) => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      await unregisterDevice(token, registrationId);
      console.log("[NotificationStore] Device unregistered successfully");
    } catch (err: any) {
      console.error("[NotificationStore] unregisterDevice error:", err);
      // Don't set error - device unregistration is best-effort on logout
    }
  },

  clearError: () => set({ error: null }),
}));