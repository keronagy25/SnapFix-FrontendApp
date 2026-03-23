import { apiRequest } from "./api";

/* ─── Types ──────────────────────────────────────────────────────── */
export interface Category {
  id:   number;
  name: string;
  icon: string;   // icon key e.g. "wrench", "bolt"
}

export interface Region {
  id:   number;
  name: string;
}

interface Paginated<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

/* ─── Endpoints ──────────────────────────────────────────────────── */

// GET /api/v1/core/categories/
export const getCategories = async (token?: string): Promise<Category[]> => {
  const res = await apiRequest<Paginated<Category> | Category[]>(
    "/core/categories/", { method: "GET" }, token
  );
  return Array.isArray(res) ? res : (res as Paginated<Category>).results ?? [];
};

// GET /api/v1/core/regions/
export const getRegions = async (token?: string): Promise<Region[]> => {
  const res = await apiRequest<Paginated<Region> | Region[]>(
    "/core/regions/", { method: "GET" }, token
  );
  return Array.isArray(res) ? res : (res as Paginated<Region>).results ?? [];
};

/* ─── Office Types ───────────────────────────────────────────────── */
export interface Office {
  id:            string;
  name:          string;
  address:       string;
  landmark:      string;
  latitude:      string;
  longitude:     string;
  region_name?:  string;
  region?:       { id:string; name:string; slug:string; code:string; country:string; latitude:string; longitude:string; is_active:boolean };
  working_hours: string;
  is_active?:    boolean;
  created_at?:   string;
  distance_km?:  number;
}

// GET /api/v1/core/offices/
export const getOffices = async (token?: string): Promise<Office[]> => {
  const res = await apiRequest<Office[] | { results: Office[] }>(
    "/core/offices/", { method:"GET" }, token
  );
  return Array.isArray(res) ? res : (res as any).results ?? [];
};

// GET /api/v1/core/offices/<id>/
export const getOfficeById = (id: string, token?: string) =>
  apiRequest<Office>(`/core/offices/${id}/`, { method:"GET" }, token);

// GET /api/v1/core/offices/nearest/?lat=<lat>&lng=<lng>
export const getNearestOffice = (lat: number, lng: number, token?: string) =>
  apiRequest<Office>(`/core/offices/nearest/?lat=${lat}&lng=${lng}`, { method:"GET" }, token);