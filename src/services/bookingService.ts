import { apiRequest } from "./api";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
export type BookingStatus =
  | "pending" | "assigned" | "confirmed"
  | "in_progress" | "completed" | "cancelled" | "declined";

export interface Review {
  id:         string;
  rating:     number;
  comment:    string;
  created_at: string;
}

export interface ProviderCard {
  id:              string;
  first_name:      string;
  last_name:       string;
  business_name:   string;
  rating:          number;
  total_reviews:   number;
  completion_rate: number;
  profile_picture: string | null;
}

export interface CustomerCard {
  id:              string;
  first_name:      string;
  last_name:       string;
  total_bookings:  number;
  profile_picture: string | null;
}

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
  preferred_date:       string;
  preferred_time:       string;
  estimated_price:      string | null;
  final_price:          string | null;
  cancelled_by:         string;
  cancelled_by_display: string;
  cancellation_reason:  string;
  decline_reason:       string;
  review:               Review | null;
  created_at:           string;
  assigned_at:          string | null;
  confirmed_at:         string | null;
  started_at:           string | null;
  completed_at:         string | null;
  cancelled_at:         string | null;
  declined_at:          string | null;
}

// History detail — role-aware (customer gets provider card, provider gets customer card)
export interface HistoryDetail extends ServiceRequest {
  // Customer token
  provider?:             ProviderCard | null;
  is_favorite_provider?: boolean;
  // Provider token
  customer?:             CustomerCard | null;
}

export interface CreateBookingPayload {
  category:        number;
  region:          number;
  address:         string;
  title:           string;
  description:     string;
  preferred_date:  string;
  preferred_time:  string;
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

/* ═══════════════════════════════════════════════════════════════
   SHARED ENDPOINTS (role-aware)
═══════════════════════════════════════════════════════════════ */

// GET /api/v1/bookings/requests/?status=<status>
// Customer → their requests | Provider → their jobs
export const getBookings = async (token: string, status?: string): Promise<ServiceRequest[]> => {
  const url = status
    ? `/bookings/requests/?status=${status}`
    : "/bookings/requests/";
  const res = await apiRequest<Paginated<ServiceRequest>>(url, { method:"GET" }, token);
  return res.results ?? [];
};

// GET /api/v1/bookings/requests/<id>/
export const getBookingById = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/`, { method:"GET" }, token);

// GET /api/v1/bookings/history/<id>/
export const getHistoryDetail = (id: string, token: string) =>
  apiRequest<HistoryDetail>(`/bookings/history/${id}/`, { method:"GET" }, token);

/* ═══════════════════════════════════════════════════════════════
   CUSTOMER ENDPOINTS
═══════════════════════════════════════════════════════════════ */

// POST /api/v1/bookings/requests/
export const createBooking = (payload: CreateBookingPayload, token: string) =>
  apiRequest<ServiceRequest>("/bookings/requests/", {
    method: "POST",
    body:   JSON.stringify(payload),
  }, token);

// POST /api/v1/bookings/requests/<id>/cancel/
export const cancelBooking = (id: string, token: string, reason?: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/cancel/`, {
    method: "POST",
    body:   JSON.stringify({ reason: reason ?? "" }),
  }, token);

// POST /api/v1/bookings/requests/<id>/rate/
export const rateBooking = (id: string, token: string, rating: number, comment?: string) =>
  apiRequest<Review>(`/bookings/requests/${id}/rate/`, {
    method: "POST",
    body:   JSON.stringify({ rating, ...(comment ? { comment } : {}) }),
  }, token);

/* ═══════════════════════════════════════════════════════════════
   PROVIDER ENDPOINTS
═══════════════════════════════════════════════════════════════ */

// GET /api/v1/bookings/requests/open/
export const getOpenJobs = async (token: string): Promise<ServiceRequest[]> => {
  const res = await apiRequest<Paginated<ServiceRequest>>(
    "/bookings/requests/open/", { method:"GET" }, token
  );
  return res.results ?? [];
};

// GET /api/v1/bookings/requests/incoming/
export const getIncomingJobs = async (token: string): Promise<ServiceRequest[]> => {
  const res = await apiRequest<Paginated<ServiceRequest>>(
    "/bookings/requests/incoming/", { method:"GET" }, token
  );
  return res.results ?? [];
};

// POST /api/v1/bookings/requests/<id>/pick/
export const pickJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/pick/`, { method:"POST" }, token);

// POST /api/v1/bookings/requests/<id>/accept/
export const acceptJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/accept/`, { method:"POST" }, token);

// POST /api/v1/bookings/requests/<id>/decline/
export const declineJob = (id: string, token: string, reason?: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/decline/`, {
    method: "POST",
    body:   JSON.stringify({ reason: reason ?? "" }),
  }, token);

// POST /api/v1/bookings/requests/<id>/start/
export const startJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/start/`, { method:"POST" }, token);

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