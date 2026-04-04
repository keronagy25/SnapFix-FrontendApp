// hooks/useBookingTracking.ts

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getBookingTracking,
  TrackingInfo,
  BookingStatus,
} from "@/services/bookingService";

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
  pollIntervalMs?: number;   // default: 5000ms
  enabled?:        boolean;  // default: true
}

interface UseBookingTrackingReturn {
  tracking:          TrackingInfo | null;
  isLoading:         boolean;
  error:             string | null;
  isPolling:         boolean;
  refresh:           () => void;
  stopPolling:       () => void;
  providerAssigned:  boolean;
  locationAvailable: boolean;
  isTerminal:        boolean;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useBookingTracking({
  bookingId,
  token,
  pollIntervalMs = 5000,
  enabled = true,
}: UseBookingTrackingOptions): UseBookingTrackingReturn {

  const [tracking,  setTracking]  = useState<TrackingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // ─── Derived state ──────────────────────────────────────────
  const providerAssigned  = !!tracking?.provider;
  const locationAvailable =
    tracking?.provider_distance_km !== null &&
    tracking?.provider_distance_km !== undefined;
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
    // Guard: need both bookingId and token
    if (!bookingId || !token) return;

    try {
      if (showLoader) setIsLoading(true);
      setError(null);

      const data = await getBookingTracking(bookingId, token);

      if (!isMountedRef.current) return;

      setTracking(data);

      // ✅ Auto-stop when terminal status reached
      if (TERMINAL_STATUSES.includes(data.status)) {
        stopPolling();
        console.log("[Tracking] Stopped — terminal status:", data.status);
      }

    } catch (err: any) {
      if (!isMountedRef.current) return;
      const msg = err?.data?.detail ?? "Failed to load tracking info.";
      setError(msg);
      console.warn("[Tracking] Error:", err);
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

    if (!enabled || !token) return;

    fetchTracking(true); // first fetch immediately
    startPolling();       // then poll every N ms

    return () => {
      isMountedRef.current = false;
      stopPolling();        // cleanup on unmount
    };
  }, [bookingId, token, enabled]);

  return {
    tracking,
    isLoading,
    error,
    isPolling,
    refresh,
    stopPolling,
    providerAssigned,
    locationAvailable,
    isTerminal,
  };
}