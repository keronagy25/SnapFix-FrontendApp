import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Bell } from "@/components/ui/lucide-icon";
import { useNotificationStore } from "@/store/notificationStore";
import { useAuthStore } from "@/store/authStore";

interface NotificationBellButtonProps {
  onPress: () => void;
  size?: number;
  color?: string;
}

/**
 * Notification bell button with unread badge
 * Shows in header of customer home or provider dashboard
 */
export function NotificationBellButton({
  onPress,
  size = 24,
  color = "#1E293B",
}: NotificationBellButtonProps) {
  const { unreadCount, fetchUnreadCount, fetchNotifications } = useNotificationStore();
  const { token, isAuthenticated } = useAuthStore();
  
  // Track if we've already fetched to prevent duplicate calls
  const hasFetched = useRef(false);

  // Fetch on mount and when auth becomes available
  useEffect(() => {
    if (token && isAuthenticated && !hasFetched.current) {
      console.log("[NotificationBell] Token available, fetching notifications...");
      hasFetched.current = true;
      fetchUnreadCount();
      fetchNotifications();
    }
  }, [token, isAuthenticated]);

  const hasUnread = unreadCount > 0;
  const displayCount = unreadCount > 99 ? "99+" : unreadCount.toString();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel={`Notifications, ${unreadCount} unread`}
      accessibilityRole="button"
    >
      <Bell size={size} color={color} />
      {hasUnread && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});