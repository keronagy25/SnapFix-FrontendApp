/**
 * apiErrors.ts — parse API errors into user-friendly messages
 *
 * Usage:
 *   catch (err) {
 *     const msg    = parseApiError(err);           // single string
 *     const fields = parseFieldErrors(err);        // Record<field, message>
 *   }
 */

const STATUS_MSG: Record<number, string> = {
  400: "Please check your input and try again.",
  401: "Session expired. Please log in again.",
  403: "You don't have permission to do that.",
  404: "Item not found.",
  429: "Too many requests. Please wait a moment.",
  500: "Server error. Please try again later.",
};

const FIELD_LABEL: Record<string, string> = {
  email: "Email", password: "Password", first_name: "First name",
  last_name: "Last name", phone: "Phone", category: "Service category",
  region: "Region", address: "Address", title: "Title",
  description: "Description", preferred_date: "Date", preferred_time: "Time",
  estimated_price: "Estimated price", final_price: "Final price",
};

/** Best single-line message from an ApiError or plain Error */
export function parseApiError(err: any, fallback = "Something went wrong. Please try again."): string {
  if (!err) return fallback;
  const data   = err?.data ?? {};
  const status = err?.status as number | undefined;

  if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length)
    return data.non_field_errors[0];
  if (typeof data?.detail === "string" && data.detail) return data.detail;

  for (const [field, val] of Object.entries(data)) {
    if (field === "non_field_errors" || field === "detail") continue;
    const label = FIELD_LABEL[field] ?? field;
    const msg   = Array.isArray(val) ? val[0] : String(val);
    if (msg) return label ? `${label}: ${msg}` : msg;
  }

  if (status && STATUS_MSG[status]) return STATUS_MSG[status];
  if (err?.message) return err.message;
  return fallback;
}

/** All field-level errors as a map — perfect for setting form state */
export function parseFieldErrors(err: any): Record<string, string> {
  const data = err?.data ?? {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (k === "detail") continue;
    out[k] = Array.isArray(v) ? (v[0] as string) : String(v);
  }
  return out;
}

export const isAuthError    = (err: any) => err?.status === 401;
export const isNotFound     = (err: any) => err?.status === 404;
export const isServerError  = (err: any) => (err?.status ?? 0) >= 500;