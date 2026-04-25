import { apiRequest } from "./api";
import type {
  Notification,
  NotificationUnreadCount,
  DeviceRegistration,
  DeviceRegistrationResponse,
} from "../types/notification.types";

const BASE_URL = "/notifications";

/**
 * Get all notifications for the current user
 * Handles both direct array and paginated responses
 */
export async function getNotifications(
  token: string,
  unreadOnly: boolean = false
): Promise<Notification[]> {
  const endpoint = unreadOnly
    ? `${BASE_URL}/?unread=true`
    : BASE_URL + "/";
  
  console.log("[NotificationService] Calling endpoint:", endpoint);
  const response = await apiRequest<any>(endpoint, { method: "GET" }, token);
  console.log("[NotificationService] Raw response:", response);
  
  // Handle paginated response: { results: [...] } or direct array [...]
  if (response && Array.isArray(response)) {
    return response;
  }
  if (response && Array.isArray(response.results)) {
    return response.results;
  }
  if (response && Array.isArray(response.data)) {
    return response.data;
  }
  
  console.log("[NotificationService] Unexpected response format:", response);
  return [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(token: string): Promise<NotificationUnreadCount> {
  console.log("[NotificationService] Calling unread-count endpoint");
  const response = await apiRequest<any>(
    `${BASE_URL}/unread-count/`,
    { method: "GET" },
    token
  );
  console.log("[NotificationService] Unread count raw response:", response);
  
  // Handle different response formats
  if (response && typeof response.unread_count === 'number') {
    return { unread_count: response.unread_count };
  }
  if (response && typeof response.count === 'number') {
    return { unread_count: response.count };
  }
  
  console.log("[NotificationService] Unexpected unread count format:", response);
  return { unread_count: 0 };
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(
  token: string,
  notificationId: string
): Promise<{ marked_read: boolean }> {
  return apiRequest<{ marked_read: boolean }>(
    `${BASE_URL}/${notificationId}/read/`,
    { method: "POST" },
    token
  );
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(
  token: string
): Promise<{ marked_read: number }> {
  return apiRequest<{ marked_read: number }>(
    `${BASE_URL}/read-all/`,
    { method: "POST" },
    token
  );
}

/**
 * Register a device token for push notifications
 */
export async function registerDevice(
  token: string,
  device: DeviceRegistration
): Promise<DeviceRegistrationResponse> {
  return apiRequest<DeviceRegistrationResponse>(
    `${BASE_URL}/devices/register/`,
    {
      method: "POST",
      body: JSON.stringify(device),
    },
    token
  );
}

/**
 * Unregister a device token
 */
export async function unregisterDevice(
  token: string,
  registrationId: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(
    `${BASE_URL}/devices/${registrationId}/`,
    { method: "DELETE" },
    token
  );
}