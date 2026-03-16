import { apiRequest } from "./api";

/* ─── Types ──────────────────────────────────────────────────────── */
export interface AuthResponse {
  token:  string;
  expiry?: string;
  user?: {
    id:         string;
    email:      string;
    first_name?: string;
  };
  // register also returns these at top level
  id?:         string;
  email?:      string;
  first_name?: string;
  last_name?:  string;
  phone?:      string;
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

export interface LoginPayload {
  email:    string;
  password: string;
}

/* ─── Customer Auth ──────────────────────────────────────────────── */
export const customerRegister = (payload: CustomerRegisterPayload) =>
  apiRequest<AuthResponse>("/customers/register/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

export const customerLogin = (payload: LoginPayload) =>
  apiRequest<AuthResponse>("/customers/login/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

export const customerLogout = (token: string) =>
  apiRequest<void>("/customers/logout/", {
    method: "POST",
  }, token);

/* ─── Provider Auth ──────────────────────────────────────────────── */
export const providerRegister = (payload: ProviderRegisterPayload) =>
  apiRequest<AuthResponse>("/providers/register/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

export const providerLogin = (payload: LoginPayload) =>
  apiRequest<AuthResponse>("/providers/login/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

export const providerLogout = (token: string) =>
  apiRequest<void>("/providers/logout/", {
    method: "POST",
  }, token);