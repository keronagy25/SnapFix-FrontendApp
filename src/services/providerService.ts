import { apiRequest } from "./api";

/* ─── Types ─────────────────────────────────────────────────────── */
export interface ProviderProfile {
  id:                  string;
  email:               string;
  first_name:          string;
  last_name:           string;
  phone:               string;
  profile_picture:     string | null;
  address:             string;
  business_name:       string;
  bio:                 string;
  hourly_rate:         string;          // e.g. "100.00"
  years_of_experience: number;
  region:              string;          // UUID
  categories:          string[];        // UUID[]
  verification_status: string;          // "verified" | "pending" | "rejected"
  is_available:        boolean;
  average_rating:      string;          // e.g. "0.00"
  total_reviews:       number;
  total_jobs:          number;
  completed_jobs:      number;
  completion_rate:     number;
  available_balance:   string;          // e.g. "200.00"
  total_earnings:      string;          // e.g. "0.00"
  date_joined:         string;          // ISO datetime
  role?:               string;
  [key: string]: any;
}

export interface UpdateProviderPayload {
  first_name?:          string;
  last_name?:           string;
  phone?:               string;
  bio?:                 string;
  address?:             string;
  business_name?:       string;
  hourly_rate?:         string;
  years_of_experience?: number;
}

/* ─── Endpoints ─────────────────────────────────────────────────── */

// GET /api/v1/providers/me/
export const getProviderProfile = (token: string) =>
  apiRequest<ProviderProfile>("/providers/me/", {
    method: "GET",
  }, token);

// PATCH /api/v1/providers/me/
export const updateProviderProfile = (
  payload: UpdateProviderPayload,
  token:   string,
) =>
  apiRequest<ProviderProfile>("/providers/me/", {
    method: "PATCH",
    body:   JSON.stringify(payload),
  }, token);