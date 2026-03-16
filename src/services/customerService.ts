import { apiRequest } from "./api";

export interface CustomerProfile {
  id:             string;   // UUID string from API
  email:          string;
  first_name:     string;
  last_name:      string;
  phone:          string;
  total_bookings: number;
  role?:          string;
}

// GET /api/v1/customers/me/
export const getCustomerProfile = (token: string) =>
  apiRequest<CustomerProfile>("/customers/me/", { method: "GET" }, token);