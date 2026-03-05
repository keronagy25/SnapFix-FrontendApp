export type UserRole = "customer" | "provider";

export type AuthStep =
  | "role-select"
  | "login"
  | "otp-verify"
  | "customer-register"
  | "provider-register";

/* ─── Professions ─── */
export const PROFESSIONS = [
  { id: "plumber",       label: "Plumber",         emoji: "🔧" },
  { id: "electrician",   label: "Electrician",      emoji: "⚡" },
  { id: "ac_technician", label: "AC Technician",    emoji: "❄️" },
  { id: "cleaner",       label: "Cleaner",          emoji: "🧹" },
  { id: "painter",       label: "Painter",          emoji: "🎨" },
  { id: "carpenter",     label: "Carpenter",        emoji: "🪚" },
  { id: "mason",         label: "Mason",            emoji: "🧱" },
  { id: "appliance",     label: "Appliance Repair", emoji: "🔌" },
  { id: "pest_control",  label: "Pest Control",     emoji: "🐛" },
  { id: "locksmith",     label: "Locksmith",        emoji: "🔑" },
] as const;

export type ProfessionId = typeof PROFESSIONS[number]["id"];

/* ─── Shared Base ────────────────────────────────────────────────────────────
   Fields every user has, matching what the API actually returns.
   - `fullName` is a computed convenience getter (first_name + last_name)
   - `phone`, `homeAddress`, `createdAt` are optional because the API may
     not always return them (e.g. right after registration)
────────────────────────────────────────────────────────────────────────────── */
export interface BaseUser {
  id:         number;          // API returns numeric id
  first_name: string;
  last_name:  string;
  email:      string;
  role:       UserRole;
  phone?:     string;          // optional — not required by API
  avatar?:    string;
  createdAt?: string;          // optional — may not come from all endpoints

  /** Convenience getter: `first_name + " " + last_name` */
  get fullName(): string;
}

/* ─── Customer ───────────────────────────────────────────────────────────────
   Fields returned by GET /api/v1/customers/me/
   homeAddress and walletBalance are optional because the API may not include
   them yet (we only know email, first_name, last_name from the register flow)
────────────────────────────────────────────────────────────────────────────── */
export interface CustomerProfile {
  id:            number;
  first_name:    string;
  last_name:     string;
  email:         string;
  role:          "customer";
  phone?:        string;
  avatar?:       string;
  createdAt?:    string;
  homeAddress?:  string;       // optional — not in register API
  homeCoords?:   { lat: number; lng: number };
  walletBalance?: number;      // optional — not in register API
}

/* ─── Provider ───────────────────────────────────────────────────────────────
   Fields returned by GET /api/v1/providers/me/ (add endpoint when available)
────────────────────────────────────────────────────────────────────────────── */
export type ProviderStatus = "pending" | "active" | "suspended";

export interface ProviderProfile {
  id:                 number;
  first_name:         string;
  last_name:          string;
  email:              string;
  role:               "provider";
  phone?:             string;
  avatar?:            string;
  createdAt?:         string;
  nationalId?:        string;
  nationalIdImage?:   string;
  profession?:        string;
  yearsExperience?:   number;
  portfolio?:         string[];
  certificate?:       string;
  verificationStatus?: ProviderStatus;
  rating?:            number;
  totalJobs?:         number;
  walletBalance?:     number;
  isOnline?:          boolean;
}

/* ─── Auth State ─────────────────────────────────────────────────────────── */
export interface AuthState {
  user:            CustomerProfile | ProviderProfile | null;
  role:            UserRole | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  token:           string | null;
}

/* ─── Register Payloads (what we send TO the API) ────────────────────────── */
export interface CustomerRegisterPayload {
  first_name: string;
  last_name:  string;
  email:      string;
  password:   string;
}

export interface ProviderRegisterPayload {
  first_name: string;
  last_name:  string;
  email:      string;
  password:   string;
}

/* ─── Form Errors ────────────────────────────────────────────────────────── */
export type CustomerRegisterErrors = Partial<
  Record<keyof CustomerRegisterPayload, string>
>;

export type ProviderRegisterErrors = Partial<
  Record<keyof ProviderRegisterPayload, string>
>;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Get display name from either profile type */
export const getFullName = (
  user: CustomerProfile | ProviderProfile
): string => `${user.first_name} ${user.last_name}`.trim();