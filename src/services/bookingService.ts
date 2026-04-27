import { apiRequest } from "./api";
import { applyTrackingMetricsToBooking } from "@/utils/trackingGeo";
import { Platform } from 'react-native';

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
export type BookingStatus =
  | "pending" | "assigned" | "quoted" | "confirmed"
  | "in_progress" | "completed" | "cancelled" | "declined";

export type PaymentMethod = "cash" | "card" | "wallet";
export type PaymentStatus = "pending" | "paid" | "failed";

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
  rating:          number | null;
  total_reviews:   number;
  completion_rate: number;
  profile_picture: string | null;
  latitude?:       number | string | null;
  longitude?:      number | string | null;
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
  floor_number?:        string;
  apartment_number?:    string;
  special_mark?:        string;
  latitude:             number | string | null;
  longitude:            number | string | null;
  title:                string;
  description:          string;
  is_urgent:            boolean;
  preferred_date:       string;
  preferred_time:       string;
  estimated_price:      string | null;
  quoted_price:         string | null;
  final_price:          string | null;
  
  // PAYMENT FIELDS
  payment_method:       PaymentMethod;
  payment_method_display: string;
  wallet_amount:        string;
  card_amount:          string | null;
  payment_status:       PaymentStatus;
  payment_status_display: string;
  
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

  // TRACKING FIELDS
  provider_distance_km:  number | null;
  provider_eta_minutes:  number | null;
  distance_km:           number | null;
  provider:              ProviderCard | null;
}

export interface DirectBookingPayload {
  provider_id: string;
  category: number;
  region: number;
  address: string;
  floor_number?: string;
  apartment_number?: string;
  special_mark?: string;
  latitude?: number;
  longitude?: number;
  title: string;
  description: string;
  preferred_date: string;
  preferred_time: string;
  is_urgent?: boolean;
  estimated_price?: string;
  payment_method?: PaymentMethod;
  wallet_amount?: string;
}

export interface HistoryDetail extends ServiceRequest {
  is_favorite_provider?: boolean;
  customer?:            CustomerCard | null;
}

export interface CreateBookingPayload {
  category:          number;
  region:            number;
  address:           string;
  title:             string;
  description:       string;
  preferred_date:    string;
  preferred_time:    string;
  floor_number?:     string;
  apartment_number?: string;
  special_mark?:     string;
  latitude?:         number;
  longitude?:        number;
  is_urgent?:        boolean;
  estimated_price?:  string;
  payment_method?:   PaymentMethod;
  wallet_amount?:    string;
}

export interface ApproveQuotePayload {
  payment_method?:   PaymentMethod;
  wallet_amount?:    string;
}

export interface InitiateCardPaymentPayload {
  stripe_payment_method_id: string;
  return_url?: string;  // ✅ ADDED: Required by backend
}

export interface PaymentInitiateResponse extends ServiceRequest {
  stripe_client_secret: string;
}

interface Paginated<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

/* ═══════════════════════════════════════════════════════════════
   SHARED ENDPOINTS
═══════════════════════════════════════════════════════════════ */

export const getBookings = async (token: string, status?: string): Promise<ServiceRequest[]> => {
  const url = status
    ? `/bookings/requests/?status=${status}`
    : "/bookings/requests/";
  const res = await apiRequest<Paginated<ServiceRequest>>(url, { method:"GET" }, token);
  return res.results ?? [];
};

export const getBookingById = async (id: string, token: string): Promise<ServiceRequest> => {
  const raw = await apiRequest<ServiceRequest>(`/bookings/requests/${id}/`, { method: "GET" }, token);
  return applyTrackingMetricsToBooking(raw as unknown as Record<string, unknown>) as unknown as ServiceRequest;
};

export const getBookingTracking = getBookingById;

export const getHistoryDetail = (id: string, token: string) =>
  apiRequest<HistoryDetail>(`/bookings/history/${id}/`, { method:"GET" }, token);

/* ═══════════════════════════════════════════════════════════════
   CUSTOMER ENDPOINTS
═══════════════════════════════════════════════════════════════ */

// Helper function to convert image URI to blob for FormData
const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

// Main createBooking function with proper FormData
export const createBooking = async (payload: CreateBookingPayload, token: string, photos?: string[]) => {
  const formData = new FormData();
  
  // Add all text fields
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });
  
  // Add photos if present
  if (photos && photos.length > 0) {
    for (let i = 0; i < photos.length; i++) {
      const photoUri = photos[i];
      const filename = `photo_${Date.now()}_${i}.jpg`;
      
      if (Platform.OS === 'web') {
        const blob = await uriToBlob(photoUri);
        formData.append('photos', blob, filename);
      } else {
        // @ts-ignore
        formData.append('photos', {
          uri: photoUri,
          type: 'image/jpeg',
          name: filename,
        });
      }
    }
  }
  
  console.log('📸 Sending booking with photos:', photos?.length || 0);
  
  const response = await apiRequest<ServiceRequest>("/bookings/requests/", {
    method: "POST",
    body: formData,
  }, token);
  
  return response;
};

export const cancelBooking = async (id: string, token: string, reason?: string) => {
  const raw = await apiRequest<ServiceRequest>(`/bookings/requests/${id}/cancel/`, {
    method: "POST",
    body:   JSON.stringify({ reason: reason ?? "" }),
  }, token);
  return applyTrackingMetricsToBooking(raw as unknown as Record<string, unknown>) as unknown as ServiceRequest;
};

export const approveQuote = async (id: string, token: string, payload: ApproveQuotePayload = {}) => {
  const raw = await apiRequest<ServiceRequest>(`/bookings/requests/${id}/approve-quote/`, {
    method: "POST",
    body:   JSON.stringify(payload),
  }, token);
  return applyTrackingMetricsToBooking(raw as unknown as Record<string, unknown>) as unknown as ServiceRequest;
};

export const rejectQuote = async (id: string, token: string) => {
  const raw = await apiRequest<ServiceRequest>(`/bookings/requests/${id}/reject-quote/`, {
    method: "POST",
  }, token);
  return applyTrackingMetricsToBooking(raw as unknown as Record<string, unknown>) as unknown as ServiceRequest;
};

export const initiateCardPayment = async (id: string, token: string, payload: InitiateCardPaymentPayload): Promise<PaymentInitiateResponse> => {
  console.log("Calling initiateCardPayment with:", { id, payload });
  const res = await apiRequest<PaymentInitiateResponse>(`/bookings/requests/${id}/initiate-card-payment/`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
  console.log("initiateCardPayment response:", res);
  return res;
};

export const rateBooking = (id: string, token: string, rating: number, comment?: string) =>
  apiRequest<Review>(`/bookings/requests/${id}/rate/`, {
    method: "POST",
    body:   JSON.stringify({ rating, ...(comment ? { comment } : {}) }),
  }, token);

/* ═══════════════════════════════════════════════════════════════
   PROVIDER ENDPOINTS
═══════════════════════════════════════════════════════════════ */

export const getOpenJobs = async (token: string): Promise<ServiceRequest[]> => {
  const res = await apiRequest<Paginated<ServiceRequest>>(
    "/bookings/requests/open/", { method:"GET" }, token
  );
  return res.results ?? [];
};

export const getIncomingJobs = async (token: string): Promise<ServiceRequest[]> => {
  const res = await apiRequest<Paginated<ServiceRequest>>(
    "/bookings/requests/incoming/", { method:"GET" }, token
  );
  return res.results ?? [];
};

export const pickJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/pick/`, { method:"POST" }, token);

export const acceptJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/accept/`, { method:"POST" }, token);

export const quoteJob = (id: string, token: string, price: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/quote/`, {
    method: "POST",
    body:   JSON.stringify({ price }),
  }, token);

export const declineJob = (id: string, token: string, reason?: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/decline/`, {
    method: "POST",
    body:   JSON.stringify({ reason: reason ?? "" }),
  }, token);

export const startJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/start/`, { method:"POST" }, token);

export const completeJob = (id: string, token: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/complete/`, {
    method: "POST",
  }, token);

export const providerCancelJob = (id: string, token: string, reason?: string) =>
  apiRequest<ServiceRequest>(`/bookings/requests/${id}/provider-cancel/`, {
    method: "POST",
    body:   JSON.stringify({ reason: reason ?? "" }),
  }, token);

  export const createDirectBooking = async (
  payload: DirectBookingPayload,
  token: string,
  photos?: string[]
): Promise<ServiceRequest> => {
  const formData = new FormData();
  
  // Add all text fields
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });
  
  // Add photos if present
  if (photos && photos.length > 0) {
    for (let i = 0; i < photos.length; i++) {
      const photoUri = photos[i];
      const filename = `direct_booking_${Date.now()}_${i}.jpg`;
      
      if (Platform.OS === 'web') {
        const blob = await uriToBlob(photoUri);
        formData.append('photos', blob, filename);
      } else {
        // @ts-ignore
        formData.append('photos', {
          uri: photoUri,
          type: 'image/jpeg',
          name: filename,
        });
      }
    }
  }
  
  console.log('📸 Sending direct booking with photos:', photos?.length || 0);
  console.log('🎯 Direct booking for provider:', payload.provider_id);
  
  const response = await apiRequest<ServiceRequest>("/bookings/requests/direct/", {
    method: "POST",
    body: formData,
  }, token);
  
  return response;
};