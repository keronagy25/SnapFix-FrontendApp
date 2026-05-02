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

  provider_distance_km:  number | null;
  provider_eta_minutes:  number | null;
  distance_km:           number | null;
  provider:              ProviderCard | null;
  
  booking_mode?:         "broadcast" | "recommended";
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

export type PhotoUpload =
  | string
  | {
      uri: string;
      fileName?: string;
      type?: string;
      base64?: string;
    };

export interface RecommendedBookingCacheEntry {
  payload: CreateBookingPayload;
  photos: PhotoUpload[];
}

const recommendedBookingCache: Record<string, RecommendedBookingCacheEntry> = {};

export const saveRecommendedBookingCache = (key: string, entry: RecommendedBookingCacheEntry) => {
  recommendedBookingCache[key] = entry;
};

export const getRecommendedBookingCache = (key: string): RecommendedBookingCacheEntry | null =>
  recommendedBookingCache[key] ?? null;

export const clearRecommendedBookingCache = (key: string) => {
  delete recommendedBookingCache[key];
};

export interface ApproveQuotePayload {
  payment_method?:   PaymentMethod;
  wallet_amount?:    string;
}

export interface InitiateCardPaymentPayload {
  stripe_payment_method_id: string;
  return_url?: string;
}

export interface PaymentInitiateResponse extends ServiceRequest {
  stripe_client_secret: string;
}

// ============ RECOMMENDED BOOKING TYPES ============
export interface ScoringSignals {
  rating: number;
  distance: number;
  completion_rate: number;
  is_favorite: boolean;
  urgency_availability: number;
}

export interface RecommendedProvider {
  id: string;
  full_name: string;
  business_name: string;
  average_rating: string;
  total_reviews: number;
  completed_jobs: number;
  hourly_rate: string | null;
  years_of_experience: number;
  acceptance_rate: number | null;
  distance_km: number;
  is_favorite: boolean;
  score: number;
  signals: ScoringSignals;
  reason: string;
}

export interface ServiceRequestWithRecommendations extends ServiceRequest {
  recommendations: RecommendedProvider[];
}

export interface Step2ErrorResponse {
  provider_id?: string[];
  photos?: string[];
  category?: string[];
  region?: string[];
  address?: string[];
  title?: string[];
  description?: string[];
  preferred_date?: string[];
  preferred_time?: string[];
  [key: string]: string[] | undefined;
}

interface Paginated<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

/* ═══════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
═══════════════════════════════════════════════════════════════ */

const base64ToBlob = (base64: string, contentType = "image/jpeg"): Blob => {
  const binary = atob(base64);
  const len = binary.length;
  const buffer = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new Blob([buffer], { type: contentType });
};

const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

const appendPhotoToFormData = async (
  formData: FormData,
  photo: PhotoUpload,
  filename: string,
): Promise<void> => {
  const normalizedFilename = filename || "photo.jpg";
  if (typeof photo === "string") {
    if (Platform.OS === "web") {
      const blob = await uriToBlob(photo);
      formData.append("photos", blob, normalizedFilename);
    } else {
      formData.append("photos", {
        uri: photo,
        type: "image/jpeg",
        name: normalizedFilename,
      } as any);
    }
    return;
  }

  const contentType = photo.type || "image/jpeg";
  const fileName = photo.fileName || normalizedFilename;

  if (Platform.OS === "web") {
    if (photo.base64) {
      const blob = base64ToBlob(photo.base64, contentType);
      formData.append("photos", blob, fileName);
    } else {
      const blob = await uriToBlob(photo.uri);
      formData.append("photos", blob, fileName);
    }
  } else {
    formData.append("photos", {
      uri: photo.uri,
      type: contentType,
      name: fileName,
    } as any);
  }
};

export const extractErrorMessage = (errorData: any, field?: string): string | null => {
  if (!errorData) return null;
  
  if (field && errorData[field]) {
    const messages = errorData[field];
    if (Array.isArray(messages) && messages.length > 0) {
      return messages[0];
    }
    if (typeof messages === 'string') return messages;
  }
  
  if (errorData.detail) return errorData.detail;
  if (errorData.non_field_errors) {
    const errors = errorData.non_field_errors;
    return Array.isArray(errors) ? errors[0] : errors;
  }
  
  return null;
};

/* ═══════════════════════════════════════════════════════════════
   SHARED ENDPOINTS
═══════════════════════════════════════════════════════════════ */

// NEW: Paginated version - returns full pagination metadata
export const getBookingsPaginated = async (
  token: string, 
  page: number = 1,
  status?: string
): Promise<Paginated<ServiceRequest>> => {
  let url = "/bookings/requests/";
  const params: string[] = [];
  
  if (status) {
    params.push(`status=${status}`);
  }
  
  if (page > 1) {
    params.push(`page=${page}`);
  }
  
  if (params.length > 0) {
    url += `?${params.join('&')}`;
  }
  
  console.log(`📄 Fetching page ${page} with URL: ${url}`);
  
  const res = await apiRequest<Paginated<ServiceRequest>>(url, { method: "GET" }, token);
  
  console.log(`✅ Page ${page}: Retrieved ${res.results?.length || 0} of ${res.count} total bookings`);
  
  return res;
};

// MODIFIED: Original getBookings now fetches ALL pages (no breaking changes)
export const getBookings = async (token: string, status?: string): Promise<ServiceRequest[]> => {
  let allBookings: ServiceRequest[] = [];
  let currentPage = 1;
  let hasMore = true;
  
  console.log(`🔍 Fetching all bookings${status ? ` with status: ${status}` : ''}...`);
  
  while (hasMore) {
    let url = "/bookings/requests/";
    const params: string[] = [];
    
    if (status) {
      params.push(`status=${status}`);
    }
    
    if (currentPage > 1) {
      params.push(`page=${currentPage}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    const res = await apiRequest<Paginated<ServiceRequest>>(url, { method: "GET" }, token);
    
    if (res.results && res.results.length > 0) {
      allBookings = [...allBookings, ...res.results];
      hasMore = allBookings.length < res.count;
      currentPage++;
    } else {
      hasMore = false;
    }
  }
  
  console.log(`✅ Total bookings fetched: ${allBookings.length}`);
  return allBookings;
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

export const createBooking = async (payload: CreateBookingPayload, token: string, photos?: PhotoUpload[]) => {
  const formData = new FormData();
  
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });
  
  if (photos && photos.length > 0) {
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const filename = `photo_${Date.now()}_${i}.jpg`;
      await appendPhotoToFormData(formData, photo, filename);
    }
  }
  
  const response = await apiRequest<ServiceRequest>("/bookings/requests/", {
    method: "POST",
    body: formData,
  }, token);
  
  return response;
};

// ============ STEP 1: Create recommended booking request ============
export const createRecommendedBooking = async (
  payload: CreateBookingPayload,
  token: string,
  photos?: PhotoUpload[]
): Promise<ServiceRequestWithRecommendations> => {
  const formData = new FormData();
  
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });
  
  formData.append("booking_mode", "recommended");
  
  if (photos && photos.length > 0) {
    if (photos.length > 5) {
      throw new Error("Maximum 5 photos allowed");
    }
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const filename = `recommended_booking_${Date.now()}_${i}.jpg`;
      await appendPhotoToFormData(formData, photo, filename);
    }
  }
  
  console.log('📸 STEP 1: Creating RECOMMENDED booking with photos:', photos?.length || 0);
  
  const response = await apiRequest<ServiceRequestWithRecommendations>("/bookings/requests/", {
    method: "POST",
    body: formData,
  }, token);
  
  return response;
};

// ============ STEP 2: Book the chosen provider via RECOMMENDED endpoint ============
export const bookRecommendedProvider = async (
  providerId: string,
  originalPayload: CreateBookingPayload,
  token: string,
  photos?: PhotoUpload[]
): Promise<ServiceRequest> => {
  const formData = new FormData();
  
  // Add provider_id (required)
  formData.append("provider_id", providerId);
  
  // Add all the same fields as Step 1 (NO booking_mode)
  Object.entries(originalPayload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });
  
  // Re-upload photos (required by backend - 1-5 images)
  if (photos && photos.length > 0) {
    if (photos.length > 5) {
      throw new Error("Maximum 5 photos allowed");
    }
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const filename = `step2_booking_${Date.now()}_${i}.jpg`;
      await appendPhotoToFormData(formData, photo, filename);
    }
  }
  
  console.log('📸 STEP 2: Booking via RECOMMENDED endpoint with provider ID:', providerId);
  console.log('📸 STEP 2: Photos count:', photos?.length || 0);
  
  // Use the CORRECT recommended endpoint
  const response = await apiRequest<ServiceRequest>("/bookings/requests/recommended/", {
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
   PROVIDER ENDPOINTS WITH PAGINATION
═══════════════════════════════════════════════════════════════ */

// PAGINATED VERSIONS (for ProviderJobsScreen)
export const getOpenJobsPaginated = async (
  token: string, 
  page: number = 1
): Promise<Paginated<ServiceRequest>> => {
  let url = "/bookings/requests/open/";
  if (page > 1) {
    url += `?page=${page}`;
  }
  
  console.log(`📄 Fetching open jobs page ${page}...`);
  const res = await apiRequest<Paginated<ServiceRequest>>(url, { method: "GET" }, token);
  console.log(`✅ Page ${page}: ${res.results?.length || 0} of ${res.count} open jobs`);
  return res;
};

export const getIncomingJobsPaginated = async (
  token: string, 
  page: number = 1
): Promise<Paginated<ServiceRequest>> => {
  let url = "/bookings/requests/incoming/";
  if (page > 1) {
    url += `?page=${page}`;
  }
  
  console.log(`📄 Fetching incoming jobs page ${page}...`);
  const res = await apiRequest<Paginated<ServiceRequest>>(url, { method: "GET" }, token);
  console.log(`✅ Page ${page}: ${res.results?.length || 0} of ${res.count} incoming jobs`);
  return res;
};

// ORIGINAL NON-PAGINATED VERSIONS (kept for backward compatibility)
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
  
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value));
    }
  });
  
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
  
  const response = await apiRequest<ServiceRequest>("/bookings/requests/direct/", {
    method: "POST",
    body: formData,
  }, token);
  
  return response;
};