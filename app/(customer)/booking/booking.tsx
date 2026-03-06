import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, useWindowDimensions, Alert,
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Star,
  MapPin, ChevronRight, Calendar, Zap, AlertCircle,
  RotateCcw, MessageCircle, Phone,
} from "lucide-react-native";

/* ─── Responsive ─────────────────────────────────────────────────────────── */
function useR() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 480 && width < 1024;
  const isWeb    = width >= 1024;
  return {
    width, isWeb, isTablet,
    px:    isWeb ? 40 : 20,
    gap:   isWeb ? 16 : 12,
    maxW:  isWeb ? 900 : 9999,
    cols2: isWeb || isTablet,
    fs:    (n: number) => (isWeb ? n * 1.05 : n),
  };
}

/* ─── Types ──────────────────────────────────────────────────────────────── */
type BookingStatus = "upcoming" | "in_progress" | "completed" | "cancelled";

interface Booking {
  id:             string;
  service:        string;
  emoji:          string;
  providerName:   string;
  providerAvatar: string;
  providerColor:  string;
  date:           string;
  time:           string;
  address:        string;
  price:          number;
  status:         BookingStatus;
  rating?:        number;
  cancelReason?:  string;
}

/* ─── Mock Data ──────────────────────────────────────────────────────────── */
const BOOKINGS: Booking[] = [
  {
    id: "B001", service: "AC Repair",   emoji: "❄️",
    providerName: "Karim Hassan",  providerAvatar: "KH", providerColor: "#06B6D4",
    date: "Today",        time: "3:00 PM",  address: "Dokki, Giza",
    price: 200, status: "in_progress",
  },
  {
    id: "B002", service: "Plumbing",    emoji: "🔧",
    providerName: "Mohamed Ali",   providerAvatar: "MA", providerColor: "#3B82F6",
    date: "Tomorrow",     time: "10:00 AM", address: "Maadi, Cairo",
    price: 150, status: "upcoming",
  },
  {
    id: "B003", service: "Electrical",  emoji: "⚡",
    providerName: "Ahmed Samy",    providerAvatar: "AS", providerColor: "#F59E0B",
    date: "28 Jun 2025",  time: "9:00 AM",  address: "Nasr City, Cairo",
    price: 320, status: "upcoming",
  },
  {
    id: "B004", service: "Cleaning",    emoji: "🧹",
    providerName: "Hana Mohamed",  providerAvatar: "HM", providerColor: "#10B981",
    date: "20 Jun 2025",  time: "11:00 AM", address: "Zamalek, Cairo",
    price: 250, status: "completed", rating: 5,
  },
  {
    id: "B005", service: "Plumbing",    emoji: "🔧",
    providerName: "Tarek Saad",    providerAvatar: "TS", providerColor: "#EF4444",
    date: "15 Jun 2025",  time: "2:00 PM",  address: "Heliopolis, Cairo",
    price: 180, status: "completed", rating: 4,
  },
  {
    id: "B006", service: "Painting",    emoji: "🎨",
    providerName: "Omar Farouk",   providerAvatar: "OF", providerColor: "#8B5CF6",
    date: "10 Jun 2025",  time: "8:00 AM",  address: "6th of October",
    price: 400, status: "cancelled", cancelReason: "Provider unavailable",
  },
  {
    id: "B007", service: "Carpentry",   emoji: "🪚",
    providerName: "Youssef Nour",  providerAvatar: "YN", providerColor: "#EC4899",
    date: "2 Jun 2025",   time: "1:00 PM",  address: "New Cairo",
    price: 300, status: "completed", rating: 5,
  },
];

/* ─── Status config ──────────────────────────────────────────────────────── */
const STATUS_CFG: Record<BookingStatus, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
  in_progress: { label: "In Progress", color: "#06B6D4", bg: "#ECFEFF",  icon: Zap          },
  upcoming:    { label: "Upcoming",    color: "#3B82F6", bg: "#EFF6FF",  icon: Clock        },
  completed:   { label: "Completed",  color: "#10B981", bg: "#ECFDF5",  icon: CheckCircle  },
  cancelled:   { label: "Cancelled",  color: "#EF4444", bg: "#FEF2F2",  icon: XCircle      },
};

const TABS = ["Active", "Past"] as const;
type Tab = typeof TABS[number];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function BookingsScreen() {
  const r = useR();
  const [activeTab,  setActiveTab]  = useState<Tab>("Active");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const centerWrap: any = r.isWeb
    ? { maxWidth: r.maxW, width: "100%", alignSelf: "center" }
    : {};

  const active = BOOKINGS.filter((b) => b.status === "upcoming" || b.status === "in_progress");
  const past   = BOOKINGS.filter((b) => b.status === "completed" || b.status === "cancelled");
  const shown  = activeTab === "Active" ? active : past;

  const handleCancel = (b: Booking) => {
    Alert.alert(
      "Cancel Booking",
      `Cancel your ${b.service} booking with ${b.providerName}?`,
      [
        { text: "Keep it",     style: "cancel"      },
        { text: "Yes, cancel", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const handleRebook = (b: Booking) => {
    router.push({
      pathname: "/(customer)/booking/select-expert",
      params:   { filterServiceId: b.service.toLowerCase().replace(/\s/g, "") },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* ══ HEADER ══ */}
      <LinearGradient
        colors={["#1E3A8A", "#2563EB"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          paddingTop:              Platform.OS === "web" ? 24 : 52,
          paddingBottom:           24,
          paddingHorizontal:       r.px,
          borderBottomLeftRadius:  r.isWeb ? 0 : 28,
          borderBottomRightRadius: r.isWeb ? 0 : 28,
          overflow: "hidden",
        }}
      >
        <View style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.05)" }} />

        <View style={centerWrap}>
          {/* Back + title */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <TouchableOpacity onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Poppins_800ExtraBold", fontSize: r.fs(22), color: "#fff" }}>My Bookings</Text>
              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "rgba(255,255,255,0.6)" }}>
                {active.length} active · {past.length} past
              </Text>
            </View>
          </View>

          {/* Summary pills */}
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {(
              [
                { label: "In Progress", count: BOOKINGS.filter(b => b.status === "in_progress").length, dot: "#06B6D4" },
                { label: "Upcoming",    count: BOOKINGS.filter(b => b.status === "upcoming").length,    dot: "#fff"    },
                { label: "Completed",   count: BOOKINGS.filter(b => b.status === "completed").length,   dot: "#10B981" },
              ] as { label: string; count: number; dot: string }[]
            ).map((pill) => (
              <View key={pill.label} style={{ backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 5 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: pill.dot }} />
                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(11), color: "#fff" }}>
                  {pill.count} {pill.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* ══ TABS ══ */}
      <View style={{ backgroundColor: "#fff", paddingHorizontal: r.px, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
        <View style={[{ flexDirection: "row" }, centerWrap]}>
          {TABS.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
              style={{ flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 2.5, borderBottomColor: activeTab === tab ? "#1E3A8A" : "transparent" }}>
              <Text style={{
                fontFamily: activeTab === tab ? "Poppins_700Bold" : "Poppins_400Regular",
                fontSize:   r.fs(14),
                color:      activeTab === tab ? "#1E3A8A" : "#94A3B8",
              }}>
                {tab}{" "}
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: activeTab === tab ? "#3B82F6" : "#CBD5E1" }}>
                  ({tab === "Active" ? active.length : past.length})
                </Text>
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ══ LIST ══ */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}>
        <View style={[{ paddingHorizontal: r.px }, centerWrap]}>

          {/* Empty state */}
          {shown.length === 0 && (
            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 400 }}>
              <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Text style={{ fontSize: 56, marginBottom: 16 }}>{activeTab === "Active" ? "📅" : "🗂️"}</Text>
                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: r.fs(18), color: "#0F172A", marginBottom: 8 }}>
                  {activeTab === "Active" ? "No active bookings" : "No past bookings"}
                </Text>
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(13), color: "#94A3B8", textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
                  {activeTab === "Active"
                    ? "Book a service from the home screen to get started."
                    : "Your completed and cancelled bookings will appear here."}
                </Text>
                {activeTab === "Active" && (
                  <TouchableOpacity onPress={() => router.push("/(customer)/home")}
                    style={{ backgroundColor: "#1E3A8A", paddingHorizontal: 28, paddingVertical: 13, borderRadius: 16 }}>
                    <Text style={{ fontFamily: "Poppins_700Bold", fontSize: r.fs(14), color: "#fff" }}>Browse Services</Text>
                  </TouchableOpacity>
                )}
              </View>
            </MotiView>
          )}

          {/* Cards */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: r.gap }}>
            {shown.map((booking, i) => {
              const cfg        = STATUS_CFG[booking.status];
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === booking.id;
              const cardW: any = r.cols2
                ? Platform.OS === "web"
                  ? `calc(50% - ${r.gap / 2}px)`
                  : (r.width - r.px * 2 - r.gap) / 2
                : "100%";

              return (
                <MotiView key={booking.id}
                  from={{ opacity: 0, translateY: 24 }} animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: i * 70, type: "timing", duration: 400 }}
                  style={{ width: r.isTablet || r.isWeb ? cardW : "100%" }}
                >
                  <TouchableOpacity
                    onPress={() => setExpandedId(isExpanded ? null : booking.id)}
                    activeOpacity={0.92}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius:    22,
                      marginBottom:    0,
                      shadowColor:     "#1E3A8A",
                      shadowOffset:    { width: 0, height: 3 },
                      shadowOpacity:   0.07,
                      shadowRadius:    14,
                      elevation:       4,
                      borderWidth:     1.5,
                      borderColor:     booking.status === "in_progress" ? "#A5F3FC" : "#F1F5F9",
                      overflow:        "hidden",
                    }}
                  >
                    {/* In-progress accent bar */}
                    {booking.status === "in_progress" && (
                      <LinearGradient colors={["#06B6D4", "#0891B2"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 4 }} />
                    )}

                    <View style={{ padding: 16 }}>

                      {/* Service + ID + status */}
                      <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                          <Text style={{ fontSize: 24 }}>{booking.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: r.fs(15), color: "#0F172A", marginBottom: 2 }}>{booking.service}</Text>
                          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#CBD5E1" }}>#{booking.id}</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: cfg.bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 }}>
                          <StatusIcon size={11} color={cfg.color} />
                          <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 10, color: cfg.color }}>{cfg.label}</Text>
                        </View>
                      </View>

                      {/* Provider mini-card */}
                      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 14, padding: 10, marginBottom: 10 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: booking.providerColor + "22", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 12, color: booking.providerColor }}>{booking.providerAvatar}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(13), color: "#0F172A" }}>{booking.providerName}</Text>
                          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(11), color: "#94A3B8" }}>Service Provider</Text>
                        </View>
                        {booking.status === "completed" && booking.rating && (
                          <View style={{ flexDirection: "row", gap: 2 }}>
                            {Array.from({ length: booking.rating }).map((_, si) => (
                              <Star key={si} size={12} color="#F59E0B" fill="#F59E0B" />
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Date / location */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 6 }}>
                        <Calendar size={13} color="#94A3B8" />
                        <Text style={{ fontFamily: "Poppins_500Medium", fontSize: r.fs(12), color: "#64748B" }}>
                          {booking.date} · {booking.time}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 14 }}>
                        <MapPin size={13} color="#94A3B8" />
                        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#94A3B8" }}>{booking.address}</Text>
                      </View>

                      {/* Price + expand toggle */}
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View>
                          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(11), color: "#94A3B8" }}>Total</Text>
                          <Text style={{ fontFamily: "Poppins_800ExtraBold", fontSize: r.fs(18), color: "#1E3A8A" }}>
                            {booking.price} <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#94A3B8" }}>EGP</Text>
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text style={{ fontFamily: "Poppins_500Medium", fontSize: r.fs(12), color: "#3B82F6" }}>
                            {isExpanded ? "Less" : "Details"}
                          </Text>
                          <ChevronRight size={14} color="#3B82F6"
                            style={{ transform: [{ rotate: isExpanded ? "90deg" : "0deg" }] }} />
                        </View>
                      </View>

                      {/* ── EXPANDED ACTIONS ── */}
                      {isExpanded && (
                        <MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }}
                          transition={{ type: "timing", duration: 250 }}
                          style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>

                          {/* Cancel reason */}
                          {booking.status === "cancelled" && booking.cancelReason && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 12, padding: 10, marginBottom: 12 }}>
                              <AlertCircle size={14} color="#EF4444" />
                              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#EF4444", flex: 1 }}>{booking.cancelReason}</Text>
                            </View>
                          )}

                          {/* in_progress */}
                          {booking.status === "in_progress" && (
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#F8FAFC", borderRadius: 14, paddingVertical: 11, borderWidth: 1, borderColor: "#E2E8F0" }}>
                                <Phone size={13} color="#64748B" />
                                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(12), color: "#64748B" }}>Call</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#F8FAFC", borderRadius: 14, paddingVertical: 11, borderWidth: 1, borderColor: "#E2E8F0" }}>
                                <MessageCircle size={13} color="#64748B" />
                                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(12), color: "#64748B" }}>Chat</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={{ flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#06B6D4", borderRadius: 14, paddingVertical: 11 }}>
                                <Zap size={13} color="#fff" fill="#fff" />
                                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: r.fs(12), color: "#fff" }}>Track Live</Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* upcoming */}
                          {booking.status === "upcoming" && (
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              <TouchableOpacity onPress={() => handleCancel(booking)}
                                style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2", borderRadius: 14, paddingVertical: 11, borderWidth: 1, borderColor: "#FEE2E2" }}>
                                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(12), color: "#EF4444" }}>Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#F8FAFC", borderRadius: 14, paddingVertical: 11, borderWidth: 1, borderColor: "#E2E8F0" }}>
                                <MessageCircle size={13} color="#64748B" />
                                <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(12), color: "#64748B" }}>Chat</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={{ flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#1E3A8A", borderRadius: 14, paddingVertical: 11 }}>
                                <Calendar size={13} color="#06B6D4" />
                                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: r.fs(12), color: "#fff" }}>Reschedule</Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* completed */}
                          {booking.status === "completed" && (
                            <View style={{ flexDirection: "row", gap: 8 }}>
                              {!booking.rating && (
                                <TouchableOpacity style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#FFFBEB", borderRadius: 14, paddingVertical: 11, borderWidth: 1, borderColor: "#FEF3C7" }}>
                                  <Star size={13} color="#F59E0B" fill="#F59E0B" />
                                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(12), color: "#D97706" }}>Rate</Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity onPress={() => handleRebook(booking)}
                                style={{ flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#1E3A8A", borderRadius: 14, paddingVertical: 11 }}>
                                <RotateCcw size={13} color="#06B6D4" />
                                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: r.fs(12), color: "#fff" }}>Book Again</Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* cancelled */}
                          {booking.status === "cancelled" && (
                            <TouchableOpacity onPress={() => handleRebook(booking)}
                              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1E3A8A", borderRadius: 14, paddingVertical: 12 }}>
                              <RotateCcw size={13} color="#06B6D4" />
                              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: r.fs(13), color: "#fff" }}>Book Again</Text>
                            </TouchableOpacity>
                          )}
                        </MotiView>
                      )}
                    </View>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}