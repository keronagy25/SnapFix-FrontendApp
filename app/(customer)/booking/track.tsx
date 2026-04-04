import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Clock,
  User,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Info,
} from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import {
  useBookingTracking,
  normalizeBookingRouteId,
} from "@/hooks/useBookingTracking";
import type { BookingStatus } from "@/services/bookingService";
import { formatEtaFromDistanceKm } from "@/utils/trackingGeo";

const STATUS: Record<
  BookingStatus,
  { label: string; color: string; bg: string; icon: typeof Clock; desc: string }
> = {
  pending: {
    label: "Pending",
    color: "#F59E0B",
    bg: "#FFFBEB",
    icon: Clock,
    desc: "Waiting for a provider to be assigned.",
  },
  assigned: {
    label: "Assigned",
    color: "#3B82F6",
    bg: "#EFF6FF",
    icon: Info,
    desc: "A provider has been assigned. Awaiting confirmation.",
  },
  confirmed: {
    label: "Confirmed",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    icon: CheckCircle,
    desc: "Provider confirmed — job is scheduled.",
  },
  in_progress: {
    label: "In Progress",
    color: "#06B6D4",
    bg: "#ECFEFF",
    icon: Zap,
    desc: "Your provider is currently working on-site.",
  },
  completed: {
    label: "Completed",
    color: "#10B981",
    bg: "#ECFDF5",
    icon: CheckCircle,
    desc: "Job finished successfully.",
  },
  cancelled: {
    label: "Cancelled",
    color: "#EF4444",
    bg: "#FEF2F2",
    icon: XCircle,
    desc: "This booking was cancelled.",
  },
  declined: {
    label: "Declined",
    color: "#94A3B8",
    bg: "#F8FAFC",
    icon: AlertCircle,
    desc: "Provider declined. Request returned to pool.",
  },
};

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: Typography.fonts.semibold,
        fontSize: 11,
        color: "#94A3B8",
        letterSpacing: 1.1,
        marginTop: 22,
        marginBottom: 10,
      }}
    >
      {children}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        shadowColor: "#1E3A8A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

export default function TrackBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string | string[];
    id?: string | string[];
  }>();
  const bookingId = normalizeBookingRouteId(params.bookingId, params.id);
  const missingBookingParam = !bookingId;

  const token = useAuthStore((state) => state.token);

  const {
    tracking,
    isLoading,
    error,
    isPolling,
    refresh,
    providerAssigned,
    locationAvailable,
    parsedDistanceKm,
    parsedEtaMinutes,
    isTerminal,
  } = useBookingTracking({
    bookingId,
    token,
    pollIntervalMs: 30_000,
    enabled: !missingBookingParam && !!token,
  });

  if (missingBookingParam) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F8FAFC",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 32,
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text
          style={{
            fontFamily: Typography.fonts.bold,
            fontSize: 16,
            color: "#0F172A",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Missing booking
        </Text>
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize: 13,
            color: "#94A3B8",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Open tracking from a booking using the Track button.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#1E3A8A",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 16,
          }}
        >
          <ArrowLeft size={16} color="#fff" />
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              fontSize: 14,
              color: "#fff",
            }}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!token) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F8FAFC",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize: 14,
            color: "#64748B",
            textAlign: "center",
          }}
        >
          Sign in to track your request.
        </Text>
      </View>
    );
  }

  if (isLoading && !tracking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F8FAFC",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize: 14,
            color: "#94A3B8",
            marginTop: 12,
          }}
        >
          Loading tracking…
        </Text>
      </View>
    );
  }

  if (error && !tracking) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F8FAFC",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize: 14,
            color: "#64748B",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={refresh}
          style={{
            backgroundColor: "#1E3A8A",
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              fontFamily: Typography.fonts.bold,
              fontSize: 15,
              color: "#fff",
            }}
          >
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = tracking?.status ?? "pending";
  const s = STATUS[status] ?? STATUS.pending;
  const StatusIcon = s.icon;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !!tracking}
            onRefresh={refresh}
            tintColor="#1E3A8A"
            colors={["#1E3A8A"]}
          />
        }
      >
        <LinearGradient
          colors={["#1E3A8A", "#1E40AF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingTop: Platform.OS === "android" ? 48 : 60,
            paddingBottom: 32,
            paddingHorizontal: 20,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: "rgba(6,182,212,0.08)",
            }}
          />
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              backgroundColor: "rgba(255,255,255,0.12)",
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              alignSelf: "flex-start",
              marginBottom: 10,
            }}
          >
            <Navigation size={14} color="#7DD3FC" />
            <Text
              style={{
                fontFamily: Typography.fonts.semibold,
                fontSize: 13,
                color: "#fff",
              }}
            >
              Live tracking
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              backgroundColor: "rgba(255,255,255,0.12)",
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 20,
              alignSelf: "flex-start",
              marginBottom: 14,
            }}
          >
            <StatusIcon size={14} color={s.color} />
            <Text
              style={{
                fontFamily: Typography.fonts.semibold,
                fontSize: 13,
                color: "#fff",
              }}
            >
              {s.label}
            </Text>
          </View>
          {isPolling && !isTerminal && (
            <Text
              style={{
                fontFamily: Typography.fonts.regular,
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                marginBottom: 10,
              }}
            >
              Refreshes every 30 seconds
            </Text>
          )}
          <Text
            style={{
              fontFamily: Typography.fonts.extrabold,
              fontSize: 22,
              color: "#fff",
              marginBottom: 6,
              lineHeight: 30,
            }}
          >
            {tracking?.title ?? "Your request"}
          </Text>
          <Text
            style={{
              fontFamily: Typography.fonts.regular,
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            {tracking?.category?.name} · {tracking?.region?.name}
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: s.bg,
              borderRadius: 16,
              padding: 14,
              marginTop: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <StatusIcon size={16} color={s.color} />
            <Text
              style={{
                fontFamily: Typography.fonts.medium,
                fontSize: 13,
                color: s.color,
                flex: 1,
              }}
            >
              {s.desc}
            </Text>
          </View>

          {(tracking?.address || tracking?.latitude != null) && (
            <>
              <SectionLabel>SERVICE LOCATION</SectionLabel>
              <Card>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      backgroundColor: "#FEE2E215",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MapPin size={18} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    {!!tracking?.address && (
                      <Text
                        style={{
                          fontFamily: Typography.fonts.semibold,
                          fontSize: 14,
                          color: "#0F172A",
                          lineHeight: 20,
                        }}
                      >
                        {tracking.address}
                      </Text>
                    )}
                    {tracking?.latitude != null && tracking?.longitude != null && (
                      <Text
                        style={{
                          fontFamily: Typography.fonts.regular,
                          fontSize: 12,
                          color: "#64748B",
                          marginTop: 6,
                        }}
                      >
                        {Number(tracking.latitude).toFixed(5)},{" "}
                        {Number(tracking.longitude).toFixed(5)}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            </>
          )}

          {providerAssigned && (
            <>
              <SectionLabel>DISTANCE & ETA</SectionLabel>
              <Card>
                {locationAvailable &&
                parsedDistanceKm !== null &&
                parsedEtaMinutes !== null ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-around",
                      paddingVertical: 8,
                    }}
                  >
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: Typography.fonts.extrabold,
                          fontSize: 28,
                          color: "#1E3A8A",
                        }}
                      >
                        {parsedDistanceKm < 100
                          ? parsedDistanceKm.toFixed(2)
                          : parsedDistanceKm.toFixed(1)}
                      </Text>
                      <Text
                        style={{
                          fontFamily: Typography.fonts.regular,
                          fontSize: 12,
                          color: "#64748B",
                          marginTop: 4,
                        }}
                      >
                        km away
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 1,
                        height: 52,
                        backgroundColor: "#E2E8F0",
                      }}
                    />
                    <View style={{ alignItems: "center", flex: 1, paddingHorizontal: 4 }}>
                      <Text
                        style={{
                          fontFamily: Typography.fonts.extrabold,
                          fontSize: 22,
                          color: "#3B82F6",
                          textAlign: "center",
                        }}
                      >
                        {formatEtaFromDistanceKm(parsedDistanceKm)}
                      </Text>
                      <Text
                        style={{
                          fontFamily: Typography.fonts.regular,
                          fontSize: 12,
                          color: "#64748B",
                          marginTop: 4,
                          textAlign: "center",
                        }}
                      >
                        ETA · straight line · 30 km/h
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 4,
                    }}
                  >
                    <ActivityIndicator size="small" color="#1E3A8A" />
                    <Text
                      style={{
                        fontFamily: Typography.fonts.regular,
                        fontSize: 13,
                        color: "#64748B",
                        flex: 1,
                      }}
                    >
                      Waiting for your provider to share location. Distance and
                      arrival time appear after the first ping.
                    </Text>
                  </View>
                )}
              </Card>
            </>
          )}

          <SectionLabel>PROVIDER</SectionLabel>
          {tracking?.provider ? (
            <Card>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: "#EFF6FF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <User size={24} color="#1E3A8A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: Typography.fonts.bold,
                      fontSize: 16,
                      color: "#0F172A",
                    }}
                  >
                    {tracking.provider.first_name} {tracking.provider.last_name}
                  </Text>
                  {!!tracking.provider.business_name && (
                    <Text
                      style={{
                        fontFamily: Typography.fonts.regular,
                        fontSize: 13,
                        color: "#64748B",
                        marginTop: 2,
                      }}
                    >
                      {tracking.provider.business_name}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 4,
                    }}
                  >
                    <Star size={13} color="#F59E0B" fill="#F59E0B" />
                    <Text
                      style={{
                        fontFamily: Typography.fonts.semibold,
                        fontSize: 13,
                        color: "#0F172A",
                      }}
                    >
                      {typeof tracking.provider.rating === "number"
                        ? tracking.provider.rating.toFixed(1)
                        : "—"}{" "}
                      ({tracking.provider.total_reviews} reviews)
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          ) : (
            <Card>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <ActivityIndicator size="small" color="#1E3A8A" />
                <Text
                  style={{
                    fontFamily: Typography.fonts.regular,
                    fontSize: 13,
                    color: "#64748B",
                    flex: 1,
                  }}
                >
                  Finding the best provider for your request…
                </Text>
              </View>
            </Card>
          )}

          <SectionLabel>TIMELINE</SectionLabel>
          <Card>
            <TimelineRow label="Provider assigned" value={tracking?.assigned_at} />
            <TimelineRow label="Confirmed" value={tracking?.confirmed_at} />
            <TimelineRow label="Started" value={tracking?.started_at} />
            <TimelineRow label="Completed" value={tracking?.completed_at} />
            <TimelineRow label="Cancelled" value={tracking?.cancelled_at} />
          </Card>

          {isTerminal && (
            <View
              style={{
                backgroundColor:
                  tracking?.status === "completed" ? "#ECFDF5" : "#FEF2F2",
                borderRadius: 16,
                padding: 16,
                marginTop: 8,
                borderWidth: 1,
                borderColor:
                  tracking?.status === "completed" ? "#A7F3D0" : "#FECACA",
              }}
            >
              <Text
                style={{
                  fontFamily: Typography.fonts.semibold,
                  fontSize: 14,
                  textAlign: "center",
                  color:
                    tracking?.status === "completed" ? "#065F46" : "#991B1B",
                  lineHeight: 22,
                }}
              >
                {tracking?.status === "completed" && "Job completed successfully."}
                {tracking?.status === "cancelled" &&
                  `Cancelled${tracking.cancellation_reason ? ` — ${tracking.cancellation_reason}` : ""}.`}
                {tracking?.status === "declined" &&
                  `Declined${tracking.decline_reason ? ` — ${tracking.decline_reason}` : ""}.`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.88}
            style={{ marginTop: 24, borderRadius: 18, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#1E3A8A", "#1E40AF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                alignItems: "center",
                borderRadius: 18,
              }}
            >
              <Text
                style={{
                  fontFamily: Typography.fonts.bold,
                  fontSize: 15,
                  color: "#fff",
                }}
              >
                Back to booking
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function TimelineRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  const formatted = new Date(value).toLocaleString("en-EG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: "#1E3A8A",
          marginRight: 10,
        }}
      />
      <Text
        style={{
          fontFamily: Typography.fonts.semibold,
          fontSize: 13,
          color: "#0F172A",
          flex: 1,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: Typography.fonts.regular,
          fontSize: 12,
          color: "#94A3B8",
        }}
      >
        {formatted}
      </Text>
    </View>
  );
}
