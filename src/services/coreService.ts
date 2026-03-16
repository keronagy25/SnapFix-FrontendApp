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