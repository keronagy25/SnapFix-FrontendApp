// hooks/useBookingTracking.ts

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getBookingTracking,
  getHistoryDetail,
  type ServiceRequest,
  type BookingStatus,
} from "@/services/bookingService";
import { applyTrackingMetricsToBooking } from "@/utils/trackingGeo";

export function normalizeBookingRouteId(
  bookingId?: string | string[],
  id?: string | string[],
): string {
  const a = bookingId == null ? "" : Array.isArray(bookingId) ? (bookingId[0] ?? "") : bookingId;
  if (a.trim()) return a.trim();
  const b = id == null ? "" : Array.isArray(id) ? (id[0] ?? "") : id;
  return b.trim();
}

/** API may return numbers as strings; treat empty string as missing. */
export function parseTrackingNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const ASSIGNED_LIKE: BookingStatus[] = ["assigned", "confirmed", "in_progress"];

// ─── Stop polling on these statuses ───────────────────────────
const TERMINAL_STATUSES: BookingStatus[] = [
  "completed",
  "cancelled", 
  "declined",
];

// ─── Types ────────────────────────────────────────────────────
interface UseBookingTrackingOptions {
  bookingId:       string;
  token:           string | null;
  pollIntervalMs?: number;   // default: 30000ms
  enabled?:        boolean;  // default: true
}

interface UseBookingTrackingReturn {
  tracking:            ServiceRequest | null;
  isLoading:           boolean;
  error:               string | null;
  isPolling:           boolean;
  refresh:             () => void;
  stopPolling:         () => void;
  providerAssigned:    boolean;
  locationAvailable:   boolean;
  /** Parsed for display (null until API sends both distance and ETA). */
  parsedDistanceKm:    number | null;
  parsedEtaMinutes:    number | null;
  isTerminal:          boolean;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useBookingTracking({
  bookingId,
  token,
  pollIntervalMs = 30_000,
  enabled = true,
}: UseBookingTrackingOptions): UseBookingTrackingReturn {

  const [tracking,  setTracking]  = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // ─── Derived state ──────────────────────────────────────────
  const parsedDistanceKm = tracking ? parseTrackingNumber(tracking.provider_distance_km) : null;
  const parsedEtaMinutes = tracking ? parseTrackingNumber(tracking.provider_eta_minutes) : null;
  /** Show live metrics once backend sends numeric distance and ETA (after provider ping). */
  const locationAvailable =
    parsedDistanceKm !== null && parsedEtaMinutes !== null;
  /** Some serializers omit `provider` on the request object; use status and merge history below. */
  const providerAssigned =
    tracking != null &&
    (ASSIGNED_LIKE.includes(tracking.status) || !!tracking.provider);
  const isTerminal = tracking
    ? TERMINAL_STATUSES.includes(tracking.status)
    : false;

  // ─── Stop polling ────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // ─── Fetch ───────────────────────────────────────────────────
  const fetchTracking = useCallback(async (showLoader = false) => {
    if (!bookingId || !token) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setTracking(null);
      }
      return;
    }

    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      let data = await getBookingTracking(bookingId, token);

      if (ASSIGNED_LIKE.includes(data.status) && !data.provider) {
        try {
          const history = await getHistoryDetail(bookingId, token);
          if (history?.provider) data = { ...data, provider: history.provider };
        } catch {
          /* history is optional enrichment */
        }
      }

      data = applyTrackingMetricsToBooking(data as Record<string, unknown>) as ServiceRequest;

      if (!isMountedRef.current) return;

      setTracking(data);

      if (TERMINAL_STATUSES.includes(data.status)) stopPolling();
    } catch (err: any) {
      if (!isMountedRef.current) return;
      const msg =
        typeof err?.data?.detail === "string"
          ? err.data.detail
          : Array.isArray(err?.data?.detail)
            ? String(err.data.detail[0])
            : "Failed to load tracking info.";
      setError(msg);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [bookingId, token, stopPolling]);

  // ─── Start polling ───────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // already running

    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      fetchTracking(false); // silent — no loader
    }, pollIntervalMs);
  }, [fetchTracking, pollIntervalMs]);

  // ─── Manual refresh ──────────────────────────────────────────
  const refresh = useCallback(() => {
    fetchTracking(true);
  }, [fetchTracking]);

  // ─── Lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || !bookingId || !token) {
      stopPolling();
      return () => {
        isMountedRef.current = false;
      };
    }

    fetchTracking(true);
    startPolling();

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [bookingId, token, enabled, fetchTracking, startPolling, stopPolling]);

  return {
    tracking,
    isLoading,
    error,
    isPolling,
    refresh,
    stopPolling,
    providerAssigned,
    locationAvailable,
    parsedDistanceKm,
    parsedEtaMinutes,
    isTerminal,
  };
}