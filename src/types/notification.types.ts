// Notification types matching the backend API

export type NotificationType =
  | "request_assigned"
  | "quote_received"
  | "request_accepted"
  | "job_started"
  | "job_completed"
  | "request_declined"
  | "cancelled_by_provider"
  | "quote_approved"
  | "quote_rejected"
  | "cancelled_by_customer"
  | "payment_settled"
  | "direct_booking_request";  // ✅ ADD THIS LINE

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: {
    service_request_id?: string;
    customer_name?: string;  // ✅ Optional: customer name for direct booking
    booking_title?: string;  // ✅ Optional: booking title for direct booking
  };
  is_read: boolean;
  created_at: string;
}

export interface NotificationUnreadCount {
  unread_count: number;
}

export interface DeviceRegistration {
  registration_id: string;
  type: "android" | "ios" | "web";
}

export interface DeviceRegistrationResponse {
  message: string;
}

// Navigation mapping for notification types
export const NOTIFICATION_NAV_MAP: Record<NotificationType, { screen: string; params?: Record<string, string> }> = {
  request_assigned: { screen: "/(customer)/booking" },
  quote_received: { screen: "/(customer)/booking" },
  request_accepted: { screen: "/(customer)/booking" },
  job_started: { screen: "/(customer)/booking" },
  job_completed: { screen: "/(customer)/booking" },
  request_declined: { screen: "/(customer)/booking" },
  cancelled_by_provider: { screen: "/(customer)/booking" },
  quote_approved: { screen: "/(provider)/jobs" },
  quote_rejected: { screen: "/(provider)/jobs" },
  cancelled_by_customer: { screen: "/(provider)/jobs" },
  payment_settled: { screen: "/(provider)/wallet" },
  direct_booking_request: { screen: "/(provider)/jobs" },  // ✅ ADD THIS LINE - Navigates to provider jobs
};

// Get display title for notification type
export function getNotificationDisplayTitle(type: NotificationType): string {
  const titles: Record<NotificationType, string> = {
    request_assigned: "Request Assigned",
    quote_received: "New Quote",
    request_accepted: "Request Accepted",
    job_started: "Job Started",
    job_completed: "Job Completed",
    request_declined: "Request Declined",
    cancelled_by_provider: "Job Cancelled",
    quote_approved: "Quote Approved",
    quote_rejected: "Quote Rejected",
    cancelled_by_customer: "Job Cancelled",
    payment_settled: "Payment Received",
    direct_booking_request: "Direct Booking Request",  // ✅ ADD THIS LINE
  };
  return titles[type] || type;
}