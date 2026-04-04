/**
 * Client-side distance/ETA for booking tracking when job + provider coordinates exist.
 * Overrides unreliable API values (e.g. 0 km / 1 min while provider is far away).
 */

const EARTH_KM = 6371;
const ASSUMED_SPEED_KMH = 30;

function parseFlexibleNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parseCoord(v: unknown): number | null {
  return parseFlexibleNumber(v);
}

/** Great-circle distance in km between two WGS84 points. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_KM * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function etaMinutesAt30Kmh(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 0;
  return (distanceKm / ASSUMED_SPEED_KMH) * 60;
}

/** Whole minutes + seconds for display (straight-line at 30 km/h). */
export function etaPartsFromDistanceKm(distanceKm: number): {
  minutes: number;
  seconds: number;
} {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return { minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.round((distanceKm / ASSUMED_SPEED_KMH) * 3600);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatEtaFromDistanceKm(distanceKm: number): string {
  const { minutes, seconds } = etaPartsFromDistanceKm(distanceKm);
  if (minutes === 0 && seconds === 0) return "< 1 min";
  if (minutes === 0) return `${seconds} s`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} s`;
}

function pickProviderCoords(raw: Record<string, any>): { lat: number; lng: number } | null {
  const p = raw.provider as Record<string, any> | null | undefined;
  const loc = raw.provider_last_location as Record<string, any> | null | undefined;
  const lat =
    parseCoord(p?.latitude) ??
    parseCoord(p?.lat) ??
    parseCoord(loc?.latitude) ??
    parseCoord(loc?.lat) ??
    parseCoord(raw.provider_latitude) ??
    parseCoord(raw.provider_last_latitude);
  const lng =
    parseCoord(p?.longitude) ??
    parseCoord(p?.lng) ??
    parseCoord(p?.lon) ??
    parseCoord(loc?.longitude) ??
    parseCoord(loc?.lng) ??
    parseCoord(raw.provider_longitude) ??
    parseCoord(raw.provider_last_longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

function pickJobCoords(raw: Record<string, any>): { lat: number; lng: number } | null {
  const lat = parseCoord(raw.latitude);
  const lng = parseCoord(raw.longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

function pickApiDistanceKm(r: Record<string, any>): number | null {
  const km =
    parseFlexibleNumber(r.provider_distance_km) ??
    parseFlexibleNumber(r.providerDistanceKm);
  if (km != null) return km;
  const meters =
    parseFlexibleNumber(r.provider_distance_m) ??
    parseFlexibleNumber(r.providerDistanceM);
  if (meters != null && meters > 1) return meters / 1000;
  return null;
}

/**
 * Merges computed distance/ETA onto a booking payload.
 * Prefers Haversine from job + provider coordinates when both are present.
 */
export function applyTrackingMetricsToBooking<T extends Record<string, any>>(raw: T): T {
  const job = pickJobCoords(raw);
  const prov = pickProviderCoords(raw);

  let distanceKm: number | null = null;
  let etaMinutes: number | null = null;

  if (job && prov) {
    distanceKm = haversineKm(prov.lat, prov.lng, job.lat, job.lng);
  } else {
    distanceKm = pickApiDistanceKm(raw);
  }

  if (distanceKm != null && Number.isFinite(distanceKm) && distanceKm > 0) {
    etaMinutes = etaMinutesAt30Kmh(distanceKm);
  } else {
    etaMinutes = null;
  }

  return {
    ...raw,
    provider_distance_km: distanceKm,
    provider_eta_minutes: etaMinutes,
  };
}
