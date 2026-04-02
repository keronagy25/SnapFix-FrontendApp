import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Platform, useWindowDimensions,
  Modal, Animated, Pressable, ActivityIndicator,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  MapPin, Bell, Search, ChevronRight,
  Menu, X, Home, BookOpen, User, Settings,
  HelpCircle, LogOut, Shield, Gift, MessageCircle,
  Zap, Clock, Star,
  Building2, Heart,
} from "lucide-react-native";
import { useAuthStore }    from "@/store/authStore";
import { Typography }      from "@/theme/typography";
import { getCategories, type Category } from "@/services/coreService";
import { getFavorites, type FavoriteProvider } from "@/services/customerService";

/* ─── Responsive ─────────────────────────────────────────────────── */
function useR() {
  const { width } = useWindowDimensions();
  const isTablet  = width >= 480 && width < 1024;
  const isWeb     = width >= 1024;
  return {
    width, isWeb, isTablet,
    px:    isWeb ? 40 : isTablet ? 28 : 20,
    gap:   isWeb ? 16 : 10,
    maxW:  isWeb ? 1100 : (9999 as number),
    fs:    (n: number) => (isWeb ? n * 1.05 : n),
  };
}

/* ─── Category palette ───────────────────────────────────────────── */
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
type MappedCat = Category & { color: string; bg: string };
const mapCat = (c: Category, i: number): MappedCat => ({ ...c, ...CAT_PALETTE[i % CAT_PALETTE.length] });

/* ─── Mock providers ─────────────────────────────────────────────── */
/* TODO: replace with GET /api/v1/providers/top/ when ready */
const MOCK_PROVIDERS = [
  { id:"1", name:"Ahmed Hassan",  initials:"AH", avatarColor:"#3B82F6", profession:"Plumber",      jobs:124, rating:"4.9", rate:"120", verified:true  },
  { id:"2", name:"Sara Mostafa",  initials:"SM", avatarColor:"#10B981", profession:"Electrician",  jobs:89,  rating:"4.8", rate:"150", verified:true  },
  { id:"3", name:"Omar Khaled",   initials:"OK", avatarColor:"#F59E0B", profession:"AC Technician",jobs:201, rating:"4.7", rate:"200", verified:true  },
  { id:"4", name:"Mona Ibrahim",  initials:"MI", avatarColor:"#8B5CF6", profession:"Cleaner",      jobs:67,  rating:"4.9", rate:"80",  verified:false },
  { id:"5", name:"Karim Farouk",  initials:"KF", avatarColor:"#EF4444", profession:"Painter",      jobs:45,  rating:"4.6", rate:"100", verified:true  },
];

/* ─── Promo offers ───────────────────────────────────────────────── */
const PROMOS = [
  {
    id:       "1",
    emoji:    "🎉",
    title:    "First Booking Free",
    subtitle: "Get your first home service at no cost. Use code at checkout.",
    code:     "SNAPFIX1",
    gradient: ["#1E3A8A", "#06B6D4"] as [string, string],
    expires:  "Valid for new customers",
  },
  {
    id:       "2",
    emoji:    "🔧",
    title:    "20% Off Plumbing",
    subtitle: "Book any plumbing service and save 20% this month.",
    code:     "PIPE20",
    gradient: ["#065F46", "#10B981"] as [string, string],
    expires:  "Ends March 31",
  },
  {
    id:       "3",
    emoji:    "❄️",
    title:    "AC Service Bundle",
    subtitle: "Book 2 AC sessions and get the 3rd one completely free.",
    code:     "COOL3",
    gradient: ["#0C4A6E", "#0284C7"] as [string, string],
    expires:  "Limited time offer",
  },
  {
    id:       "4",
    emoji:    "✨",
    title:    "Premium Cleaning",
    subtitle: "Deep cleaning service with premium products included.",
    code:     "CLEAN30",
    gradient: ["#4C1D95", "#7C3AED"] as [string, string],
    expires:  "Weekends only",
  },
  {
    id:       "5",
    emoji:    "⚡",
    title:    "Emergency Discount",
    subtitle: "15% off all urgent same-day electrical bookings.",
    code:     "URGENT15",
    gradient: ["#92400E", "#D97706"] as [string, string],
    expires:  "Always active",
  },
];

/* ─── Drawer items ───────────────────────────────────────────────── */
const DRAWER_MAIN = [
  { id: "home",     label: "Home",           icon: Home,          route: "/(customer)/home",       color: "#3B82F6" },
  { id: "bookings", label: "My Bookings",    icon: BookOpen,      route: "/(customer)/booking",    color: "#10B981" },
  { id: "favorites",label: "Favorites",      icon: Heart,         route: "/(customer)/favorites",  color: "#EC4899" },
  { id: "chat",     label: "Messages",       icon: MessageCircle, route: "/(customer)/chat",       color: "#06B6D4" },
  { id: "profile",  label: "Profile",        icon: User,          route: "/(customer)/profile",    color: "#8B5CF6" },
  { id: "offices",  label: "Our Offices",    icon: Building2,     route: "/(customer)/offices",    color: "#06B6D4" },
  { id: "offers",   label: "Offers & Deals", icon: Gift,          route: "/(customer)/offers",     color: "#EC4899" },
  { id: "settings", label: "Settings",       icon: Settings,      route: "/(customer)/settings",   color: "#F59E0B" },
];
const DRAWER_BOTTOM = [
  { id: "help",   label: "Help & Support", icon: HelpCircle, route: "/(customer)/support" },
  { id: "safety", label: "Safety Center",  icon: Shield,     route: "/(customer)/safety"  },
];

/* ══════════════════════════════════════════════════════════════════
   NAVIGATION DRAWER
══════════════════════════════════════════════════════════════════ */
function NavigationDrawer({ visible, onClose, user }: {
  visible: boolean; onClose: () => void; user: any;
}) {
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const logout    = useAuthStore((s) => s.logout);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: visible ? 0 : -320, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(fadeAnim,  { toValue: visible ? 1 : 0, duration: visible ? 250 : 200, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const handleNav = (route: string) => { onClose(); setTimeout(() => router.push(route as any), 250); };
  const handleLogout = async () => {
    onClose();
    await logout();
    setTimeout(() => router.replace("/(auth)/customer/login" as any), 250);
  };

  const firstName = user?.first_name ?? "User";
  const lastName  = user?.last_name  ?? "";
  const email     = user?.email      ?? "";
  const initials  = `${firstName[0] ?? "U"}${lastName[0] ?? ""}`.toUpperCase();
  const bookings  = (user as any)?.total_bookings ?? 0;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(15,23,42,0.55)", opacity: fadeAnim }}>
          <Pressable style={{ flex:1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View style={{ position:"absolute", top:0, left:0, bottom:0, width:300, backgroundColor:"#fff", transform:[{ translateX: slideAnim }], shadowColor:"#0F172A", shadowOffset:{width:8,height:0}, shadowOpacity:0.18, shadowRadius:24, elevation:16 }}>
          <LinearGradient colors={["#1E3A8A","#2563EB","#3B82F6"]} start={{x:0,y:0}} end={{x:1,y:1}}
            style={{ paddingTop: Platform.OS==="android"?52:60, paddingBottom:28, paddingHorizontal:20, overflow:"hidden" }}>
            <View style={{ position:"absolute", top:-30, right:-30, width:130, height:130, borderRadius:65, backgroundColor:"rgba(255,255,255,0.07)" }} />
            <TouchableOpacity onPress={onClose} style={{ position:"absolute", top: Platform.OS==="android"?48:56, right:16, width:34, height:34, borderRadius:10, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center" }}>
              <X size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNav("/(customer)/profile")}
              style={{ width:60, height:60, borderRadius:20, backgroundColor:"rgba(255,255,255,0.2)", alignItems:"center", justifyContent:"center", marginBottom:14, borderWidth:2, borderColor:"rgba(255,255,255,0.35)" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:22, color:"#fff" }}>{initials}</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:18, color:"#fff", marginBottom:3 }}>{firstName} {lastName}</Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"rgba(255,255,255,0.65)", marginBottom:12 }}>{email}</Text>
            <View style={{ flexDirection:"row", gap:8 }}>
              <View style={{ backgroundColor:"rgba(255,255,255,0.18)", paddingHorizontal:12, paddingVertical:5, borderRadius:20 }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:"#fff" }}>⭐ {bookings} booking{bookings!==1?"s":""}</Text>
              </View>
              <View style={{ backgroundColor:"rgba(6,182,212,0.3)", paddingHorizontal:12, paddingVertical:5, borderRadius:20 }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:"#E0F7FA" }}>Member</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop:12, paddingBottom:20 }}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:10, color:"#94A3B8", letterSpacing:1.2, marginLeft:20, marginBottom:8, marginTop:8 }}>NAVIGATION</Text>
            {DRAWER_MAIN.map((item) => {
              const isActive = item.id === "home";
              return (
                <TouchableOpacity key={item.id} onPress={() => handleNav(item.route)} activeOpacity={0.75}
                  style={{ flexDirection:"row", alignItems:"center", marginHorizontal:12, marginBottom:4, paddingVertical:13, paddingHorizontal:14, borderRadius:14, backgroundColor: isActive ? item.color+"15" : "transparent" }}>
                  {isActive && <View style={{ position:"absolute", left:0, top:10, bottom:10, width:3, borderRadius:2, backgroundColor:item.color }} />}
                  <View style={{ width:38, height:38, borderRadius:12, backgroundColor: isActive ? item.color+"20" : "#F1F5F9", alignItems:"center", justifyContent:"center", marginRight:14 }}>
                    <item.icon size={18} color={isActive ? item.color : "#64748B"} />
                  </View>
                  <Text style={{ fontFamily: isActive ? Typography.fonts.semibold : Typography.fonts.medium, fontSize:15, color: isActive ? item.color : "#334155", flex:1 }}>{item.label}</Text>
                  {isActive && <View style={{ width:7, height:7, borderRadius:4, backgroundColor:item.color }} />}
                </TouchableOpacity>
              );
            })}
            <View style={{ height:1, backgroundColor:"#F1F5F9", marginHorizontal:20, marginTop:12, marginBottom:16 }} />            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:10, color:"#94A3B8", letterSpacing:1.2, marginLeft:20, marginBottom:8 }}>MORE</Text>
            {DRAWER_BOTTOM.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => handleNav(item.route)} activeOpacity={0.75}
                style={{ flexDirection:"row", alignItems:"center", marginHorizontal:12, marginBottom:4, paddingVertical:11, paddingHorizontal:14, borderRadius:14 }}>
                <View style={{ width:38, height:38, borderRadius:12, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center", marginRight:14 }}>
                  <item.icon size={17} color="#94A3B8" />
                </View>
                <Text style={{ fontFamily: Typography.fonts.medium, fontSize:14, color:"#64748B" }}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ height:1, backgroundColor:"#F1F5F9", marginHorizontal:20, marginTop:12, marginBottom:16 }} />
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.75}
              style={{ flexDirection:"row", alignItems:"center", marginHorizontal:12, paddingVertical:13, paddingHorizontal:14, borderRadius:14, backgroundColor:"#FEF2F2" }}>
              <View style={{ width:38, height:38, borderRadius:12, backgroundColor:"#FEE2E2", alignItems:"center", justifyContent:"center", marginRight:14 }}>
                <LogOut size={17} color="#EF4444" />
              </View>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#EF4444" }}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={{ paddingHorizontal:20, paddingBottom: Platform.OS==="android"?20:32, paddingTop:12, borderTopWidth:1, borderTopColor:"#F1F5F9" }}>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#CBD5E1", textAlign:"center" }}>SnapFix v1.0.0 · Cairo, Egypt 🇪🇬</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════ */
export default function CustomerHomeScreen() {
  const [search,      setSearch]      = useState("");
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [categories,  setCategories]  = useState<MappedCat[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError,   setCatsError]   = useState<string | null>(null);
  const [favorites,   setFavorites]   = useState<FavoriteProvider[]>([]);
  const [favsLoading, setFavsLoading] = useState(true);

  const r     = useR();
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const firstName = user?.first_name ?? "there";
  const h         = new Date().getHours();
  const greeting  = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

  const loadCategories = async () => {
    try {
      setCatsLoading(true);
      setCatsError(null);
      const list = await getCategories(token ?? undefined);
      setCategories(list.map(mapCat));
    } catch (err: any) {
      setCatsError(err?.message ?? "Failed to load services");
    } finally {
      setCatsLoading(false);
    }
  };
  const loadFavorites = async () => {
    if (!token) return;
    try {
      setFavsLoading(true);
      const list = await getFavorites(token);
      setFavorites(list);
    } catch (err: any) {
      console.log("Failed to load favorites:", err);
      setFavorites([]);
    } finally {
      setFavsLoading(false);
    }
  };
  useEffect(() => { 
    loadCategories();
    loadFavorites();
  }, []);

  const centerWrap: any = r.isWeb
    ? { maxWidth: r.maxW, width:"100%", alignSelf:"center", paddingHorizontal: r.px }
    : { paddingHorizontal: r.px };

  const catSize     = r.isWeb ? 68 : r.isTablet ? 60 : 52;
  const visibleCats = search.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <NavigationDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:110 }}>

        {/* ══ HERO ══ */}
        <LinearGradient colors={["#1E3A8A","#2563EB","#3B82F6"]} start={{x:0,y:0}} end={{x:1,y:1}}
          style={{ paddingTop: Platform.OS==="web"?28:52, paddingBottom:32, borderBottomLeftRadius: r.isWeb?0:32, borderBottomRightRadius: r.isWeb?0:32, overflow:"hidden" }}>
          <View style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:100, backgroundColor:"rgba(255,255,255,0.05)" }} />
          <View style={{ position:"absolute", bottom:-20, left:-30, width:140, height:140, borderRadius:70, backgroundColor:"rgba(6,182,212,0.12)" }} />

          <View style={centerWrap}>
            {/* Top bar */}
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
                <TouchableOpacity onPress={() => setDrawerOpen(true)}
                  style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center" }}>
                  <Menu size={22} color="#fff" />
                </TouchableOpacity>
                <View>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(11), color:"rgba(255,255,255,0.55)", letterSpacing:0.8 }}>YOUR LOCATION</Text>
                  <TouchableOpacity style={{ flexDirection:"row", alignItems:"center", gap:4, marginTop:2 }}>
                    <MapPin size={13} color="#06B6D4" fill="#06B6D4" />
                    <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: r.fs(14), color:"#fff" }}>Cairo, Egypt</Text>
                    <ChevronRight size={12} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center" }}>
                <Bell size={20} color="#fff" />
                <View style={{ position:"absolute", top:9, right:9, width:8, height:8, borderRadius:4, backgroundColor:"#06B6D4", borderWidth:1.5, borderColor:"#1E3A8A" }} />
              </TouchableOpacity>
            </View>

            {/* Greeting */}
            <View >
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(13), color:"rgba(255,255,255,0.6)" }}>{greeting}, 👋</Text>
              <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: r.fs(r.isWeb?30:26), color:"#fff", lineHeight: r.isWeb?38:34, marginTop:2, marginBottom:4 }}>
                {firstName}!
              </Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(13), color:"rgba(255,255,255,0.5)" }}>
                What do you need fixed today?
              </Text>
            </View>

            {/* Search */}
            <View style={{ marginTop:20 }}>
              <View style={{ flexDirection:"row", alignItems:"center", backgroundColor:"#fff", borderRadius:18, paddingHorizontal:16, paddingVertical:13, shadowColor:"#000", shadowOffset:{width:0,height:8}, shadowOpacity:0.14, shadowRadius:20, elevation:8, gap:10 }}>
                <Search size={18} color="#94A3B8" />
                <TextInput value={search} onChangeText={setSearch}
                  placeholder="Search services e.g. plumbing, AC…"
                  placeholderTextColor="#CBD5E1"
                  style={{ flex:1, fontFamily: Typography.fonts.regular, fontSize: r.fs(14), color:"#0F172A", padding:0 }}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <View style={{ width:20, height:20, borderRadius:10, backgroundColor:"#E2E8F0", alignItems:"center", justifyContent:"center" }}>
                      <X size={11} color="#64748B" />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={centerWrap}>

          {/* ── HIGHLIGHTS ── */}
          <View style={{ flexDirection:"row", gap: r.gap, marginTop:20 }}>
            {[
              { icon: Zap,   label:"Fast Booking",  sub:"Same-day service",   color:"#F59E0B", bg:"#FFFBEB" },
              { icon: Star,  label:"Top Rated",     sub:"Verified providers", color:"#3B82F6", bg:"#EFF6FF" },
              { icon: Clock, label:"24/7 Support",  sub:"Always available",   color:"#10B981", bg:"#ECFDF5" },
            ].map((item) => (
              <View key={item.label} style={{ flex:1, backgroundColor:"#fff", borderRadius:16, padding:12, alignItems:"center", borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
                <View style={{ width:36, height:36, borderRadius:11, backgroundColor:item.bg, alignItems:"center", justifyContent:"center", marginBottom:8 }}>
                  <item.icon size={17} color={item.color} />
                </View>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: r.fs(11), color:"#0F172A", textAlign:"center", marginBottom:2 }}>{item.label}</Text>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(9.5), color:"#94A3B8", textAlign:"center" }}>{item.sub}</Text>
              </View>
            ))}
          </View>

          {/* ── SERVICES ── */}
          <View style={{ marginTop:28 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(18), color:"#0F172A" }}>
                {search ? `Results for "${search}"` : "Our Services"}
              </Text>
              {!search && (
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(12), color:"#94A3B8" }}>Tap to book</Text>
              )}
            </View>

            {catsLoading ? (
              <View style={{ alignItems:"center", paddingVertical:36 }}>
                <ActivityIndicator size="large" color="#1E3A8A" />
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#94A3B8", marginTop:10 }}>Loading services…</Text>
              </View>
            ) : catsError ? (
              <View style={{ alignItems:"center", paddingVertical:28, gap:10 }}>
                <Text style={{ fontSize:36 }}>⚠️</Text>
                <Text style={{ fontFamily: Typography.fonts.medium, fontSize:14, color:"#EF4444", textAlign:"center" }}>{catsError}</Text>
                <TouchableOpacity onPress={loadCategories} style={{ backgroundColor:"#1E3A8A", paddingHorizontal:20, paddingVertical:9, borderRadius:12 }}>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:13, color:"#fff" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : visibleCats.length === 0 ? (
              <View style={{ alignItems:"center", paddingVertical:32 }}>
                <Text style={{ fontSize:36, marginBottom:8 }}>🔍</Text>
                <Text style={{ fontFamily: Typography.fonts.medium, fontSize:14, color:"#64748B" }}>No services found</Text>
              </View>
            ) : (
              <View style={{ flexDirection:"row", flexWrap:"wrap", marginHorizontal: r.isWeb ? -8 : 0 }}>
                {visibleCats.map((cat, i) => {
                  // Responsive grid columns
                  let cols: number;
                  if (r.isWeb) cols = 10;
                  else if (r.isTablet) cols = r.width >= 620 ? 6 : 5;
                  else cols = r.width >= 380 ? 4 : 3;
                  
                  const gap = r.isWeb ? 8 : r.isTablet ? 6 : 4;
                  const totalGapWidth = (cols - 1) * gap;
                  const itemW = (r.width - r.px * 2 - totalGapWidth) / cols;
                  
                  return (
                    <View key={cat.id} style={{ 
                      width: r.isWeb ? `${100/cols}%` : itemW,
                      alignItems:"center", 
                      marginBottom: r.isWeb ? 20 : r.isTablet ? 18 : 16,
                      paddingHorizontal: r.isWeb ? 8 : 0,
                      marginRight: r.isWeb ? 0 : (i % cols === cols - 1 ? 0 : gap)
                    }}>
                      <TouchableOpacity activeOpacity={0.82} style={{ alignItems:"center", width:"100%" }}
                        onPress={() => router.push({ pathname:"/(customer)/booking/create" as any, params:{ category_id: String(cat.id), category_name: cat.name } })}>
                        <View style={{ 
                          width:catSize, 
                          height:catSize, 
                          borderRadius: r.isWeb ? 20 : r.isTablet ? 16 : 14,
                          backgroundColor:cat.bg, 
                          alignItems:"center", 
                          justifyContent:"center", 
                          marginBottom: r.isWeb ? 10 : r.isTablet ? 8 : 6, 
                          shadowColor:cat.color, 
                          shadowOffset:{width:0,height:4}, 
                          shadowOpacity:0.2, 
                          shadowRadius:8, 
                          elevation:4 
                        }}>
                          <Text style={{ fontSize: r.isWeb?28:r.isTablet?24:20 }}>{cat.icon}</Text>
                        </View>
                        <Text style={{ 
                          fontFamily: Typography.fonts.medium, 
                          fontSize: r.isWeb ? 11 : r.isTablet ? 11 : 10, 
                          color:"#64748B", 
                          textAlign:"center", 
                          lineHeight: r.isWeb ? 16 : r.isTablet ? 15 : 13,
                          paddingHorizontal: r.isWeb ? 4 : 2,
                          maxWidth: itemW
                        }} numberOfLines={2}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── OFFERS & DEALS ── */}
          {!search && (
            <View style={{ marginTop:12 }}>

              {/* Section header */}
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <View>
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(18), color:"#0F172A" }}>Offers & Deals</Text>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(12), color:"#94A3B8", marginTop:2 }}>
                    Use promo codes at checkout
                  </Text>
                </View>
                <View style={{ backgroundColor:"#FEF3C7", paddingHorizontal:10, paddingVertical:4, borderRadius:10 }}>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:"#D97706" }}>{PROMOS.length} active</Text>
                </View>
              </View>

              {/* Horizontal scroll of promo cards */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight:4 }}>
                {PROMOS.map((promo, i) => (
                  <View key={promo.id} >
                    <TouchableOpacity activeOpacity={0.9}
                      onPress={() => router.push("/(customer)/booking/create" as any)}
                      style={{ marginRight:14, width: r.width * 0.72 }}>
                      <LinearGradient colors={promo.gradient} start={{x:0,y:0}} end={{x:1,y:1}}
                        style={{ borderRadius:22, padding:20, overflow:"hidden", minHeight:160 }}>
                        {/* Decorative circles */}
                        <View style={{ position:"absolute", right:-24, top:-24, width:110, height:110, borderRadius:55, backgroundColor:"rgba(255,255,255,0.07)" }} />
                        <View style={{ position:"absolute", right:30, bottom:-20, width:70, height:70, borderRadius:35, backgroundColor:"rgba(255,255,255,0.05)" }} />

                        {/* Emoji + expiry */}
                        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                          <Text style={{ fontSize:30 }}>{promo.emoji}</Text>
                          <View style={{ backgroundColor:"rgba(255,255,255,0.18)", paddingHorizontal:10, paddingVertical:4, borderRadius:20 }}>
                            <Text style={{ fontFamily: Typography.fonts.medium, fontSize:10, color:"rgba(255,255,255,0.9)" }}>{promo.expires}</Text>
                          </View>
                        </View>

                        <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(16), color:"#fff", marginBottom:5 }}>{promo.title}</Text>
                        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(12), color:"rgba(255,255,255,0.72)", lineHeight:18, marginBottom:14 }} numberOfLines={2}>
                          {promo.subtitle}
                        </Text>

                        {/* Code pill + CTA */}
                        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
                          <View style={{ backgroundColor:"rgba(255,255,255,0.2)", paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:"rgba(255,255,255,0.3)" }}>
                            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:12, color:"#fff", letterSpacing:1.5 }}>{promo.code}</Text>
                          </View>
                          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: r.fs(12), color:"rgba(255,255,255,0.85)" }}>Use now →</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── EMERGENCY ── */}
          {!search && (
            <View style={{ marginTop:20 }}>
              <TouchableOpacity activeOpacity={0.9}
                onPress={() => router.push({ pathname:"/(customer)/booking/create" as any, params:{ is_urgent:"true" } })}>
                <LinearGradient colors={["#EF4444","#DC2626"]} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{ borderRadius:18, padding:18, flexDirection:"row", alignItems:"center", justifyContent:"space-between", overflow:"hidden" }}>
                  <View style={{ position:"absolute", right:-10, top:-10, width:90, height:90, borderRadius:45, backgroundColor:"rgba(255,255,255,0.07)" }} />
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(15), color:"#fff", marginBottom:2 }}>🚨 Emergency Service</Text>
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(12), color:"rgba(255,255,255,0.8)" }}>Available 24/7 · Arrives in 30 min</Text>
                  </View>
                  <View style={{ backgroundColor:"#fff", paddingHorizontal:16, paddingVertical:9, borderRadius:12 }}>
                    <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(13), color:"#EF4444" }}>Book Now</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ── FAVORITE PROVIDERS ── */}
          {!search && (
            <View style={{ marginTop:24, marginBottom:8 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <View>
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize: r.fs(18), color:"#0F172A" }}>Favorite Providers</Text>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(12), color:"#94A3B8", marginTop:2 }}>
                    {favorites.length === 0 ? "No favorites yet" : `${favorites.length} saved`}
                  </Text>
                </View>
              </View>

              {favsLoading ? (
                <View style={{ alignItems:"center", paddingVertical:36 }}>
                  <ActivityIndicator size="large" color="#1E3A8A" />
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#94A3B8", marginTop:10 }}>Loading favorites…</Text>
                </View>
              ) : favorites.length === 0 ? (
                <View style={{ backgroundColor:"#F8FAFC", borderRadius:18, padding:20, alignItems:"center", gap:12, borderWidth:1, borderColor:"#E2E8F0" }}>
                  <Text style={{ fontSize:40 }}>⭐</Text>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:15, color:"#0F172A" }}>No Favorite Providers Yet</Text>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#94A3B8", textAlign:"center" }}>
                    Add your preferred providers to favorites for quick access
                  </Text>
                  <TouchableOpacity onPress={() => router.push("/(customer)/booking/create" as any)}
                    style={{ backgroundColor:"#1E3A8A", paddingHorizontal:24, paddingVertical:11, borderRadius:14, marginTop:8 }}>
                    <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:13, color:"#fff" }}>Browse Providers</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                favorites.map((prov) => (
                  <View key={prov.id}>
                    <TouchableOpacity activeOpacity={0.88}
                      style={{ backgroundColor:"#fff", borderRadius:18, padding:16, marginBottom:10, flexDirection:"row", alignItems:"center", borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:3}, shadowOpacity:0.06, shadowRadius:10, elevation:3 }}>
                      {/* Avatar */}
                      <View style={{ width:52, height:52, borderRadius:16, backgroundColor:"#EEE2FF", alignItems:"center", justifyContent:"center", marginRight:14 }}>
                        <Star size={20} color="#8B5CF6" fill="#8B5CF6" />
                      </View>
                      {/* Info */}
                      <View style={{ flex:1 }}>
                        <View style={{ flexDirection:"row", alignItems:"center", gap:6, marginBottom:3 }}>
                          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: r.fs(14), color:"#0F172A" }}>
                            {prov.first_name} {prov.last_name}
                          </Text>
                          {prov.is_available && (
                            <View style={{ backgroundColor:"#ECFDF5", paddingHorizontal:6, paddingVertical:2, borderRadius:6 }}>
                              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:9, color:"#10B981" }}>✓ Available</Text>
                            </View>
                          )}
                        </View>
                        {prov.business_name && (
                          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(12), color:"#94A3B8", marginBottom:3 }}>
                            {prov.business_name}
                          </Text>
                        )}
                        <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                          <View style={{ flexDirection:"row", alignItems:"center", gap:3 }}>
                            <Text style={{ fontSize:11 }}>⭐</Text>
                            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: r.fs(12), color:"#F59E0B" }}>{prov.rating?.toFixed(1) ?? "—"}</Text>
                          </View>
                          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: r.fs(12), color:"#CBD5E1" }}>·</Text>
                          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: r.fs(12), color:"#64748B" }}>
                            {prov.total_reviews} reviews · {prov.completion_rate}% completed
                          </Text>
                        </View>
                      </View>
                      {/* Book */}
                      <TouchableOpacity
                        onPress={() => router.push("/(customer)/booking/create" as any)}
                        style={{ backgroundColor:"#6366F1", paddingHorizontal:14, paddingVertical:9, borderRadius:12 }}>
                        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: r.fs(12), color:"#fff" }}>Book</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

        </View>
      </ScrollView>
    </View>
  );
}