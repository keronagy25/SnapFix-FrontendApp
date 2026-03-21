import { apiRequest } from "./api";

/* ─── Types ──────────────────────────────────────────────────────── */
export type BookingStatus =
  | "pending" | "assigned" | "confirmed"
  | "in_progress" | "completed" | "cancelled" | "declined";

export interface ServiceRequest {
  id:                   string;
  status:               BookingStatus;
  status_display:       string;
  category:             { id: number; name: string };
  region:               { id: number; name: string };
  address:              string;
  latitude:             string | null;
  longitude:            string | null;
  title:                string;
  description:          string;
  is_urgent:            boolean;
  preferred_date:       string;      // "YYYY-MM-DD"
  preferred_time:       string;      // "HH:MM:SS"
  estimated_price:      string | null;
  final_price:          string | null;
  cancelled_by:         string;
  cancelled_by_display: string;
  cancellation_reason:  string;
  decline_reason:       string;
  created_at:           string;
  assigned_at:          string | null;
  confirmed_at:         string | null;
  started_at:           string | null;
  completed_at:         string | null;
  cancelled_at:         string | null;
  declined_at:          string | null;
}

export interface CreateBookingPayload {
  category:        number;   // required
  region:          number;   // required
  address:         string;   // required
  title:           string;   // required
  description:     string;   // required
  preferred_date:  string;   // required  "YYYY-MM-DD"
  preferred_time:  string;   // required  "HH:MM:SS"
  latitude?:       string;
  longitude?:      string;
  is_urgent?:      boolean;
  estimated_price?: string;
}

interface Paginated<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

/* ═══════════════════════════════════════════════
   CUSTOMER ENDPOINTS
═══════════════════════════════════════════════ */

// GET /api/v1/bookings/requests/
export const getMyBookings = async (token: string): Promise<ServiceRequest[]> => {
  const res = await apiRequest<Paginated<ServiceRequest>>(
    "/bookings/requests/", { method: "GET" }, token
  );
  return res.results ?? [];
};

// POST /api/v1/bookings/requests/
export const createBooking = (payload: CreateBookingPayload, token: string) =>
  apiRequest<ServiceRequest>("/bookings/requests/", {
    method: "POST",
    body:   JSON.stringify(payload),
  }, token);

// GET /api/v1/bookings/requests/<id>/
export const getBookingById = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/`, {
    method: "GET",
  }, token);

// POST /api/v1/bookings/requests/<id>/cancel/
export const cancelBooking = (id: string, token: string, reason?: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/cancel/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ reason: reason ?? "" }),
  }, token);

/* ═══════════════════════════════════════════════
   PROVIDER ENDPOINTS
═══════════════════════════════════════════════ */

// GET /api/v1/bookings/requests/incoming/
export const getIncomingJobs = async (token: string): Promise<ServiceRequest[]> => {
  const res = await apiRequest<Paginated<ServiceRequest>>(
    "/bookings/requests/incoming/", { method: "GET" }, token
  );
  return res.results ?? [];
};

// GET /api/v1/bookings/requests/my-jobs/
export const getMyJobs = async (token: string): Promise<ServiceRequest[]> => {
  const res = await apiRequest<Paginated<ServiceRequest>>(
    "/bookings/requests/my-jobs/", { method: "GET" }, token
  );
  return res.results ?? [];
};

// POST /api/v1/bookings/requests/<id>/accept/
export const acceptJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/accept/`, {
    method: "POST",
  }, token);

// POST /api/v1/bookings/requests/<id>/decline/
export const declineJob = (id: string, token: string, reason?: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/decline/`, {
    method: "POST",
    body:   JSON.stringify({ reason: reason ?? "" }),
  }, token);

// POST /api/v1/bookings/requests/<id>/start/
export const startJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/start/`, {
    method: "POST",
  }, token);

// POST /api/v1/bookings/requests/<id>/complete/
export const completeJob = (id: string, token: string, final_price?: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/complete/`, {
    method: "POST",
    body:   JSON.stringify({ final_price: final_price ?? "" }),
  }, token);

// POST /api/v1/bookings/requests/<id>/provider-cancel/
export const providerCancelJob = (id: string, token: string, reason?: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/provider-cancel/`, {
    method: "POST",
    body:   JSON.stringify({ reason: reason ?? "" }),
  }, token);

// GET /api/v1/bookings/requests/open/
// Browse all pending requests available for self-assignment
export const getOpenJobs = async (token: string): Promise<ServiceRequest[]> => {
  const res = await apiRequest<Paginated<ServiceRequest>>(
    "/bookings/requests/open/", { method: "GET" }, token
  );
  return res.results ?? [];
};

// POST /api/v1/bookings/requests/<id>/pick/
// Provider self-assigns a pending request from the open pool
// 400 → already has active job | 404 → already picked by someone else
export const pickJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/pick/`, {
    method: "POST",
  }, token);