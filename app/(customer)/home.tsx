import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Platform, useWindowDimensions,
  Modal, Animated, Pressable, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  MapPin, Bell, Search, Star, ChevronRight,
  Clock, TrendingUp, CheckCircle, Calendar,
  Menu, X, Home, BookOpen, User, Settings,
  HelpCircle, LogOut, Shield, Gift, MessageCircle,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingstore";
import { PROVIDERS, type Provider } from "@/data/providers";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { getCategories, type Category as ApiCategory } from "@/services/coreService";

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

/* ─── Category colour palette (cycles if API returns more) ──────────────── */
const CAT_PALETTE = [
  { color: "#3B82F6", bg: "#EFF6FF" },
  { color: "#F59E0B", bg: "#FFFBEB" },
  { color: "#06B6D4", bg: "#ECFEFF" },
  { color: "#10B981", bg: "#ECFDF5" },
  { color: "#8B5CF6", bg: "#F5F3FF" },
  { color: "#EC4899", bg: "#FDF2F8" },
  { color: "#EF4444", bg: "#FEF2F2" },
  { color: "#6366F1", bg: "#EEF2FF" },
  { color: "#F97316", bg: "#FFF7ED" },
  { color: "#14B8A6", bg: "#F0FDFA" },
];

/* Map an API category → the shape the UI needs */
function mapCategory(cat: ApiCategory, index: number) {
  const palette = CAT_PALETTE[index % CAT_PALETTE.length];
  return {
    id:    String(cat.id),
    slug:  cat.slug,
    label: cat.name,
    emoji: cat.icon,       // icon field from the API (emoji or identifier)
    color: palette.color,
    bg:    palette.bg,
  };
}

type MappedCategory = ReturnType<typeof mapCategory>;

/* ─── Static Data (non-category) ─────────────────────────────────────────── */
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

/* ─── Drawer Nav Items ───────────────────────────────────────────────────── */
const DRAWER_MAIN_ITEMS = [
  { id: "home",     label: "Home",           icon: Home,           route: "/(customer)/home",              color: "#3B82F6", active: true  },
  { id: "bookings", label: "My Bookings",    icon: BookOpen,       route: "/(customer)/booking/booking",   color: "#10B981", active: false },
  { id: "chat",     label: "Messages",       icon: MessageCircle,  route: "/(customer)/chat",              color: "#06B6D4", active: false },
  { id: "profile",  label: "Profile",        icon: User,           route: "/(customer)/profile",           color: "#8B5CF6", active: false },
  { id: "offers",   label: "Offers & Deals", icon: Gift,           route: "/(customer)/offers",            color: "#EC4899", active: false },
  { id: "settings", label: "Settings",       icon: Settings,       route: "/(customer)/settings",          color: "#F59E0B", active: false },
];

const DRAWER_BOTTOM_ITEMS = [
  { id: "help",   label: "Help & Support", icon: HelpCircle, route: "/(customer)/support", color: "#64748B" },
  { id: "safety", label: "Safety Center",  icon: Shield,     route: "/(customer)/safety",  color: "#64748B" },
];

/* ══════════════════════════════════════════════════════════════════════════
   NAVIGATION DRAWER
══════════════════════════════════════════════════════════════════════════ */
function NavigationDrawer({
  visible, onClose, user, activeRoute = "home",
}: {
  visible: boolean; onClose: () => void; user: any; activeRoute?: string;
}) {
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0,    useNativeDriver: true, damping: 20, stiffness: 200 }),
        Animated.timing(fadeAnim,  { toValue: 1,    duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -320, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim,  { toValue: 0,    duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleNav = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 250);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => router.replace("/(auth)/login" as any), 250);
  };

  const firstName = user?.first_name ?? "User";
  const lastName  = user?.last_name  ?? "";
  const email     = user?.email      ?? "user@example.com";
  const initials  = `${firstName[0] ?? "U"}${lastName[0] ?? ""}`.toUpperCase();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.55)", opacity: fadeAnim }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 300, backgroundColor: "#fff", transform: [{ translateX: slideAnim }], shadowColor: "#0F172A", shadowOffset: { width: 8, height: 0 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 16 }}>
          <LinearGradient colors={["#1E3A8A", "#2563EB", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ paddingTop: Platform.OS === "android" ? 52 : 60, paddingBottom: 28, paddingHorizontal: 20, overflow: "hidden" }}>
            <View style={{ position: "absolute", top: -30, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.07)" }} />
            <View style={{ position: "absolute", bottom: -20, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(6,182,212,0.15)" }} />
            <TouchableOpacity onPress={onClose} style={{ position: "absolute", top: Platform.OS === "android" ? 48 : 56, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
            <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.35)" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 22, color: "#fff" }}>{initials}</Text>
            </View>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#fff", marginBottom: 3 }}>{firstName} {lastName}</Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 12 }}>{email}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#fff" }}>⭐ 0 bookings</Text>
              </View>
              <View style={{ backgroundColor: "rgba(6,182,212,0.3)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#E0F7FA" }}>Member</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 10, color: "#94A3B8", letterSpacing: 1.2, marginLeft: 20, marginBottom: 8, marginTop: 8 }}>NAVIGATION</Text>
            {DRAWER_MAIN_ITEMS.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <TouchableOpacity key={item.id} onPress={() => handleNav(item.route)} activeOpacity={0.75}
                  style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginBottom: 4, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, backgroundColor: isActive ? item.color + "15" : "transparent" }}>
                  {isActive && <View style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: item.color }} />}
                  <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isActive ? item.color + "20" : "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                    <item.icon size={18} color={isActive ? item.color : "#64748B"} />
                  </View>
                  <Text style={{ fontFamily: isActive ? Typography.fonts.semibold : Typography.fonts.medium, fontSize: 15, color: isActive ? item.color : "#334155", flex: 1 }}>{item.label}</Text>
                  {isActive && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.color }} />}
                  {item.id === "bookings" && (
                    <View style={{ backgroundColor: "#3B82F6", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, marginRight: 6 }}>
                      <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 10, color: "#fff" }}>0</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <View style={{ height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 20, marginTop: 12, marginBottom: 16 }} />
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 10, color: "#94A3B8", letterSpacing: 1.2, marginLeft: 20, marginBottom: 8 }}>MORE</Text>
            {DRAWER_BOTTOM_ITEMS.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => handleNav(item.route)} activeOpacity={0.75}
                style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginBottom: 4, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <item.icon size={17} color="#94A3B8" />
                </View>
                <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 14, color: "#64748B" }}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 20, marginTop: 12, marginBottom: 16 }} />
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.75}
              style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 12, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "#FEF2F2" }}>
              <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                <LogOut size={17} color="#EF4444" />
              </View>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#EF4444" }}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "android" ? 20 : 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#CBD5E1", textAlign: "center" }}>SnapFix v1.0.0 · Cairo, Egypt 🇪🇬</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════ */
export default function CustomerHomeScreen() {
  const [search,      setSearch]      = useState("");
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  /* ── Categories API state ── */
  const [categories,     setCategories]     = useState<MappedCategory[]>([]);
  const [catsLoading,    setCatsLoading]    = useState(true);
  const [catsError,      setCatsError]      = useState<string | null>(null);

  const r          = useR();
  const user       = useAuthStore((s) => s.user);
  const setService = useBookingStore((s) => s.setService);
  const setExpert  = useBookingStore((s) => s.setExpert);

  /* ── Fetch categories on mount ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCatsLoading(true);
        setCatsError(null);
        const list = await getCategories();            // always Category[]
        if (!cancelled) setCategories(list.map(mapCategory));
      } catch (err: any) {
        if (!cancelled) setCatsError(err?.message ?? "Failed to load categories");
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  const handleViewBookings  = () => router.push("/(customer)/booking/booking");

  const handleCategoryPress = (cat: MappedCategory) => {
    setService(cat.slug, cat.label, cat.emoji);
    router.push({ pathname: "/(customer)/booking/select-expert", params: { filterServiceId: cat.slug } });
  };

  const handleViewAll = () =>
    router.push({ pathname: "/(customer)/booking/select-expert", params: { filterServiceId: "all" } });

  const handleProviderBook = (prov: Provider) => {
    const cat = categories.find((c) => c.slug === prov.serviceId) ?? categories[0];
    if (!cat) return;
    setService(cat.slug, cat.label, cat.emoji);
    setExpert({
      id: prov.id, name: prov.name, avatar: prov.avatar, avatarColor: prov.avatarColor,
      profession: prov.profession, rating: prov.rating, jobs: prov.jobs,
      price: prov.price, badge: prov.badge, about: prov.about,
    });
    router.push("/(customer)/booking/schedule");
  };

  /* ── Category section content (loading / error / list) ── */
  const renderCategories = () => {
    if (catsLoading) {
      return (
        <View style={{ alignItems: "center", paddingVertical: 32 }}>
          <ActivityIndicator size="large" color={Colors.primary.DEFAULT} />
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: Colors.text.secondary, marginTop: 10 }}>
            Loading services...
          </Text>
        </View>
      );
    }

    if (catsError) {
      return (
        <View style={{ alignItems: "center", paddingVertical: 28, gap: 10 }}>
          <Text style={{ fontSize: 32 }}>⚠️</Text>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 14, color: "#EF4444", textAlign: "center" }}>
            {catsError}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setCatsLoading(true);
              setCatsError(null);
              getCategories()
                .then((list) => setCategories(list.map(mapCategory)))
                .catch((e) => setCatsError(e?.message ?? "Failed to load categories"))
                .finally(() => setCatsLoading(false));
            }}
            style={{ backgroundColor: Colors.primary.DEFAULT, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 12 }}
          >
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (categories.length === 0) {
      return (
        <View style={{ alignItems: "center", paddingVertical: 28 }}>
          <Text style={{ fontSize: 32 }}>📭</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: Colors.text.secondary, marginTop: 8 }}>
            No services available yet.
          </Text>
        </View>
      );
    }

    return (
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: r.isWeb ? 8 : 0 }}>
        {categories.map((cat, i) => {
          const itemW: any = r.isWeb
            ? `${100 / r.catCols - 0.5}%`
            : (r.width - r.px * 2 - 24) / 5;
          return (
            <MotiView key={cat.id} from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 35, type: "spring", damping: 14 }}
              style={{ width: itemW, alignItems: "center", marginBottom: r.isWeb ? 12 : 16 }}>
              <TouchableOpacity activeOpacity={0.82} style={{ alignItems: "center" }} onPress={() => handleCategoryPress(cat)}>
                <View style={{ width: catSize, height: catSize, borderRadius: r.isWeb ? 22 : 18, backgroundColor: cat.bg, alignItems: "center", justifyContent: "center", marginBottom: 6, shadowColor: cat.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 }}>
                  <Text style={{ fontSize: r.iconSize }}>{cat.emoji}</Text>
                </View>
                <Text style={{ fontFamily: Typography.fonts.medium, fontSize: r.fs(10), color: Colors.text.secondary, textAlign: "center", lineHeight: 13 }} numberOfLines={2}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <NavigationDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} activeRoute="home" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ══ HERO ══ */}
        <LinearGradient colors={["#1E3A8A", "#2563EB", "#3B82F6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: Platform.OS === "web" ? 28 : 52, paddingBottom: 36, borderBottomLeftRadius: r.isWeb ? 0 : 32, borderBottomRightRadius: r.isWeb ? 0 : 32, overflow: "hidden" }}>
          <View style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,255,255,0.05)" }} />
          <View style={{ position: "absolute", bottom: -20, left: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(6,182,212,0.12)" }} />

          <View style={centerWrap}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 14 }}>
                  <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <Menu size={22} color="#fff" />
                  </TouchableOpacity>
                </MotiView>
                <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500 }}>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(11), color: "rgba(255,255,255,0.6)", marginBottom: 2, letterSpacing: 0.8 }}>YOUR LOCATION</Text>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <MapPin size={14} color="#06B6D4" fill="#06B6D4" />
                    <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: r.fs(14), color: "#fff" }}>Cairo, Egypt</Text>
                    <ChevronRight size={13} color="rgba(255,255,255,0.55)" />
                  </TouchableOpacity>
                </MotiView>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 100, type: "spring", damping: 14 }}>
                  <TouchableOpacity onPress={handleViewBookings} style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <Calendar size={20} color="#fff" />
                  </TouchableOpacity>
                </MotiView>
                <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 150, type: "spring", damping: 14 }}>
                  <TouchableOpacity
                    onPress={() => router.push("/(customer)/chat" as any)}
                    style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                    <MessageCircle size={20} color="#fff" />
                    {/* Unread badge */}
                    <View style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#06B6D4", borderWidth: 1.5, borderColor: "#1E3A8A" }} />
                  </TouchableOpacity>
                </MotiView>
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

          {/* SERVICES — live from API */}
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Services" linkLabel="See all" onLink={handleViewAll} fs={r.fs} />
            {renderCategories()}
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

      {/* ── Floating Chat Button ── */}
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 800, type: "spring", damping: 14 }}
        style={{
          position:       "absolute",
          bottom:         Platform.OS === "ios" ? 36 : 24,
          right:          24,
          shadowColor:    "#1E3A8A",
          shadowOffset:   { width: 0, height: 8 },
          shadowOpacity:  0.35,
          shadowRadius:   16,
          elevation:      12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/(customer)/chat" as any)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#06B6D4", "#0284C7"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" }}
          >
            <MessageCircle size={26} color="#fff" fill="rgba(255,255,255,0.15)" />
          </LinearGradient>
          {/* Unread count badge */}
          <View style={{
            position:        "absolute",
            top:             -4,
            right:           -4,
            width:           22,
            height:          22,
            borderRadius:    11,
            backgroundColor: "#EF4444",
            alignItems:      "center",
            justifyContent:  "center",
            borderWidth:     2,
            borderColor:     "#F8FAFC",
          }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 11, color: "#fff" }}>3</Text>
          </View>
        </TouchableOpacity>
      </MotiView>
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