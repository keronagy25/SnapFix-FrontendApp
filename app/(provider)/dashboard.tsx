import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, StatusBar, Platform, useWindowDimensions,
  Modal, Animated, Pressable,
} from "react-native";
import { router }            from "expo-router";
import { MotiView }          from "moti";
import { LinearGradient }    from "expo-linear-gradient";
import {
  Bell, Star, TrendingUp, CheckCircle, Clock,
  MapPin, ChevronRight, Zap, DollarSign,
  Briefcase, AlertCircle, ThumbsUp, Navigation,
  Menu, X, Home, BookOpen, User, Settings,
  HelpCircle, LogOut, Shield, Wallet, BarChart2,
  MessageCircle,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { Typography }   from "@/theme/typography";

/* ─── Responsive ──────────────────────────────────────────────────── */
function useR() {
  const { width } = useWindowDimensions();
  const isTablet  = width >= 480 && width < 1024;
  const isWeb     = width >= 1024;
  return {
    width, isWeb, isTablet,
    px:    isWeb ? 40 : isTablet ? 28 : 20,
    gap:   isWeb ? 16 : 10,
    maxW:  isWeb ? 1100 : 9999,
    fs:    (n: number) => (isWeb ? n * 1.05 : n),
    cols2: isWeb || isTablet,
  };
}

/* ─── Drawer nav items ────────────────────────────────────────────── */
const DRAWER_MAIN = [
  { id: "dashboard", label: "Dashboard",      icon: Home,          route: "/(provider)/dashboard",  color: "#06B6D4" },
  { id: "jobs",      label: "My Jobs",         icon: Briefcase,     route: "/(provider)/jobs",       color: "#3B82F6" },
  { id: "earnings",  label: "Earnings",        icon: DollarSign,    route: "/(provider)/earnings",   color: "#10B981" },
  { id: "wallet",    label: "Wallet",          icon: Wallet,        route: "/(provider)/wallet",     color: "#F59E0B" },
  { id: "chat",      label: "Messages",        icon: MessageCircle, route: "/(provider)/chat",       color: "#8B5CF6" },
  { id: "stats",     label: "Performance",     icon: BarChart2,     route: "/(provider)/stats",      color: "#EC4899" },
  { id: "profile",   label: "My Profile",      icon: User,          route: "/(provider)/profile",    color: "#64748B" },
  { id: "settings",  label: "Settings",        icon: Settings,      route: "/(provider)/settings",   color: "#64748B" },
];

const DRAWER_BOTTOM = [
  { id: "help",   label: "Help & Support", icon: HelpCircle, route: "/(provider)/support", color: "#64748B" },
  { id: "safety", label: "Safety Center",  icon: Shield,     route: "/(provider)/safety",  color: "#64748B" },
];

/* ══════════════════════════════════════════════════════════════════
   NAVIGATION DRAWER  (dark theme — matches dashboard)
══════════════════════════════════════════════════════════════════ */
function ProviderDrawer({
  visible, onClose, user, activeRoute = "dashboard",
}: {
  visible: boolean; onClose: () => void; user: any; activeRoute?: string;
}) {
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const logout    = useAuthStore((s) => s.logout);

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

  const handleLogout = async () => {
    onClose();
    await logout();
    setTimeout(() => router.replace("/(auth)/role-select" as any), 250);
  };

  const firstName = user?.first_name ?? "Provider";
  const lastName  = user?.last_name  ?? "";
  const email     = user?.email      ?? "provider@snapfix.com";
  const initials  = `${firstName[0] ?? "P"}${lastName[0] ?? ""}`.toUpperCase();

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.65)", opacity: fadeAnim }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Drawer panel */}
        <Animated.View style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: 300,
          backgroundColor: "#0F172A",
          transform: [{ translateX: slideAnim }],
          shadowColor: "#000", shadowOffset: { width: 8, height: 0 }, shadowOpacity: 0.4, shadowRadius: 24, elevation: 20,
        }}>
          {/* Decorative blobs */}
          <View style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(6,182,212,0.06)" }} />
          <View style={{ position: "absolute", bottom: 60, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(59,130,246,0.05)" }} />

          {/* Header */}
          <LinearGradient colors={["#0F172A", "#1E293B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ paddingTop: Platform.OS === "android" ? 52 : 60, paddingBottom: 28, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}
          >
            {/* Close btn */}
            <TouchableOpacity onPress={onClose} style={{ position: "absolute", top: Platform.OS === "android" ? 48 : 56, right: 16, width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
              <X size={17} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            {/* Avatar — tappable → profile */}
            <TouchableOpacity
              onPress={() => { onClose(); setTimeout(() => router.push("/(provider)/profile" as any), 250); }}
              style={{ width: 62, height: 62, borderRadius: 20, backgroundColor: "rgba(6,182,212,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 2, borderColor: "rgba(6,182,212,0.35)" }}
            >
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 22, color: "#06B6D4" }}>{initials}</Text>
            </TouchableOpacity>

            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#fff", marginBottom: 3 }}>{firstName} {lastName}</Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>{email}</Text>

            {/* Badges */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ backgroundColor: "rgba(6,182,212,0.15)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(6,182,212,0.25)" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#06B6D4" }}>🔧 Provider</Text>
              </View>
              <View style={{ backgroundColor: "rgba(16,185,129,0.15)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: "rgba(16,185,129,0.25)" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#10B981" }}>✓ Verified</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}>
            {/* Section label */}
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 1.3, marginLeft: 20, marginBottom: 8 }}>NAVIGATION</Text>

            {DRAWER_MAIN.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <TouchableOpacity key={item.id} onPress={() => handleNav(item.route)} activeOpacity={0.75}
                  style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginBottom: 3, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: isActive ? item.color + "18" : "transparent" }}
                >
                  {isActive && <View style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: item.color }} />}
                  <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: isActive ? item.color + "22" : "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginRight: 13 }}>
                    <item.icon size={17} color={isActive ? item.color : "rgba(255,255,255,0.45)"} />
                  </View>
                  <Text style={{ fontFamily: isActive ? Typography.fonts.semibold : Typography.fonts.medium, fontSize: 14, color: isActive ? item.color : "rgba(255,255,255,0.65)", flex: 1 }}>
                    {item.label}
                  </Text>
                  {isActive && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.color }} />}
                </TouchableOpacity>
              );
            })}

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: 20, marginTop: 12, marginBottom: 16 }} />

            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 1.3, marginLeft: 20, marginBottom: 8 }}>MORE</Text>

            {DRAWER_BOTTOM.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => handleNav(item.route)} activeOpacity={0.75}
                style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 12, marginBottom: 3, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14 }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginRight: 13 }}>
                  <item.icon size={16} color="rgba(255,255,255,0.3)" />
                </View>
                <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 14, color: "rgba(255,255,255,0.45)" }}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: 20, marginTop: 12, marginBottom: 16 }} />

            {/* Logout */}
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.75}
              style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(239,68,68,0.1)" }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: "rgba(239,68,68,0.15)", alignItems: "center", justifyContent: "center", marginRight: 13 }}>
                <LogOut size={16} color="#EF4444" />
              </View>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#EF4444" }}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Footer */}
          <View style={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "android" ? 20 : 32, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              SnapFix v1.0.0 · Provider App 🇪🇬
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ─── Mock Data ───────────────────────────────────────────────────── */
const STATS = [
  { label: "Today's Earnings", value: "0 EGP",  icon: DollarSign,  color: "#10B981", bg: "rgba(16,185,129,0.12)"  },
  { label: "Jobs Done",        value: "0",       icon: CheckCircle, color: "#3B82F6", bg: "rgba(59,130,246,0.12)"  },
  { label: "Rating",           value: "—",       icon: Star,        color: "#F59E0B", bg: "rgba(245,158,11,0.12)"  },
  { label: "Response Rate",    value: "—",       icon: ThumbsUp,    color: "#8B5CF6", bg: "rgba(139,92,246,0.12)"  },
];

const JOB_REQUESTS = [
  { id:"1", customerName:"Sara Ahmed",  customerAvatar:"SA", avatarColor:"#EC4899", service:"AC Repair",  emoji:"❄️", address:"Dokki, Giza",   distance:"2.3 km", price:"250 EGP", urgency:"urgent" as const, postedAt:"2 min ago", timer:45  },
  { id:"2", customerName:"Omar Khalil", customerAvatar:"OK", avatarColor:"#3B82F6", service:"Electrical", emoji:"⚡", address:"Maadi, Cairo", distance:"4.1 km", price:"180 EGP", urgency:"normal" as const, postedAt:"8 min ago", timer:120 },
];

const RECENT_JOBS = [
  { id:"1", service:"Plumbing",   customer:"Ahmed M.", price:"320 EGP", date:"Today, 10:30 AM", emoji:"🔧" },
  { id:"2", service:"Electrical", customer:"Sara K.",  price:"200 EGP", date:"Today, 8:00 AM",  emoji:"⚡" },
  { id:"3", service:"AC Repair",  customer:"Mona S.",  price:"450 EGP", date:"Yesterday, 3 PM", emoji:"❄️" },
];

/* ══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════════ */
export default function ProviderDashboard() {
  const [isOnline,    setIsOnline]    = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [drawerOpen,  setDrawerOpen]  = useState(false);

  const r    = useR();
  const user = useAuthStore((s) => s.user);

  const firstName = user?.first_name ?? "Provider";
  const h         = new Date().getHours();
  const greeting  = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

  const centerWrap: any = r.isWeb
    ? { maxWidth: r.maxW, width: "100%", alignSelf: "center", paddingHorizontal: r.px }
    : { paddingHorizontal: r.px };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* ── Drawer ── */}
      <ProviderDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        activeRoute="dashboard"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ══ HEADER ══ */}
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: Platform.OS === "web" ? 28 : 52, paddingBottom: 32, borderBottomLeftRadius: r.isWeb ? 0 : 32, borderBottomRightRadius: r.isWeb ? 0 : 32, overflow: "hidden" }}
        >
          <View style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:100, backgroundColor:"rgba(6,182,212,0.08)" }} />
          <View style={{ position:"absolute", bottom:-40, left:-40, width:160, height:160, borderRadius:80, backgroundColor:"rgba(59,130,246,0.06)" }} />

          <View style={centerWrap}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
                {/* ── Hamburger ── */}
                <MotiView from={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ type:"spring", damping:14 }}>
                  <TouchableOpacity
                    onPress={() => setDrawerOpen(true)}
                    style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center" }}
                  >
                    <Menu size={22} color="#fff" />
                  </TouchableOpacity>
                </MotiView>

                <MotiView from={{ opacity:0, translateY:-10 }} animate={{ opacity:1, translateY:0 }} transition={{ type:"timing", duration:500 }}>
                  <TouchableOpacity onPress={() => router.push("/(provider)/profile" as any)}>
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize:r.fs(13), color:"rgba(255,255,255,0.5)", marginBottom:2 }}>{greeting}, 👷</Text>
                    <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:r.fs(22), color:"#fff", lineHeight:28 }}>{firstName}</Text>
                  </TouchableOpacity>
                </MotiView>
              </View>

              {/* Bell */}
              <MotiView from={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} transition={{ delay:100, type:"spring", damping:14 }}>
                <TouchableOpacity style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center" }}>
                  <Bell size={20} color="#fff" />
                  <View style={{ position:"absolute", top:9, right:9, width:8, height:8, borderRadius:4, backgroundColor:"#06B6D4", borderWidth:1.5, borderColor:"#0F172A" }} />
                </TouchableOpacity>
              </MotiView>
            </View>

            {/* ── ONLINE TOGGLE CARD ── */}
            <MotiView from={{ opacity:0, translateY:16 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:150, type:"timing", duration:500 }}>
              <View style={{ backgroundColor:"rgba(255,255,255,0.06)", borderRadius:20, padding:20, borderWidth:1, borderColor: isOnline ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.08)" }}>
                <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
                  <View style={{ flex:1 }}>
                    <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:4 }}>
                      <MotiView
                        animate={{ scale: isOnline ? [1,1.3,1] : 1, opacity: isOnline ? 1 : 0.4 }}
                        transition={{ loop: isOnline, type:"timing", duration:1200 }}
                        style={{ width:10, height:10, borderRadius:5, backgroundColor: isOnline ? "#06B6D4" : "#475569" }}
                      />
                      <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(16), color: isOnline ? "#06B6D4" : "#94A3B8" }}>
                        {isOnline ? "Online" : "Offline"}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize:r.fs(12), color:"rgba(255,255,255,0.45)", lineHeight:18 }}>
                      {isOnline ? "You're receiving job requests" : "Toggle on to start receiving jobs"}
                    </Text>
                  </View>
                  <Switch
                    value={isOnline} onValueChange={setIsOnline}
                    trackColor={{ false:"#334155", true:"#06B6D4" }}
                    thumbColor={isOnline ? "#fff" : "#94A3B8"}
                    ios_backgroundColor="#334155"
                    style={{ transform:[{scaleX:1.1},{scaleY:1.1}] }}
                  />
                </View>

                {isOnline && (
                  <MotiView from={{ opacity:0 }} animate={{ opacity:1 }} transition={{ type:"timing", duration:300 }}
                    style={{ marginTop:16, paddingTop:16, borderTopWidth:1, borderTopColor:"rgba(255,255,255,0.08)", flexDirection:"row", justifyContent:"space-around" }}
                  >
                    {[
                      { label:"Today",      value:"0 EGP", icon:DollarSign },
                      { label:"Active Jobs",value:"0",     icon:Briefcase  },
                      { label:"In Queue",   value:`${JOB_REQUESTS.length}`, icon:Clock },
                    ].map((item) => (
                      <View key={item.label} style={{ alignItems:"center" }}>
                        <item.icon size={16} color="#06B6D4" style={{ marginBottom:4 }} />
                        <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(15), color:"#fff" }}>{item.value}</Text>
                        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:r.fs(10), color:"rgba(255,255,255,0.4)" }}>{item.label}</Text>
                      </View>
                    ))}
                  </MotiView>
                )}
              </View>
            </MotiView>
          </View>
        </LinearGradient>

        {/* ══ BODY ══ */}
        <View style={centerWrap}>

          {/* STATS */}
          <MotiView from={{ opacity:0, translateY:20 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:200, type:"timing", duration:500 }}
            style={{ flexDirection:"row", flexWrap:"wrap", gap:r.gap, marginTop:20 }}
          >
            {STATS.map((s, i) => {
              const wPhone: any = (r.width - r.px * 2 - r.gap) / 2;
              return (
                <MotiView key={s.label} from={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*60, type:"spring", damping:14 }}
                  style={{ width: r.isWeb ? (r.width - r.px * 2 - r.gap * 3) / 4 : wPhone }}
                >
                  <View style={{ backgroundColor:"#fff", borderRadius:20, padding:r.fs(16), shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:10, elevation:3, borderWidth:1, borderColor:"#F1F5F9" }}>
                    <View style={{ width:40, height:40, borderRadius:14, backgroundColor:s.bg, alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                      <s.icon size={20} color={s.color} />
                    </View>
                    <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(20), color:"#0F172A", marginBottom:2 }}>{s.value}</Text>
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize:r.fs(11), color:"#94A3B8", lineHeight:15 }}>{s.label}</Text>
                  </View>
                </MotiView>
              );
            })}
          </MotiView>

          {/* JOB REQUESTS */}
          {isOnline && (
            <MotiView from={{ opacity:0, translateY:20 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:300, type:"timing", duration:500 }} style={{ marginTop:28 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(18), color:"#0F172A" }}>New Requests</Text>
                  {JOB_REQUESTS.length > 0 && (
                    <View style={{ backgroundColor:"#EF4444", width:22, height:22, borderRadius:11, alignItems:"center", justifyContent:"center" }}>
                      <Text style={{ fontFamily: Typography.fonts.bold, fontSize:11, color:"#fff" }}>{JOB_REQUESTS.length}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={{ flexDirection:"row", flexWrap:"wrap", gap:r.gap }}>
                {JOB_REQUESTS.map((job, i) => (
                  <MotiView key={job.id} from={{ opacity:0, translateY:20 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:i*100, type:"timing", duration:400 }}
                    style={{ width: (r.isTablet || r.isWeb) ? (r.width - r.px * 2 - r.gap) / 2 : "100%" as any }}
                  >
                    <View style={{ backgroundColor:"#fff", borderRadius:20, padding:18, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:4}, shadowOpacity:0.08, shadowRadius:14, elevation:4, borderWidth:1.5, borderColor: job.urgency==="urgent" ? "#FEE2E2" : "#F1F5F9" }}>
                      {job.urgency === "urgent" && (
                        <View style={{ flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#FEF2F2", paddingHorizontal:10, paddingVertical:4, borderRadius:20, alignSelf:"flex-start", marginBottom:12 }}>
                          <AlertCircle size={12} color="#EF4444" />
                          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:10, color:"#EF4444" }}>URGENT</Text>
                        </View>
                      )}
                      <View style={{ flexDirection:"row", alignItems:"center", marginBottom:12 }}>
                        <View style={{ width:44, height:44, borderRadius:14, backgroundColor:job.avatarColor+"22", alignItems:"center", justifyContent:"center", marginRight:12 }}>
                          <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:job.avatarColor }}>{job.customerAvatar}</Text>
                        </View>
                        <View style={{ flex:1 }}>
                          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:r.fs(14), color:"#0F172A" }}>{job.customerName}</Text>
                          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:r.fs(12), color:"#94A3B8" }}>{job.postedAt}</Text>
                        </View>
                        <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(16), color:"#10B981" }}>{job.price}</Text>
                      </View>
                      <View style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#F8FAFC", borderRadius:12, padding:10, marginBottom:12 }}>
                        <Text style={{ fontSize:20 }}>{job.emoji}</Text>
                        <View>
                          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:r.fs(14), color:"#0F172A" }}>{job.service}</Text>
                          <View style={{ flexDirection:"row", alignItems:"center", gap:4, marginTop:2 }}>
                            <MapPin size={11} color="#94A3B8" />
                            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:r.fs(11), color:"#94A3B8" }}>{job.address}</Text>
                            <Text style={{ color:"#CBD5E1", fontSize:11 }}>·</Text>
                            <Navigation size={11} color="#3B82F6" />
                            <Text style={{ fontFamily: Typography.fonts.medium, fontSize:r.fs(11), color:"#3B82F6" }}>{job.distance}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ height:3, backgroundColor:"#F1F5F9", borderRadius:2, marginBottom:14, overflow:"hidden" }}>
                        <MotiView from={{ width:"100%" }} animate={{ width:"0%" }} transition={{ type:"timing", duration:job.timer*1000, loop:false }}
                          style={{ height:"100%", backgroundColor: job.urgency==="urgent" ? "#EF4444" : "#06B6D4", borderRadius:2 }}
                        />
                      </View>
                      <View style={{ flexDirection:"row", gap:10 }}>
                        <TouchableOpacity style={{ flex:1, paddingVertical:11, borderRadius:14, backgroundColor:"#F1F5F9", alignItems:"center" }}>
                          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:r.fs(13), color:"#64748B" }}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveJobId(job.id)}
                          style={{ flex:2, paddingVertical:11, borderRadius:14, backgroundColor:"#0F172A", alignItems:"center", flexDirection:"row", justifyContent:"center", gap:6 }}
                        >
                          <Zap size={14} color="#06B6D4" fill="#06B6D4" />
                          <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(13), color:"#fff" }}>Accept Job</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </MotiView>
                ))}
              </View>
            </MotiView>
          )}

          {/* OFFLINE NUDGE */}
          {!isOnline && (
            <MotiView from={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:400, type:"timing", duration:400 }}
              style={{ marginTop:28, backgroundColor:"#fff", borderRadius:20, padding:24, alignItems:"center", borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:10, elevation:2 }}
            >
              <Text style={{ fontSize:40, marginBottom:12 }}>😴</Text>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(16), color:"#0F172A", marginBottom:6, textAlign:"center" }}>You're currently offline</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:r.fs(13), color:"#94A3B8", textAlign:"center", lineHeight:20, marginBottom:20 }}>
                Toggle the switch above to go online{"\n"}and start receiving job requests.
              </Text>
              <TouchableOpacity onPress={() => setIsOnline(true)} style={{ backgroundColor:"#0F172A", paddingHorizontal:28, paddingVertical:12, borderRadius:16 }}>
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(14), color:"#06B6D4" }}>Go Online Now</Text>
              </TouchableOpacity>
            </MotiView>
          )}

          {/* RECENT JOBS */}
          <View style={{ marginTop:28 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(18), color:"#0F172A" }}>Recent Jobs</Text>
              <TouchableOpacity style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                <Text style={{ fontFamily: Typography.fonts.medium, fontSize:r.fs(13), color:"#3B82F6" }}>View all</Text>
                <ChevronRight size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            {RECENT_JOBS.map((job, i) => (
              <MotiView key={job.id} from={{ opacity:0, translateX:20 }} animate={{ opacity:1, translateX:0 }} transition={{ delay:i*80, type:"timing", duration:400 }}>
                <TouchableOpacity style={{ backgroundColor:"#fff", borderRadius:18, padding:16, flexDirection:"row", alignItems:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:10, elevation:2, borderWidth:1, borderColor:"#F1F5F9", marginBottom:10 }}>
                  <View style={{ width:46, height:46, borderRadius:15, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center", marginRight:14 }}>
                    <Text style={{ fontSize:22 }}>{job.emoji}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:r.fs(14), color:"#0F172A", marginBottom:2 }}>{job.service}</Text>
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize:r.fs(12), color:"#94A3B8" }}>{job.customer} · {job.date}</Text>
                  </View>
                  <View style={{ alignItems:"flex-end", gap:6 }}>
                    <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(14), color:"#10B981" }}>{job.price}</Text>
                    <View style={{ backgroundColor:"#ECFDF5", paddingHorizontal:8, paddingVertical:2, borderRadius:8 }}>
                      <Text style={{ fontFamily: Typography.fonts.medium, fontSize:10, color:"#10B981" }}>Completed</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>

          {/* PERFORMANCE */}
          <MotiView from={{ opacity:0, translateY:20 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:500, type:"timing", duration:500 }} style={{ marginTop:20, marginBottom:8 }}>
            <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
              style={{ borderRadius:24, padding:24, overflow:"hidden" }}>
              <View style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:60, backgroundColor:"rgba(6,182,212,0.08)" }} />
              <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(16), color:"#fff" }}>📈 Your Performance</Text>
                <View style={{ backgroundColor:"rgba(6,182,212,0.15)", paddingHorizontal:10, paddingVertical:4, borderRadius:20 }}>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:"#06B6D4" }}>This Week</Text>
                </View>
              </View>
              {[
                { label:"Completion Rate", value:"—%", color:"#06B6D4" },
                { label:"Avg. Response",   value:"—",  color:"#3B82F6" },
                { label:"Customer Rating", value:"—★", color:"#F59E0B" },
              ].map((item) => (
                <View key={item.label} style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:10, borderBottomWidth:1, borderBottomColor:"rgba(255,255,255,0.05)" }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                    <View style={{ width:6, height:6, borderRadius:3, backgroundColor:item.color }} />
                    <Text style={{ fontFamily: Typography.fonts.regular, fontSize:r.fs(13), color:"rgba(255,255,255,0.55)" }}>{item.label}</Text>
                  </View>
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize:r.fs(14), color:item.color }}>{item.value}</Text>
                </View>
              ))}
            </LinearGradient>
          </MotiView>

        </View>
      </ScrollView>
    </View>
  );
}