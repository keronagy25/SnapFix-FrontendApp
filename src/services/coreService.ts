import { apiRequest } from "./api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Category {
  id:          number;
  name:        string;
  slug:        string;
  description: string;
  icon:        string;
}

export interface CategoryPayload {
  name:        string;
  slug:        string;
  description: string;
  icon:        string;
}

export interface Region {
  id:      number;
  name:    string;
  slug:    string;
  code:    string;
  country: string;
  location?: {
    type:        "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
}

export interface RegionPayload {
  name:      string;
  slug:      string;
  code:      string;
  country:   string;
  location?: {
    type:        "Point";
    coordinates: [number, number];
  };
}

// Django REST Framework returns paginated lists by default
interface PaginatedResponse<T> {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  T[];
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const getCategories = async (): Promise<Category[]> => {
  const res = await apiRequest<PaginatedResponse<Category> | Category[]>(
    "/core/categories/",
    { method: "GET" }
  );
  // Handle both paginated { results: [] } and plain array responses
  return Array.isArray(res) ? res : res.results ?? [];
};

export const createCategory = (payload: CategoryPayload) =>
  apiRequest<Category>("/core/categories/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });

// ─── Regions ─────────────────────────────────────────────────────────────────

export const getRegions = async (): Promise<Region[]> => {
  const res = await apiRequest<PaginatedResponse<Region> | Region[]>(
    "/core/regions/",
    { method: "GET" }
  );
  return Array.isArray(res) ? res : res.results ?? [];
};

export const createRegion = (payload: RegionPayload) =>
  apiRequest<Region>("/core/regions/", {
    method: "POST",
    body:   JSON.stringify(payload),
  });