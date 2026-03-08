import { apiRequest } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface CustomerRegisterPayload {
  email:      string;
  first_name: string;
  last_name:  string;
  phone:      string;
  password:   string;
}

export interface ProviderRegisterPayload {
  first_name: string;
  last_name:  string;
  email:      string;
  phone:      string;
  password:   string;
}

export interface AuthResponse {
  token: string;
  user?: any;
}

// ─── Customer Auth ────────────────────────────────────────────────────────────

export const customerLogin = (payload: LoginPayload) =>
  apiRequest<AuthResponse>("/customers/login/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

export const customerRegister = (payload: CustomerRegisterPayload) =>
  apiRequest<AuthResponse>("/customers/register/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

// ─── Provider Auth ────────────────────────────────────────────────────────────

export const providerLogin = (payload: LoginPayload) =>
  apiRequest<AuthResponse>("/providers/login/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

export const providerRegister = (payload: ProviderRegisterPayload) =>
  apiRequest<AuthResponse>("/providers/register/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });