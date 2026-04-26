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

// Onboarding Personal Info
export interface PersonalInfoPayload {
  date_of_birth?: string;
  address?: string;
  region?: number;
  category?: number;
  hourly_rate?: string;
  years_of_experience?: number;
  bio?: string;
}

// Onboarding Status Response
export interface OnboardingStatusResponse {
  id: string;
  status: "draft" | "pending" | "under_review" | "approved" | "rejected" | "changes_required";
  ai_validation_status: "pending" | "running" | "passed" | "flagged" | "failed";
  ai_report_summary: {
    status: string;
    issues: string[];
    overall_confidence: number;
  } | null;
  rejection_reason: string;
  change_requests: string;
  can_resubmit: boolean;
  can_resubmit_after: string | null;
  submitted_at: string | null;
  updated_at: string;
}

// Submit Response
export interface SubmitResponse {
  detail: string;
  application: OnboardingStatusResponse;
}

/* ─── Customer Auth (UNCHANGED) ─────────────────────────────────── */
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
  apiRequest<AuthResponse & { onboarding_token: string }>("/providers/register/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

export const providerLogin = (payload: LoginPayload) =>
  apiRequest<{ token: string; provider: any }>("/providers/login/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

export const providerLogout = (token: string) =>
  apiRequest<void>("/providers/logout/", {
    method: "POST",
  }, token);

/* ─── Onboarding Endpoints (uses onboarding_token) ───────────────── */
export const updatePersonalInfo = (token: string, data: PersonalInfoPayload) =>
  apiRequest<OnboardingStatusResponse>("/providers/onboarding/personal/", {
    method: "PATCH",
    body:   JSON.stringify(data),
  }, token);

export const uploadDocuments = (token: string, formData: FormData) =>
  apiRequest<OnboardingStatusResponse>("/providers/onboarding/documents/", {
    method: "PATCH",
    body: formData,
  }, token);

export const submitOnboarding = (token: string) =>
  apiRequest<SubmitResponse>("/providers/onboarding/submit/", {
    method: "POST",
    body: JSON.stringify({}),
  }, token);

export const getOnboardingStatus = (token: string) =>
  apiRequest<OnboardingStatusResponse>("/providers/onboarding/status/", {
    method: "GET",
  }, token);