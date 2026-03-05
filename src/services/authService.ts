import { apiRequest } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CustomerRegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user?: any; // we'll fetch profile separately
}

// ─── Customer Auth ────────────────────────────────────────────────────────────

export const customerLogin = (payload: LoginPayload) =>
  apiRequest<AuthResponse>("/customers/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const customerRegister = (payload: CustomerRegisterPayload) =>
  apiRequest<AuthResponse>("/customers/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// ─── Provider Auth ────────────────────────────────────────────────────────────

export const providerLogin = (payload: LoginPayload) =>
  apiRequest<AuthResponse>("/providers/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });