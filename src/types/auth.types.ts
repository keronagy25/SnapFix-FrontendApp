export type UserRole = "customer" | "provider";

export type AuthStep =
  | "role-select"
  | "login"
  | "otp-verify"
  | "customer-register"
  | "provider-register";

/* ─── Professions ─── */
export const PROFESSIONS = [
  { id: "plumber",      label: "Plumber",          emoji: "🔧" },
  { id: "electrician",  label: "Electrician",       emoji: "⚡" },
  { id: "ac_technician",label: "AC Technician",     emoji: "❄️" },
  { id: "cleaner",      label: "Cleaner",           emoji: "🧹" },
  { id: "painter",      label: "Painter",           emoji: "🎨" },
  { id: "carpenter",    label: "Carpenter",         emoji: "🪚" },
  { id: "mason",        label: "Mason",             emoji: "🧱" },
  { id: "appliance",    label: "Appliance Repair",  emoji: "🔌" },
  { id: "pest_control", label: "Pest Control",      emoji: "🐛" },
  { id: "locksmith",    label: "Locksmith",         emoji: "🔑" },
] as const;

export type ProfessionId = typeof PROFESSIONS[number]["id"];

/* ─── Shared ─── */
export interface BaseUser {
  id:        string;
  fullName:  string;
  phone:     string;
  email:     string;
  role:      UserRole;
  avatar?:   string;
  createdAt: string;
}

/* ─── Customer ─── */
export interface CustomerProfile extends BaseUser {
  role:          "customer";
  homeAddress:   string;
  homeCoords?:   { lat: number; lng: number };
  walletBalance: number;
}

/* ─── Provider ─── */
export type ProviderStatus = "pending" | "active" | "suspended";

export interface ProviderProfile extends BaseUser {
  role:               "provider";
  nationalId:         string;
  nationalIdImage?:   string;
  profession:         string;
  yearsExperience:    number;
  portfolio?:         string[];
  certificate?:       string;
  verificationStatus: ProviderStatus;
  rating:             number;
  totalJobs:          number;
  walletBalance:      number;
  isOnline:           boolean;
}

/* ─── Auth State ─── */
export interface AuthState {
  user:            CustomerProfile | ProviderProfile | null;
  role:            UserRole | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  token:           string | null;
}

/* ─── Register Payloads ─── */
export interface CustomerRegisterPayload {
  fullName:    string;
  email:       string;
  phone:       string;
  homeAddress: string;
  homeCoords?: { lat: number; lng: number };
}

export interface ProviderRegisterPayload {
  fullName:        string;
  email:           string;
  phone:           string;
  nationalId:      string;
  nationalIdImage: string;
  profession:      string;
  yearsExperience: number;
  certificate?:    string;
}

/* ─── Form Errors ─── */
export type CustomerRegisterErrors = Partial<
  Record<keyof CustomerRegisterPayload, string>
>;

export type ProviderRegisterErrors = Partial<
  Record<keyof ProviderRegisterPayload, string>
>;