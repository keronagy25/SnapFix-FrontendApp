import { apiRequest } from "./api";

export interface ProviderProfile {
  id:                   string;   // UUID string from API
  email:                string;
  first_name:           string;
  last_name:            string;
  phone:                string;
  profile_picture:      string | null;
  address:              string;
  business_name:        string;
  bio:                  string;
  hourly_rate:          string;
  years_of_experience:  number;
  region:               string;
  categories:           string[];
  verification_status:  string;   // "verified" | "pending" | "rejected"
  is_available:         boolean;
  average_rating:       string;
  total_reviews:        number;
  total_jobs:           number;
  completed_jobs:       number;
  completion_rate:      number;
  available_balance:    string;
  total_earnings:       string;
  date_joined:          string;
  role?:                string;
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

// GET /api/v1/providers/me/
export const getProviderProfile = (token: string) =>
  apiRequest<ProviderProfile>("/providers/me/", { method: "GET" }, token);

// PATCH /api/v1/providers/me/
export const updateProviderProfile = (payload: UpdateProviderPayload, token: string) =>
  apiRequest<ProviderProfile>("/providers/me/", {
    method: "PATCH",
    body:   JSON.stringify(payload),
  }, token);