import { apiRequest } from "./api";

/* ─── Types ─────────────────────────────────────────────────────── */
export interface CustomerProfile {
  id:              string;
  email:           string;
  first_name:      string;
  last_name:       string;
  phone:           string;
  profile_picture: string | null;
  address:         string;
  wallet_balance:  string;
  total_cashback:  string;
  total_bookings:  number;
  is_verified:     boolean;
  date_joined:     string;
}

export interface UpdateCustomerPayload {
  first_name?: string;
  last_name?:  string;
  phone?:      string;
  address?:    string;
}

export interface FavoriteProvider {
  id:              string;
  first_name:      string;
  last_name:       string;
  business_name:   string;
  rating:          number;
  total_reviews:   number;
  completion_rate: number;
  profile_picture: string | null;
  is_available:    boolean;
}

interface Paginated<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

/* ─── Endpoints ──────────────────────────────────────────────────── */

// GET /api/v1/customers/me/
export const getCustomerProfile = (token: string) =>
  apiRequest<CustomerProfile>("/customers/me/", { method:"GET" }, token);

// PATCH /api/v1/customers/me/
export const updateCustomerProfile = (payload: UpdateCustomerPayload, token: string) =>
  apiRequest<CustomerProfile>("/customers/me/", {
    method: "PATCH",
    body:   JSON.stringify(payload),
  }, token);

// GET /api/v1/customers/favorites/
export const getFavorites = async (token: string): Promise<FavoriteProvider[]> => {
  const res = await apiRequest<Paginated<FavoriteProvider>>(
    "/customers/favorites/", { method:"GET" }, token
  );
  return res.results ?? [];
};

// POST /api/v1/customers/favorites/<provider_id>/toggle/
export const toggleFavorite = (providerId: string, token: string) =>
  apiRequest<{ is_favorite: boolean; provider_id: string }>(
    `/customers/favorites/${providerId}/toggle/`, { method:"POST" }, token
  );