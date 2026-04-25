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
 * Provider notification list screen
 */
export default function ProviderNotificationsScreen() {
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
      console.log("[ProviderNotifications] Fetching on mount, token:", token ? "present" : "missing");
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [token, fetchNotifications, fetchUnreadCount]);

  // Also refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (token) {
        console.log("[ProviderNotifications] Refreshing on focus");
        fetchNotifications();
        fetchUnreadCount();
      }
    }, [token, fetchNotifications, fetchUnreadCount])
  );

  console.log("[ProviderNotifications] Rendering with notifications:", notifications.length, "unread:", unreadCount);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      // Mark as read if not already
      if (!notification.is_read) {
        await markNotificationAsRead(notification.id);
      }

      // Navigate based on notification type
      const serviceRequestId = notification.data?.service_request_id;

      if (serviceRequestId) {
        router.push(`/(provider)/jobs/${serviceRequestId}` as any);
      } else {
        router.push("/(provider)/jobs" as any);
      }
    },
    [markNotificationAsRead]
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
        <View style={[styles.iconContainer, { backgroundColor: "#0F172A" }]}>
          <Bell size={20} color="#06B6D4" />
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
          You'll see updates about your jobs here
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
              <Check size={18} color="#06B6D4" />
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
          <ActivityIndicator size="large" color="#06B6D4" />
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
              colors={["#06B6D4"]}
              tintColor="#06B6D4"
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
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
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
    backgroundColor: "#0F172A",
    borderRadius: 20,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#06B6D4",
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
    backgroundColor: "#1E293B",
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
  },
  unreadItem: {
    backgroundColor: "#0F172A",
    borderLeftWidth: 3,
    borderLeftColor: "#06B6D4",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#334155",
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
    color: "#94A3B8",
    marginBottom: 2,
  },
  unreadTitle: {
    color: "#FFFFFF",
  },
  body: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: "#475569",
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
    color: "#94A3B8",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
});