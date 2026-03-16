import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  Alert, RefreshControl,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, Calendar, Clock, MapPin, Tag,
  FileText, DollarSign, AlertCircle, CheckCircle,
  XCircle, Zap, RefreshCw, Info,
} from "lucide-react-native";
import { useAuthStore }   from "@/store/authStore";
import { Typography }     from "@/theme/typography";
import {
  getBookingById, cancelBooking,
  type ServiceRequest, type BookingStatus,
} from "@/services/bookingService";

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS: Record<BookingStatus, { label: string; color: string; bg: string; icon: any; desc: string }> = {
  pending:     { label: "Pending",     color: "#F59E0B", bg: "#FFFBEB", icon: Clock,        desc: "Waiting for a provider to be assigned." },
  assigned:    { label: "Assigned",    color: "#3B82F6", bg: "#EFF6FF", icon: Info,         desc: "A provider has been assigned. Awaiting confirmation." },
  confirmed:   { label: "Confirmed",   color: "#8B5CF6", bg: "#F5F3FF", icon: CheckCircle,  desc: "Provider confirmed — job is scheduled." },
  in_progress: { label: "In Progress", color: "#06B6D4", bg: "#ECFEFF", icon: Zap,          desc: "Your provider is currently working on-site." },
  completed:   { label: "Completed",   color: "#10B981", bg: "#ECFDF5", icon: CheckCircle,  desc: "Job finished successfully." },
  cancelled:   { label: "Cancelled",   color: "#EF4444", bg: "#FEF2F2", icon: XCircle,      desc: "This booking was cancelled." },
  declined:    { label: "Declined",    color: "#94A3B8", bg: "#F8FAFC", icon: AlertCircle,  desc: "Provider declined. Request returned to pool." },
};

const canCancel: BookingStatus[] = ["pending", "assigned", "confirmed", "in_progress"];

function DetailRow({ icon: Icon, label, value, color = "#1E3A8A", last = false }: {
  icon: any; label: string; value: string; color?: string; last?: boolean;
}) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: "#F1F5F9" }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: color + "15", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        <Icon size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#0F172A", lineHeight: 20 }}>{value}</Text>
      </View>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginBottom: 10, marginTop: 22 }}>{label}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      {children}
    </View>
  );
}

/* ─── Timeline ───────────────────────────────────────────────────── */
function Timeline({ booking }: { booking: ServiceRequest }) {
  const steps = [
    { key: "created_at",   label: "Request Created"  },
    { key: "assigned_at",  label: "Provider Assigned" },
    { key: "confirmed_at", label: "Job Confirmed"     },
    { key: "started_at",   label: "Work Started"      },
    { key: "completed_at", label: "Job Completed"     },
    { key: "cancelled_at", label: "Cancelled"         },
    { key: "declined_at",  label: "Declined"          },
  ] as { key: keyof ServiceRequest; label: string }[];

  const filled = steps.filter((s) => booking[s.key]);

  return (
    <View>
      {filled.map((step, i) => (
        <View key={step.key} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: i < filled.length - 1 ? 0 : 0 }}>
          <View style={{ alignItems: "center", width: 28 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i === filled.length - 1 ? "#1E3A8A" : "#06B6D4", marginTop: 4 }} />
            {i < filled.length - 1 && <View style={{ width: 2, height: 32, backgroundColor: "#E2E8F0" }} />}
          </View>
          <View style={{ flex: 1, paddingBottom: 20 }}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#0F172A" }}>{step.label}</Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
              {new Date(booking[step.key] as string).toLocaleString("en-EG")}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════════════════════════ */
export default function BookingDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const token    = useAuthStore((s) => s.token);

  const [booking,    setBooking]    = useState<ServiceRequest | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchBooking = async (isRefresh = false) => {
    if (!token || !id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await getBookingById(id, token);
      setBooking(data);
    } catch (err: any) {
      setError(err?.data?.detail ?? err?.message ?? "Failed to load booking.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBooking(); }, [id, token]);

  const handleCancel = () => {
    if (!token || !id) { Alert.alert("Error", "Not authenticated."); return; }

    Alert.alert(
      "Cancel Booking",
      `Cancel "${booking?.title}"?\nThis cannot be undone.`,
      [
        { text: "Keep It", style: "cancel" },
        {
          text: "Yes, Cancel", style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              const updated = await cancelBooking(id, token, "Cancelled by customer");
              setBooking(updated);
              Alert.alert("✓ Cancelled", "Your booking has been cancelled.");
            } catch (err: any) {
              console.log("[DetailCancel] error:", JSON.stringify(err?.data ?? err));
              const data = err?.data ?? {};
              const msg  =
                data?.detail ??
                data?.non_field_errors?.[0] ??
                err?.message ??
                `Failed (status ${err?.status ?? "unknown"})`;
              Alert.alert("Cannot Cancel", msg);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#94A3B8", marginTop: 12 }}>Loading…</Text>
      </View>
    );
  }

  if (error || !booking) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#0F172A", marginBottom: 8 }}>Not Found</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 24 }}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1E3A8A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}>
          <ArrowLeft size={16} color="#fff" />
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#fff" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const s = STATUS[booking.status] ?? STATUS.pending;
  const StatusIcon = s.icon;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBooking(true)} tintColor="#1E3A8A" colors={["#1E3A8A"]} />}
      >
        {/* ── Header ── */}
        <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 32, paddingHorizontal: 20, overflow: "hidden" }}
        >
          <View style={{ position: "absolute", top: -30, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(6,182,212,0.08)" }} />

          <TouchableOpacity onPress={() => router.back()}
            style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          <View >
            {/* Status badge */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, alignSelf: "flex-start", marginBottom: 14 }}>
              <StatusIcon size={14} color={s.color} />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#fff" }}>{s.label}</Text>
            </View>

            {booking.is_urgent && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <AlertCircle size={14} color="#FCA5A5" />
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#FCA5A5" }}>URGENT REQUEST</Text>
              </View>
            )}

            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 22, color: "#fff", marginBottom: 6, lineHeight: 30 }}>
              {booking.title}
            </Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
              {booking.category?.name} · {booking.region?.name}
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20 }}>

          {/* Status description */}
          <View >
            <View style={{ backgroundColor: s.bg, borderRadius: 16, padding: 14, marginTop: 16, marginBottom: 4, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <StatusIcon size={16} color={s.color} />
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: s.color, flex: 1 }}>{s.desc}</Text>
            </View>
          </View>

          {/* ── Service details ── */}
          <SectionLabel label="SERVICE DETAILS" />
          <View >
            <Card>
              <DetailRow icon={Tag}      label="Category"    value={booking.category?.name}  color="#8B5CF6" />
              <DetailRow icon={FileText} label="Description" value={booking.description}     color="#1E3A8A" />
              <DetailRow icon={DollarSign} label="Estimated Price"
                value={booking.estimated_price ? `${booking.estimated_price} EGP` : ""}  color="#F59E0B" />
              <DetailRow icon={DollarSign} label="Final Price"
                value={booking.final_price ? `${booking.final_price} EGP` : ""}          color="#10B981" last />
            </Card>
          </View>

          {/* ── Location & Schedule ── */}
          <SectionLabel label="LOCATION & SCHEDULE" />
          <View >
            <Card>
              <DetailRow icon={MapPin}   label="Region"  value={booking.region?.name}    color="#EF4444" />
              <DetailRow icon={MapPin}   label="Address" value={booking.address}         color="#EF4444" />
              <DetailRow icon={Calendar} label="Date"    value={booking.preferred_date}  color="#3B82F6" />
              <DetailRow icon={Clock}    label="Time"    value={booking.preferred_time?.slice(0, 5)} color="#3B82F6" last />
            </Card>
          </View>

          {/* ── Cancellation info ── */}
          {(booking.status === "cancelled" || booking.status === "declined") && (
            <>
              <SectionLabel label={booking.status === "cancelled" ? "CANCELLATION" : "DECLINE INFO"} />
              <View >
                <Card>
                  {booking.cancelled_by_display ? (
                    <DetailRow icon={Info} label="Cancelled By" value={booking.cancelled_by_display} color="#EF4444" />
                  ) : null}
                  {booking.cancellation_reason ? (
                    <DetailRow icon={FileText} label="Reason" value={booking.cancellation_reason} color="#EF4444" last />
                  ) : null}
                  {booking.decline_reason ? (
                    <DetailRow icon={FileText} label="Decline Reason" value={booking.decline_reason} color="#94A3B8" last />
                  ) : null}
                </Card>
              </View>
            </>
          )}

          {/* ── Timeline ── */}
          <SectionLabel label="TIMELINE" />
          <View >
            <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <Timeline booking={booking} />
            </View>
          </View>

          {/* ── Cancel button ── */}
          {canCancel.includes(booking.status) && (
            <View style={{ marginTop: 24 }}
            >
              <TouchableOpacity onPress={handleCancel} disabled={cancelling} activeOpacity={0.85}
                style={{ borderRadius: 18, overflow: "hidden", opacity: cancelling ? 0.7 : 1 }}
              >
                <View style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA", borderRadius: 18 }}>
                  {cancelling
                    ? <ActivityIndicator size="small" color="#EF4444" />
                    : <><XCircle size={18} color="#EF4444" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#EF4444" }}>Cancel Booking</Text></>
                  }
                </View>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}