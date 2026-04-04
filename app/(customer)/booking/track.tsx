// app/(customer)/booking/track.tsx

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore }       from "@/store/authStore";
import { useBookingTracking } from "@/hooks/useBookingTracking";

export default function TrackBookingScreen() {
  const router = useRouter();

  // ── Get bookingId from URL params ────────────────────────────
  // Usage: router.push(`/booking/track?bookingId=${id}`)
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  // ── Get token from Zustand store ─────────────────────────────
  const token = useAuthStore((state) => state.token);

  const {
    tracking,
    isLoading,
    error,
    isPolling,
    refresh,
    providerAssigned,
    locationAvailable,
    isTerminal,
  } = useBookingTracking({
    bookingId: bookingId ?? "",
    token,
    pollIntervalMs: 5000,
  });

  // ── Loading ──────────────────────────────────────────────────
  if (isLoading && !tracking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading tracking info...</Text>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────
  if (error && !tracking) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          tintColor="#f97316"
        />
      }
    >
      {/* ── Status Card ───────────────────────────────────────── */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Request Status</Text>
        <Text style={styles.statusValue}>
          {tracking?.status_display ?? "—"}
        </Text>

        {/* Live indicator — only show when actively polling */}
        {isPolling && !isTerminal && (
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live • Updates every 5s</Text>
          </View>
        )}
      </View>

      {/* ── Provider Card ─────────────────────────────────────── */}
      {providerAssigned && tracking?.provider ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👷 Assigned Provider</Text>
          <Text style={styles.providerName}>
            {tracking.provider.first_name} {tracking.provider.last_name}
          </Text>
          <Text style={styles.cardSubText}>
            🏢 {tracking.provider.business_name}
          </Text>
          <Text style={styles.cardSubText}>
            ⭐ {tracking.provider.rating} · {tracking.provider.total_reviews} reviews
          </Text>
          <Text style={styles.cardSubText}>
            ✅ {tracking.provider.completion_rate}% completion rate
          </Text>
        </View>
      ) : (
        // ── Waiting for provider ─────────────────────────────────
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⏳ Finding a Provider</Text>
          <Text style={styles.cardSubText}>
            We're matching you with the best available provider...
          </Text>
          <ActivityIndicator
            size="small"
            color="#f97316"
            style={{ marginTop: 10, alignSelf: "flex-start" }}
          />
        </View>
      )}

      {/* ── Distance & ETA — only show after provider assigned ── */}
      {providerAssigned && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Provider Location</Text>

          {locationAvailable ? (
            // ── Location received ──────────────────────────────
            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                  {tracking?.provider_distance_km?.toFixed(1)}
                </Text>
                <Text style={styles.metricUnit}>km away</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>
                  {tracking?.provider_eta_minutes}
                </Text>
                <Text style={styles.metricUnit}>min ETA</Text>
              </View>
            </View>
          ) : (
            // ── Waiting for location ping ──────────────────────
            <View style={styles.waitingRow}>
              <ActivityIndicator size="small" color="#f97316" />
              <Text style={styles.waitingText}>
                Waiting for provider's location...
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Timeline ──────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🕐 Timeline</Text>
        <TimelineRow label="Provider Assigned" value={tracking?.assigned_at} />
        <TimelineRow label="Confirmed"         value={tracking?.confirmed_at} />
        <TimelineRow label="Started"           value={tracking?.started_at} />
        <TimelineRow label="Completed"         value={tracking?.completed_at} />
        <TimelineRow label="Cancelled"         value={tracking?.cancelled_at} />
      </View>

      {/* ── Terminal status message ───────────────────────────── */}
      {isTerminal && (
        <View style={[
          styles.card,
          tracking?.status === "completed" ? styles.successCard : styles.dangerCard,
        ]}>
          <Text style={[
            styles.terminalText,
            tracking?.status === "completed" ? styles.successText : styles.dangerText,
          ]}>
            {tracking?.status === "completed" && "✅ Job Completed Successfully!"}
            {tracking?.status === "cancelled" &&
              `❌ Cancelled — ${tracking.cancellation_reason || "No reason provided"}`}
            {tracking?.status === "declined" &&
              `❌ Declined — ${tracking.decline_reason || "No reason provided"}`}
          </Text>
        </View>
      )}

      {/* ── Back button ───────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back to Bookings</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Timeline Row ─────────────────────────────────────────────
function TimelineRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  const formatted = new Date(value).toLocaleString("en-US", {
    month:  "short",
    day:    "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineDot} />
      <Text style={styles.timelineLabel}>{label}</Text>
      <Text style={styles.timelineValue}>{formatted}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: "#f5f5f5" },
  content:    { padding: 16 },
  center:     { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  loadingText:{ marginTop: 12, color: "#666", fontSize: 14 },
  errorText:  { color: "#dc2626", textAlign: "center", marginBottom: 16, fontSize: 14 },
  retryBtn:   { backgroundColor: "#f97316", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText:  { color: "#fff", fontWeight: "bold" },

  // Status card
  statusCard: {
    backgroundColor: "#f97316",
    borderRadius:    14,
    padding:         20,
    marginBottom:    12,
    alignItems:      "center",
  },
  statusLabel:{ color: "#fff", fontSize: 13, opacity: 0.85 },
  statusValue:{ color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 4 },
  liveRow:    { flexDirection: "row", alignItems: "center", marginTop: 8 },
  liveDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff", marginRight: 6 },
  liveText:   { color: "#fff", fontSize: 12, opacity: 0.85 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius:    14,
    padding:         16,
    marginBottom:    12,
    shadowColor:     "#000",
    shadowOpacity:   0.06,
    shadowRadius:    6,
    elevation:       2,
  },
  cardTitle:    { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 10 },
  cardSubText:  { fontSize: 13, color: "#666", marginTop: 4 },
  providerName: { fontSize: 17, fontWeight: "700", color: "#111" },

  // Metrics
  metricsRow:    { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 8 },
  metricBox:     { alignItems: "center", flex: 1 },
  metricValue:   { fontSize: 32, fontWeight: "800", color: "#f97316" },
  metricUnit:    { fontSize: 13, color: "#888", marginTop: 4 },
  metricDivider: { width: 1, height: 50, backgroundColor: "#e5e7eb" },

  // Waiting
  waitingRow:  { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
  waitingText: { color: "#888", fontSize: 13 },

  // Timeline
  timelineRow:   { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  timelineDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: "#f97316", marginRight: 8 },
  timelineLabel: { flex: 1, fontSize: 13, color: "#444" },
  timelineValue: { fontSize: 12, color: "#888" },

  // Terminal
  successCard:  { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#86efac" },
  dangerCard:   { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fca5a5" },
  terminalText: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  successText:  { color: "#15803d" },
  dangerText:   { color: "#dc2626" },

  // Back button
  backBtn:  { alignItems: "center", padding: 14, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  backText: { color: "#f97316", fontWeight: "600" },
});