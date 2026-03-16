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

export async function apiRequest<T>(
  endpoint: string,
  options:  RequestInit = {},
  token?:   string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept":       "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;

  console.log(`[API] ${options.method ?? "GET"} ${url}`);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // 204 No Content
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