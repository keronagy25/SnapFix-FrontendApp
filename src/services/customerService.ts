import { apiRequest } from "./api";
import type { CustomerProfile } from "@/types";

/**
 * GET /api/v1/customers/me/
 * Returns the authenticated customer's profile.
 * Requires a valid auth token.
 */
export const getCustomerProfile = (token: string) =>
  apiRequest<CustomerProfile>("/customers/me/", {}, token);