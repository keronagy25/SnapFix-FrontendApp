const BASE_URL = "https://snap-fix-api-production.up.railway.app/api/v1";

export class ApiError extends Error {
  status: number;
  data:   any;
  constructor(status: number, data: any) {
    super(`API Error ${status}`);
    this.status = status;
    this.data   = data;
  }
}

/**
 * Extract the best human-readable message from any API error body.
 * Handles: string, array ["msg"], object {detail, non_field_errors, ...}
 */
export function extractApiMessage(data: any, fallback = "Something went wrong."): string {
  if (!data) return fallback;
  // Root-level array: ["You already have an active job..."]
  if (Array.isArray(data)) {
    return data.length > 0 ? String(data[0]) : fallback;
  }
  // Object with known fields
  if (typeof data === "object") {
    const d = data as Record<string, any>;
    if (d.detail)           return Array.isArray(d.detail)           ? String(d.detail[0])           : String(d.detail);
    if (d.non_field_errors) return Array.isArray(d.non_field_errors) ? String(d.non_field_errors[0]) : String(d.non_field_errors);
    if (d.error)            return Array.isArray(d.error)            ? String(d.error[0])            : String(d.error);
    if (d.message)          return Array.isArray(d.message)          ? String(d.message[0])          : String(d.message);
    // First field error
    for (const [key, val] of Object.entries(d)) {
      const msg = Array.isArray(val) ? String(val[0]) : String(val);
      if (msg) return msg;
    }
  }
  if (typeof data === "string" && data) return data;
  return fallback;
}

export async function apiRequest<T>(
  endpoint: string,
  options:  RequestInit = {},
  token?:   string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  console.log(`[API] ${options.method ?? "GET"} ${url}`);

  const res = await fetch(url, { ...options, headers });

  if (res.status === 204) return {} as T;

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    console.log(`[API] Error ${res.status}:`, JSON.stringify(data));
    throw new ApiError(res.status, data);
  }

  return data as T;
}