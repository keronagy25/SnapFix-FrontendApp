// ─── Base API Client ────────────────────────────────────────────────────────
// All API calls funnel through here. Token is pulled from the auth store.

export const BASE_URL = "https://snap-fix-api-production.up.railway.app/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    super(data?.detail || data?.message || "Something went wrong");
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 204 No Content — return empty
  if (response.status === 204) return {} as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}