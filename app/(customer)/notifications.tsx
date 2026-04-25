import React, { useEffect, useCallback} from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Bell, X, Check, ChevronRight } from "@/components/ui/lucide-icon";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";
import type { Notification, NotificationType } from "@/types/notification.types";
import { getNotificationDisplayTitle } from "@/types/notification.types";

/**
 * Notification list screen - accessible from bell button
 */
export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotificationStore();
  const { token, role } = useAuthStore();

  // Fetch on mount
  useEffect(() => {
    if (token) {
      console.log("[CustomerNotifications] Fetching on mount, token:", token ? "present" : "missing");
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [token, fetchNotifications, fetchUnreadCount]);

  // Also refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (token) {
        console.log("[CustomerNotifications] Refreshing on focus");
        fetchNotifications();
        fetchUnreadCount();
      }
    }, [token, fetchNotifications, fetchUnreadCount])
  );

  console.log("[CustomerNotifications] Rendering with notifications:", notifications.length, "unread:", unreadCount);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      // Mark as read if not already
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
      }

      // Navigate based on notification type and user role
      const serviceRequestId = notification.data?.service_request_id;

      if (role === "provider") {
        // Provider navigation
        if (serviceRequestId) {
          router.push(`/(provider)/jobs/${serviceRequestId}` as any);
        } else {
          router.push("/(provider)/jobs" as any);
        }
      } else {
        // Customer navigation
        if (serviceRequestId) {
          router.push(`/(customer)/booking/${serviceRequestId}` as any);
        } else {
          router.push("/(customer)/booking" as any);
        }
      }
    },
    [role, markNotificationAsRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsAsRead();
  }, [markAllNotificationsAsRead]);

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => (
      <TouchableOpacity
        style={[styles.notificationItem, !item.is_read && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Bell size={20} color={item.is_read ? "#64748B" : "#3B82F6"} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>
            {getNotificationDisplayTitle(item.type as NotificationType)}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={styles.time}>
            {new Date(item.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <ChevronRight size={18} color="#94A3B8" />
      </TouchableOpacity>
    ),
    [handleNotificationPress]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Bell size={48} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>No notifications yet</Text>
        <Text style={styles.emptySubtitle}>
          You'll see updates about your bookings here
        </Text>
      </View>
    ),
    []
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={styles.markAllButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Check size={18} color="#3B82F6" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification List */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && notifications.length > 0}
              onRefresh={() => {
                fetchNotifications();
                fetchUnreadCount();
              }}
              colors={["#3B82F6"]}
              tintColor="#3B82F6"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadItem: {
    backgroundColor: "#F0F9FF",
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  unreadTitle: {
    color: "#1E293B",
  },
  body: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: "#CBD5E1",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
});