import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Platform, useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  MapPin, Bell, Search, Star, ChevronRight,
  Clock, TrendingUp, CheckCircle, Calendar,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingstore";
import { PROVIDERS, type Provider } from "@/data/providers";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";

/* ─── Responsive ─────────────────────────────────────────────────────────── */
function useR() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 480 && width < 1024;
  const isWeb    = width >= 1024;
  return {
    width, isWeb, isTablet,
    isPhone:      width < 480,
    px:           isWeb ? 40 : isTablet ? 28 : 20,
    gap:          isWeb ? 16 : 10,
    maxW:         isWeb ? 1100 : (9999 as number),
    catCols:      isWeb ? 10 : isTablet ? 8 : 5,
    promoHScroll: !isWeb,
    providerCols: isWeb || isTablet ? 2 : 1,
    iconSize:     isWeb ? 28 : isTablet ? 26 : 22,
    cardPad:      isWeb ? 20 : 16,
    fs:           (n: number) => (isWeb ? n * 1.05 : n),
  };
}

/* ─── Static Data ─────────────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: "plumbing",   label: "Plumbing",     emoji: "🔧", color: "#3B82F6", bg: "#EFF6FF" },
  { id: "electrical", label: "Electrical",   emoji: "⚡", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "ac",         label: "AC Repair",    emoji: "❄️", color: "#06B6D4", bg: "#ECFEFF" },
  { id: "cleaning",   label: "Cleaning",     emoji: "🧹", color: "#10B981", bg: "#ECFDF5" },
  { id: "carpentry",  label: "Carpentry",    emoji: "🪚", color: "#8B5CF6", bg: "#F5F3FF" },
  { id: "painting",   label: "Painting",     emoji: "🎨", color: "#EC4899", bg: "#FDF2F8" },
  { id: "pest",       label: "Pest Control", emoji: "🐛", color: "#EF4444", bg: "#FEF2F2" },
  { id: "appliance",  label: "Appliances",   emoji: "🔌", color: "#6366F1", bg: "#EEF2FF" },
  { id: "gas",        label: "Gas & Pipes",  emoji: "🔥", color: "#F97316", bg: "#FFF7ED" },
  { id: "locksmith",  label: "Locksmith",    emoji: "🔑", color: "#14B8A6", bg: "#F0FDFA" },
];

const PROMOS = [
  { id: "1", title: "First Booking Free",  subtitle: "Get your first AC service at no cost", code: "SNAPFIX1", gradient: ["#1E3A8A", "#3B82F6"] as [string, string], emoji: "❄️" },
  { id: "2", title: "20% Off Plumbing",    subtitle: "Valid until end of month",              code: "PIPE20",   gradient: ["#065F46", "#10B981"] as [string, string], emoji: "🔧" },
  { id: "3", title: "Premium Cleaning",    subtitle: "Book 2 sessions, get 1 free",           code: "CLEAN3",   gradient: ["#7C3AED", "#C084FC"] as [string, string], emoji: "✨" },
];

const STATS = [
  { label: "Bookings",  value: "0",   icon: CheckCircle, color: "#10B981" },
  { label: "Saved EGP", value: "0",   icon: TrendingUp,  color: "#3B82F6" },
  { label: "Avg. Wait", value: "12m", icon: Clock,       color: "#F59E0B" },
];

type Category = typeof CATEGORIES[0];

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════════ */
export default function CustomerHomeScreen() {
  const [search, setSearch] = useState("");
  const r          = useR();
  const user       = useAuthStore((s) => s.user);
  const setService = useBookingStore((s) => s.setService);
  const setExpert  = useBookingStore((s) => s.setExpert);

  const firstName = user?.first_name ?? "there";
  const h         = new Date().getHours();
  const greeting  = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

  const centerWrap: any = r.isWeb
    ? { maxWidth: r.maxW, width: "100%", alignSelf: "center", paddingHorizontal: r.px }
    : { paddingHorizontal: r.px };

  const catSize      = r.isWeb ? 68 : r.isTablet ? 60 : 52;
  const promoScrollW = r.isTablet ? r.width * 0.55 : r.width * 0.72;
  const provW: any   = r.providerCols === 2
    ? Platform.OS === "web"
      ? `calc(50% - ${r.gap / 2}px)`
      : (r.width - r.px * 2 - r.gap) / 2
    : "100%";

  /* ── Navigate to Bookings ── */
  const handleViewBookings = () => {
    router.push("/(customer)/booking/booking");
  };

  /* ── 1. Category → select-expert filtered by serviceId ── */
  const handleCategoryPress = (cat: Category) => {
    setService(cat.id, cat.label, cat.emoji);
    router.push({
      pathname: "/(customer)/booking/select-expert",
      params:   { filterServiceId: cat.id },
    });
  };

  /* ── 2. "View all" / "See all" → all experts ── */
  const handleViewAll = () => {
    router.push({
      pathname: "/(customer)/booking/select-expert",
      params:   { filterServiceId: "all" },
    });
  };

  /* ── 3. "Book" on provider → skip expert step, go straight to schedule ── */
  const handleProviderBook = (prov: Provider) => {
    const cat = CATEGORIES.find((c) => c.id === prov.serviceId) ?? CATEGORIES[0];
    setService(cat.id, cat.label, cat.emoji);
    setExpert({
      id:          prov.id,
      name:        prov.name,
      avatar:      prov.avatar,
      avatarColor: prov.avatarColor,
      profession:  prov.profession,
      rating:      prov.rating,
      jobs:        prov.jobs,
      price:       prov.price,
      badge:       prov.badge,
      about:       prov.about,
    });
    router.push("/(customer)/booking/schedule");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ══ HERO ══ */}
        <LinearGradient
          colors={["#1E3A8A", "#2563EB", "#3B82F6"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            paddingTop:              Platform.OS === "web" ? 28 : 52,
            paddingBottom:           36,
            borderBottomLeftRadius:  r.isWeb ? 0 : 32,
            borderBottomRightRadius: r.isWeb ? 0 : 32,
            overflow: "hidden",
          }}
        >
          <View style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.05)" }} />
          <View style={{ position: "absolute", bottom: -20, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(6,182,212,0.12)" }} />

          <View style={centerWrap}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500 }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(11), color: "rgba(255,255,255,0.6)", marginBottom: 2, letterSpacing: 0.8 }}>YOUR LOCATION</Text>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MapPin size={14} color="#06B6D4" fill="#06B6D4" />
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: r.fs(14), color: "#fff" }}>Cairo, Egypt</Text>
                  <ChevronRight size={13} color="rgba(255,255,255,0.55)" />
                </TouchableOpacity>
              </MotiView>

              <View style={{ flexDirection: "row", gap: 10 }}>
                {/* My Bookings Button */}
                <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 100, type: "spring", damping: 14 }}>
                  <TouchableOpacity 
                    onPress={handleViewBookings}
                    style={{ 
                      width: 42, 
                      height: 42, 
                      borderRadius: 14, 
                      backgroundColor: "rgba(255,255,255,0.15)", 
                      alignItems: "center", 
                      justifyContent: "center" 
                    }}>
                    <Calendar size={20} color="#fff" />
                  </TouchableOpacity>
                </MotiView>

                {/* Notification Bell */}
                <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 100, type: "spring", damping: 14 }}>
                  <TouchableOpacity style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <Bell size={20} color="#fff" />
                    <View style={{ position: "absolute", top: 9, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: "#06B6D4", borderWidth: 1.5, borderColor: "#1E3A8A" }} />
                  </TouchableOpacity>
                </MotiView>
              </View>
            </View>

            <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 150, type: "timing", duration: 500 }} style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(14), color: "rgba(255,255,255,0.65)", marginBottom: 2 }}>{greeting}, 👋</Text>
              <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: r.fs(r.isWeb ? 30 : 26), color: "#fff", lineHeight: r.isWeb ? 38 : 32 }}>{firstName}!</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(13), color: "rgba(255,255,255,0.55)", marginTop: 4 }}>What do you need fixed today?</Text>
            </MotiView>

            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 250, type: "timing", duration: 500 }}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 13, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 8, gap: 10 }}>
                <Search size={18} color="#94A3B8" />
                <TextInput
                  value={search} onChangeText={setSearch}
                  placeholder="Search plumber, electrician..."
                  placeholderTextColor="#CBD5E1"
                  style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: r.fs(14), color: Colors.text.primary, padding: 0 }}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#E2E8F0", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 10, color: "#64748B" }}>✕</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </MotiView>
          </View>
        </LinearGradient>

        {/* ══ BODY ══ */}
        <View style={centerWrap}>

          {/* STATS */}
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 300, type: "timing", duration: 500 }}
            style={{ flexDirection: "row", marginTop: 20, marginBottom: 8, gap: r.gap }}>
            {STATS.map((s) => (
              <View key={s.label} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: r.cardPad, alignItems: "center", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: "#F1F5F9" }}>
                <s.icon size={r.isWeb ? 22 : 18} color={s.color} style={{ marginBottom: 6 }} />
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(16), color: Colors.text.primary }}>{s.value}</Text>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(10), color: Colors.text.secondary, marginTop: 1 }}>{s.label}</Text>
              </View>
            ))}
          </MotiView>

          {/* SERVICES */}
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Services" linkLabel="See all" onLink={handleViewAll} fs={r.fs} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: r.isWeb ? 8 : 0 }}>
              {CATEGORIES.map((cat, i) => {
                const itemW: any = r.isWeb
                  ? `${100 / r.catCols - 0.5}%`
                  : (r.width - r.px * 2 - 24) / 5;
                return (
                  <MotiView key={cat.id} from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 35, type: "spring", damping: 14 }}
                    style={{ width: itemW, alignItems: "center", marginBottom: r.isWeb ? 12 : 16 }}>
                    <TouchableOpacity activeOpacity={0.82} style={{ alignItems: "center" }} onPress={() => handleCategoryPress(cat)}>
                      <View style={{ width: catSize, height: catSize, borderRadius: r.isWeb ? 22 : 18, backgroundColor: cat.bg, alignItems: "center", justifyContent: "center", marginBottom: 6, shadowColor: cat.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 }}>
                        <Text style={{ fontSize: r.iconSize }}>{cat.emoji}</Text>
                      </View>
                      <Text style={{ fontFamily: Typography.fonts.medium, fontSize: r.fs(10), color: Colors.text.secondary, textAlign: "center", lineHeight: 13 }} numberOfLines={2}>{cat.label}</Text>
                    </TouchableOpacity>
                  </MotiView>
                );
              })}
            </View>
          </View>

          {/* PROMOS */}
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(18), color: Colors.text.primary }}>Offers & Deals</Text>
              <View style={{ backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#D97706" }}>{PROMOS.length} active</Text>
              </View>
            </View>
            {r.isWeb ? (
              <View style={{ flexDirection: "row", gap: 16 }}>
                {PROMOS.map((p) => <PromoCard key={p.id} item={p} flex />)}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 8 }}>
                {PROMOS.map((p) => <PromoCard key={p.id} item={p} width={promoScrollW} />)}
              </ScrollView>
            )}
          </View>

          {/* TOP PROVIDERS */}
          <View style={{ marginTop: 28 }}>
            <SectionHeader title="Top Providers" linkLabel="View all" onLink={handleViewAll} fs={r.fs} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: r.gap }}>
              {PROVIDERS.slice(0, 6).map((prov: Provider, i: number) => (
                <View key={prov.id} style={{ width: provW }}>
                  <ProviderCard item={prov} index={i} cardPad={r.cardPad} fs={r.fs} onBook={() => handleProviderBook(prov)} />
                </View>
              ))}
            </View>
          </View>

          {/* EMERGENCY */}
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 600, type: "timing", duration: 500 }} style={{ marginTop: 24, marginBottom: 8 }}>
            <LinearGradient colors={["#EF4444", "#DC2626"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 20, padding: r.isWeb ? 28 : 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", overflow: "hidden" }}>
              <View style={{ position: "absolute", right: -10, top: -10, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.07)" }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(16), color: "#fff", marginBottom: 2 }}>🚨 Emergency Service</Text>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(12), color: "rgba(255,255,255,0.8)" }}>Available 24/7 · Arrives in 30 min</Text>
              </View>
              <TouchableOpacity style={{ backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 }}>
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(13), color: "#EF4444" }}>Call Now</Text>
              </TouchableOpacity>
            </LinearGradient>
          </MotiView>

        </View>
      </ScrollView>
    </View>
  );
}

/* ─── Section Header ──────────────────────────────────────────────────────── */
function SectionHeader({ title, linkLabel, onLink, fs }: {
  title: string; linkLabel: string; onLink: () => void; fs: (n: number) => number;
}) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <Text style={{ fontFamily: Typography.fonts.bold, fontSize: fs(18), color: Colors.text.primary }}>{title}</Text>
      <TouchableOpacity onPress={onLink} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontFamily: Typography.fonts.medium, fontSize: fs(13), color: "#3B82F6" }}>{linkLabel}</Text>
        <ChevronRight size={14} color="#3B82F6" />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Promo Card ──────────────────────────────────────────────────────────── */
function PromoCard({ item, width, flex }: { item: typeof PROMOS[0]; width?: number; flex?: boolean }) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={{ marginRight: flex ? 0 : 16, flex: flex ? 1 : undefined }}>
      <LinearGradient colors={item.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: flex ? "100%" : width, height: flex ? 160 : 140, borderRadius: 24, padding: 20, justifyContent: "space-between", overflow: "hidden" }}>
        <View style={{ position: "absolute", right: -20, top: -20, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.07)" }} />
        <View>
          <Text style={{ fontSize: 28, marginBottom: 4 }}>{item.emoji}</Text>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#fff", marginBottom: 2 }}>{item.title}</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{item.subtitle}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 12, color: "#fff", letterSpacing: 1 }}>{item.code}</Text>
          </View>
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Use code →</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

/* ─── Provider Card ───────────────────────────────────────────────────────── */
function ProviderCard({ item, index, cardPad, fs, onBook }: {
  item: Provider; index: number; cardPad: number; fs: (n: number) => number; onBook: () => void;
}) {
  return (
    <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: index * 80, type: "timing", duration: 400 }}>
      <TouchableOpacity activeOpacity={0.88}
        style={{ backgroundColor: "#fff", borderRadius: 20, padding: cardPad, marginBottom: 12, flexDirection: "row", alignItems: "center", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: "#F1F5F9" }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: item.avatarColor + "22", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: fs(16), color: item.avatarColor }}>{item.avatar}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2, flexWrap: "wrap", gap: 6 }}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: fs(15), color: Colors.text.primary }}>{item.name}</Text>
            <View style={{ backgroundColor: "#EFF6FF", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 }}>
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 10, color: "#3B82F6" }}>{item.badge}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: fs(13), color: Colors.text.secondary, marginBottom: 6 }}>
            {item.profession} · {item.jobs} jobs
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: fs(12), color: "#F59E0B", marginLeft: 3, marginRight: 8 }}>{item.rating}</Text>
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize: fs(12), color: Colors.text.secondary }}>{item.priceLabel}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onBook} style={{ backgroundColor: "#1E3A8A", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: fs(12), color: "#fff" }}>Book</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </MotiView>
  );
}