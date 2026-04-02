import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, useWindowDimensions,
  Modal, Animated, Pressable, ActivityIndicator,
  RefreshControl, Alert,
} from "react-native";
import { router }            from "expo-router";
import { LinearGradient }    from "expo-linear-gradient";
import {
  Bell, Star, TrendingUp, CheckCircle, Clock,
  MapPin, ChevronRight, Zap, DollarSign,
  Briefcase, AlertCircle, ThumbsUp, Navigation,
  Menu, X, Home, BookOpen, User, Settings,
  HelpCircle, LogOut, Shield, Wallet, BarChart2,
  MessageCircle, RefreshCw, Calendar, Building2,
} from "@/components/ui/lucide-icon";
import { useAuthStore }       from "@/store/authStore";
import { Typography }         from "@/theme/typography";
import { getProviderProfile } from "@/services/providerService";
import { extractApiMessage } from "@/services/api";
import { getOpenJobs, getBookings, pickJob, type ServiceRequest } from "@/services/bookingService";

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

/* ─── Drawer ─────────────────────────────────────────────────────── */
const DRAWER_MAIN = [
  { id:"dashboard", label:"Dashboard",  icon:Home,          route:"/(provider)/dashboard", color:"#06B6D4" },
  { id:"jobs",      label:"My Jobs",    icon:Briefcase,     route:"/(provider)/jobs",      color:"#3B82F6" },
  { id:"wallet",    label:"Wallet",     icon:Wallet,        route:"/(provider)/wallet",    color:"#F59E0B" },
  { id:"chat",      label:"Messages",   icon:MessageCircle, route:"/(provider)/chat",      color:"#8B5CF6" },
  { id:"profile",   label:"My Profile", icon:User,          route:"/(provider)/profile",   color:"#64748B" },
  { id:"offices",   label:"Our Offices", icon:Building2,     route:"/(provider)/offices",   color:"#06B6D4" },
];

function ProviderDrawer({ visible, onClose, user, activeRoute = "dashboard" }: {
  visible:boolean; onClose:()=>void; user:any; activeRoute?:string;
}) {
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const logout    = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue:0,    useNativeDriver:true, damping:20, stiffness:200 }),
        Animated.timing(fadeAnim,  { toValue:1,    duration:250, useNativeDriver:true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue:-320, duration:220, useNativeDriver:true }),
        Animated.timing(fadeAnim,  { toValue:0,    duration:200, useNativeDriver:true }),
      ]).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    onClose();
    await logout();
    setTimeout(() => router.replace("/(auth)/provider/login" as any), 250);
  };

  const firstName = user?.first_name ?? "Provider";
  const lastName  = user?.last_name  ?? "";
  const email     = user?.email      ?? "";
  const initials  = `${firstName[0]??'P'}${lastName[0]??''}`.toUpperCase();

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex:1 }}>
        <Animated.View style={{ position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(0,0,0,0.65)", opacity:fadeAnim }}>
          <Pressable style={{ flex:1 }} onPress={onClose} />
        </Animated.View>
        <Animated.View style={{ position:"absolute", top:0, left:0, bottom:0, width:300, backgroundColor:"#0F172A", transform:[{translateX:slideAnim}], shadowColor:"#000", shadowOffset:{width:8,height:0}, shadowOpacity:0.4, shadowRadius:24, elevation:20 }}>
          <View style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:80, backgroundColor:"rgba(6,182,212,0.06)" }} />
          <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
            style={{ paddingTop:Platform.OS==="android"?52:60, paddingBottom:28, paddingHorizontal:20, borderBottomWidth:1, borderBottomColor:"rgba(255,255,255,0.06)" }}>
            <TouchableOpacity onPress={onClose} style={{ position:"absolute", top:Platform.OS==="android"?48:56, right:16, width:34, height:34, borderRadius:10, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center" }}>
              <X size={17} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <View style={{ width:62, height:62, borderRadius:20, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center", marginBottom:14, borderWidth:2, borderColor:"rgba(6,182,212,0.35)" }}>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:22, color:"#06B6D4" }}>{initials}</Text>
            </View>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize:17, color:"#fff", marginBottom:3 }}>{firstName} {lastName}</Text>
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:12 }}>{email}</Text>
            <View style={{ flexDirection:"row", gap:8 }}>
              <View style={{ backgroundColor:"rgba(6,182,212,0.15)", paddingHorizontal:12, paddingVertical:5, borderRadius:20, borderWidth:1, borderColor:"rgba(6,182,212,0.25)" }}>
                <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:11, color:"#06B6D4" }}>🔧 Provider</Text>
              </View>
              <View style={{ backgroundColor:"rgba(16,185,129,0.15)", paddingHorizontal:12, paddingVertical:5, borderRadius:20, borderWidth:1, borderColor:"rgba(16,185,129,0.25)" }}>
                <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:11, color:"#10B981" }}>✓ Verified</Text>
              </View>
            </View>
          </LinearGradient>
          <ScrollView style={{ flex:1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop:16, paddingBottom:20 }}>
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:10, color:"rgba(255,255,255,0.25)", letterSpacing:1.3, marginLeft:20, marginBottom:8 }}>NAVIGATION</Text>
            {DRAWER_MAIN.map((item) => {
              const isActive = activeRoute === item.id;
              return (
                <TouchableOpacity key={item.id} onPress={() => { onClose(); setTimeout(() => router.push(item.route as any), 250); }} activeOpacity={0.75}
                  style={{ flexDirection:"row", alignItems:"center", marginHorizontal:12, marginBottom:3, paddingVertical:12, paddingHorizontal:14, borderRadius:14, backgroundColor:isActive?item.color+"18":"transparent" }}>
                  {isActive && <View style={{ position:"absolute", left:0, top:10, bottom:10, width:3, borderRadius:2, backgroundColor:item.color }} />}
                  <View style={{ width:36, height:36, borderRadius:11, backgroundColor:isActive?item.color+"22":"rgba(255,255,255,0.06)", alignItems:"center", justifyContent:"center", marginRight:13 }}>
                    <item.icon size={17} color={isActive?item.color:"rgba(255,255,255,0.45)"} />
                  </View>
                  <Text style={{ fontFamily:isActive?Typography.fonts.semibold:Typography.fonts.medium, fontSize:14, color:isActive?item.color:"rgba(255,255,255,0.65)", flex:1 }}>{item.label}</Text>
                  {isActive && <View style={{ width:6, height:6, borderRadius:3, backgroundColor:item.color }} />}
                </TouchableOpacity>
              );
            })}
            <View style={{ height:1, backgroundColor:"rgba(255,255,255,0.06)", marginHorizontal:20, marginTop:12, marginBottom:16 }} />
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.75}
              style={{ flexDirection:"row", alignItems:"center", marginHorizontal:12, paddingVertical:12, paddingHorizontal:14, borderRadius:14, backgroundColor:"rgba(239,68,68,0.1)" }}>
              <View style={{ width:36, height:36, borderRadius:11, backgroundColor:"rgba(239,68,68,0.15)", alignItems:"center", justifyContent:"center", marginRight:13 }}>
                <LogOut size={16} color="#EF4444" />
              </View>
              <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#EF4444" }}>Sign Out</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={{ paddingHorizontal:20, paddingBottom:Platform.OS==="android"?20:32, paddingTop:12, borderTopWidth:1, borderTopColor:"rgba(255,255,255,0.06)" }}>
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"rgba(255,255,255,0.2)", textAlign:"center" }}>SnapFix v1.0.0 · Provider App 🇪🇬</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ─── Pick feedback modal ─────────────────────────────────────────── */
function FeedbackModal({ data, onClose }: { data:{title:string;msg:string;ok:boolean}|null; onClose:()=>void }) {
  if (!data) return null;
  const emoji      = data.ok ? "✅" : data.title.includes("Active") ? "🚧" : data.title.includes("Available") ? "😔" : "⚠️";
  const headerBg   = data.ok ? "#10B981" : data.title.includes("Active") ? "#F59E0B" : "#EF4444";
  const boxBg      = data.ok ? "#ECFDF5" : data.title.includes("Active") ? "#FFFBEB" : "#FEF2F2";
  const boxBorder  = data.ok ? "#A7F3D0" : data.title.includes("Active") ? "#FDE68A" : "#FECACA";
  const textColor  = data.ok ? "#065F46" : data.title.includes("Active") ? "#92400E" : "#991B1B";
  const btnColor   = data.ok ? "#10B981" : data.title.includes("Active") ? "#F59E0B" : "#EF4444";

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.55)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, overflow:"hidden", shadowColor:"#000", shadowOffset:{width:0,height:12}, shadowOpacity:0.2, shadowRadius:32, elevation:16 }}>
          <View style={{ backgroundColor:headerBg, paddingVertical:28, alignItems:"center" }}>
            <Text style={{ fontSize:44 }}>{emoji}</Text>
          </View>
          <View style={{ padding:24 }}>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:12, textAlign:"center" }}>
              {data.title}
            </Text>
            <View style={{ backgroundColor:boxBg, borderRadius:14, padding:16, borderWidth:1.5, borderColor:boxBorder, marginBottom:20 }}>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:textColor, lineHeight:22, textAlign:"center" }}>
                {data.msg}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.88}
              style={{ paddingVertical:15, borderRadius:16, backgroundColor:btnColor, alignItems:"center" }}>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>
                {data.ok ? "Go to Jobs →" : "OK, Got it"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD - UPDATED VERSION
══════════════════════════════════════════════════════════════════ */
export default function ProviderDashboard() {
  const token   = useAuthStore((s) => s.token);
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile,    setProfile]    = useState<any>(null);
  const [openJobs,   setOpenJobs]   = useState<ServiceRequest[]>([]);
  const [recentJobs, setRecentJobs] = useState<ServiceRequest[]>([]);
  const [feedback,   setFeedback]   = useState<{title:string;msg:string;ok:boolean}|null>(null);
  const [picking,    setPicking]    = useState<string|null>(null);

  const r = useR();

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const [prof, open, jobs] = await Promise.all([
        getProviderProfile(token),
        getOpenJobs(token),
        getBookings(token),
      ]);
      setProfile(prof);
      setUser({ ...prof, role:"provider" } as any);
      setOpenJobs(open);
      // Recent = last 3 completed or in-progress jobs
      setRecentJobs(jobs.filter(j => ["completed","in_progress","confirmed"].includes(j.status)).slice(0, 3));
    } catch (err: any) {
      console.log("[Dashboard]", err?.data ?? err?.message);
    } finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePick = async (id: string) => {
    if (!token) return;
    setPicking(id);
    try {
      await pickJob(id, token);
      setOpenJobs(p => p.filter(j => j.id !== id));
      setFeedback({
        title: "Job Picked!",
        msg:   "The job is now in your Incoming tab. Go to Jobs and tap Accept to confirm it.",
        ok:    true,
      });
    } catch (err: any) {
      const status = err?.status;
      const d      = err?.data ?? {};

      const raw = extractApiMessage(d) !== "Something went wrong."
        ? extractApiMessage(d)
        : (err?.message ?? "");

      let title = "Cannot Pick Job";
      let msg   = raw;

      if (status === 404) {
        title = "Job No Longer Available \u{1F625}";
        msg   = "Another provider just picked this job. Try a different one.";
      } else if (status === 400) {
        const lower = (raw ?? "").toLowerCase();
        if (lower.includes("active") || lower.includes("already") || lower.includes("current")) {
          title = "You Already Have an Active Job";
          msg   = "You can only hold one active job at a time.\n\nFinish or cancel your current job first, then pick a new one.";
        } else if (lower.includes("verified")) {
          title = "Account Not Verified";
          msg   = "Your account must be verified before you can pick jobs.";
        } else {
          title = "Cannot Pick This Job";
          msg   = raw || "This job cannot be picked right now. Please try again.";
        }
      } else if (status === 401) {
        title = "Session Expired";
        msg   = "Please log out and log back in.";
      } else {
        title = "Something Went Wrong";
        msg   = raw || "Could not pick this job. Pull down to refresh and try again.";
      }

      setFeedback({ title, msg, ok: false });
    } finally { setPicking(null); }
  };

  const firstName = (user as any)?.first_name ?? profile?.first_name ?? "Provider";
  const h         = new Date().getHours();
  const greeting  = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";

  const centerWrap: any = r.isWeb
    ? { maxWidth:r.maxW, width:"100%", alignSelf:"center", paddingHorizontal:r.px }
    : { paddingHorizontal:r.px };

  /* UPDATED STATS - Using the correct fields from API response */
  const STATS = [
    { 
      label: "Total Earnings", 
      value: profile?.total_earnings ? `${parseFloat(profile.total_earnings).toFixed(0)} EGP` : "0 EGP",  
      icon: DollarSign,  
      color: "#10B981", 
      bg: "rgba(16,185,129,0.12)" 
    },
    { 
      label: "Jobs Completed",   
      value: profile?.completed_jobs ? `${profile.completed_jobs}` : "0",                            
      icon: CheckCircle, 
      color: "#3B82F6", 
      bg: "rgba(59,130,246,0.12)" 
    },
    { 
      label: "Rating",           
      value: profile?.rating ? `${parseFloat(profile.rating).toFixed(1)} ★` : "0.0 ★",                 
      icon: Star, 
      color: "#F59E0B", 
      bg: "rgba(245,158,11,0.12)"  
    },
    { 
      label: "Total Reviews",    
      value: profile?.total_reviews ? `${profile.total_reviews}` : "0",                        
      icon: ThumbsUp,    
      color: "#8B5CF6", 
      bg: "rgba(139,92,246,0.12)"  
    },
  ];

  const statusColor: Record<string,string> = {
    completed:"#10B981", in_progress:"#06B6D4", confirmed:"#8B5CF6",
    assigned:"#3B82F6", pending:"#F59E0B", cancelled:"#EF4444",
  };
  const statusLabel: Record<string,string> = {
    completed:"Completed", in_progress:"In Progress", confirmed:"Confirmed",
    assigned:"Assigned", pending:"Pending", cancelled:"Cancelled",
  };

  // Debug: Log profile data to console
  useEffect(() => {
    if (profile) {
      console.log("Profile Data:", {
        total_earnings: profile.total_earnings,
        completed_jobs: profile.completed_jobs,
        rating: profile.rating,
        total_reviews: profile.total_reviews,
      });
    }
  }, [profile]);

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ProviderDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} activeRoute="dashboard" />
      <FeedbackModal data={feedback} onClose={() => { setFeedback(null); if (feedback?.ok) router.push("/(provider)/jobs" as any); }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#06B6D4" colors={["#06B6D4"]} />}>

        {/* HEADER */}
        <LinearGradient colors={["#0F172A","#1E293B","#0F172A"]} start={{x:0,y:0}} end={{x:1,y:1}}
          style={{ paddingTop:Platform.OS==="web"?28:52, paddingBottom:32, borderBottomLeftRadius:r.isWeb?0:32, borderBottomRightRadius:r.isWeb?0:32, overflow:"hidden" }}>
          <View style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:100, backgroundColor:"rgba(6,182,212,0.08)" }} />
          <View style={centerWrap}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
                <TouchableOpacity onPress={() => setDrawerOpen(true)}
                  style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center" }}>
                  <Menu size={22} color="#fff" />
                </TouchableOpacity>
                <View>
                  <Text style={{ fontFamily:Typography.fonts.regular, fontSize:r.fs(13), color:"rgba(255,255,255,0.5)", marginBottom:2 }}>{greeting}, 👷</Text>
                  <Text style={{ fontFamily:Typography.fonts.extrabold, fontSize:r.fs(22), color:"#fff", lineHeight:28 }}>{firstName}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => fetchData(true)}
                style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center" }}>
                <RefreshCw size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <View style={centerWrap}>

          {/* STATS CARDS - Only 4 cards as requested */}
          {loading ? (
            <View style={{ alignItems:"center", paddingVertical:32 }}>
              <ActivityIndicator size="large" color="#06B6D4" />
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#94A3B8", marginTop:10 }}>Loading dashboard…</Text>
            </View>
          ) : (
            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:r.gap, marginTop:20 }}>
              {STATS.map(s => {
                const wPhone: any = (r.width - r.px * 2 - r.gap) / 2;
                return (
                  <View key={s.label} style={{ width: r.isWeb ? (r.width - r.px*2 - r.gap*3)/4 : wPhone }}>
                    <View style={{ backgroundColor:"#fff", borderRadius:20, padding:r.fs(16), shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:10, elevation:3, borderWidth:1, borderColor:"#F1F5F9" }}>
                      <View style={{ width:40, height:40, borderRadius:14, backgroundColor:s.bg, alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                        <s.icon size={20} color={s.color} />
                      </View>
                      <Text style={{ fontFamily:Typography.fonts.bold, fontSize:r.fs(20), color:"#0F172A", marginBottom:2 }}>{s.value}</Text>
                      <Text style={{ fontFamily:Typography.fonts.regular, fontSize:r.fs(11), color:"#94A3B8", lineHeight:15 }}>{s.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* OPEN JOBS SECTION */}
          {!loading && (
            <View style={{ marginTop:28 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                  <Text style={{ fontFamily:Typography.fonts.bold, fontSize:r.fs(18), color:"#0F172A" }}>Open Jobs</Text>
                  {openJobs.length > 0 && (
                    <View style={{ backgroundColor:"#EF4444", width:22, height:22, borderRadius:11, alignItems:"center", justifyContent:"center" }}>
                      <Text style={{ fontFamily:Typography.fonts.bold, fontSize:11, color:"#fff" }}>{openJobs.length}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => router.push("/(provider)/jobs" as any)} style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                  <Text style={{ fontFamily:Typography.fonts.medium, fontSize:13, color:"#3B82F6" }}>View all</Text>
                  <ChevronRight size={14} color="#3B82F6" />
                </TouchableOpacity>
              </View>

              {openJobs.length === 0 ? (
                <View style={{ backgroundColor:"#fff", borderRadius:20, padding:24, alignItems:"center", borderWidth:1, borderColor:"#F1F5F9" }}>
                  <Text style={{ fontSize:36, marginBottom:8 }}>🔍</Text>
                  <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:4 }}>No open jobs right now</Text>
                  <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#94A3B8", textAlign:"center" }}>New requests will appear here. Pull down to refresh.</Text>
                </View>
              ) : (
                openJobs.slice(0, 3).map(job => (
                  <View key={job.id} style={{ backgroundColor:"#fff", borderRadius:20, padding:18, marginBottom:12, shadowColor:"#1E3A8A", shadowOffset:{width:0,height:4}, shadowOpacity:0.08, shadowRadius:14, elevation:4, borderWidth:1.5, borderColor:job.is_urgent?"#FEE2E2":"#F1F5F9" }}>
                    {job.is_urgent && (
                      <View style={{ flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#FEF2F2", paddingHorizontal:10, paddingVertical:4, borderRadius:20, alignSelf:"flex-start", marginBottom:12 }}>
                        <AlertCircle size={12} color="#EF4444" />
                        <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:10, color:"#EF4444" }}>URGENT</Text>
                      </View>
                    )}

                    <View style={{ flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                      <View style={{ flex:1, marginRight:10 }}>
                        <Text style={{ fontFamily:Typography.fonts.bold, fontSize:r.fs(15), color:"#0F172A", marginBottom:3 }} numberOfLines={1}>{job.title}</Text>
                        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#94A3B8" }}>{job.category?.name}</Text>
                      </View>
                      {job.estimated_price && (
                        <Text style={{ fontFamily:Typography.fonts.bold, fontSize:r.fs(15), color:"#10B981" }}>{job.estimated_price} EGP</Text>
                      )}
                    </View>

                    <View style={{ flexDirection:"row", gap:14, flexWrap:"wrap", marginBottom:14 }}>
                      {job.region?.name && <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                        <MapPin size={12} color="#94A3B8" />
                        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B" }}>{job.region.name}</Text>
                      </View>}
                      <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                        <Calendar size={12} color="#94A3B8" />
                        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B" }}>{job.preferred_date}</Text>
                      </View>
                      <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                        <Clock size={12} color="#94A3B8" />
                        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B" }}>{job.preferred_time?.slice(0,5)}</Text>
                      </View>
                    </View>

                    <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#475569", lineHeight:20, marginBottom:14 }} numberOfLines={2}>{job.description}</Text>

                    <TouchableOpacity onPress={() => handlePick(job.id)} disabled={picking === job.id} activeOpacity={0.88}
                      style={{ borderRadius:14, overflow:"hidden", opacity:picking===job.id?0.7:1 }}>
                      <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:0}}
                        style={{ paddingVertical:12, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 }}>
                        {picking === job.id
                          ? <ActivityIndicator size="small" color="#06B6D4" />
                          : <><Zap size={16} color="#06B6D4" fill="#06B6D4" /><Text style={{ fontFamily:Typography.fonts.bold, fontSize:14, color:"#fff" }}>Pick This Job</Text></>
                        }
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* RECENT JOBS SECTION */}
          {!loading && (
            <View style={{ marginTop:28, marginBottom:20 }}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <Text style={{ fontFamily:Typography.fonts.bold, fontSize:r.fs(18), color:"#0F172A" }}>Recent Jobs</Text>
                <TouchableOpacity onPress={() => router.push("/(provider)/jobs" as any)} style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                  <Text style={{ fontFamily:Typography.fonts.medium, fontSize:r.fs(13), color:"#3B82F6" }}>View all</Text>
                  <ChevronRight size={14} color="#3B82F6" />
                </TouchableOpacity>
              </View>

              {recentJobs.length === 0 ? (
                <View style={{ backgroundColor:"#fff", borderRadius:20, padding:24, alignItems:"center", borderWidth:1, borderColor:"#F1F5F9" }}>
                  <Text style={{ fontSize:36, marginBottom:8 }}>🗂️</Text>
                  <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:4 }}>No recent jobs</Text>
                  <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#94A3B8", textAlign:"center" }}>Your completed and active jobs will appear here.</Text>
                </View>
              ) : (
                recentJobs.map(job => (
                  <TouchableOpacity key={job.id} onPress={() => router.push(`/(provider)/jobs/${job.id}` as any)}
                    style={{ backgroundColor:"#fff", borderRadius:18, padding:16, flexDirection:"row", alignItems:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:10, elevation:2, borderWidth:1, borderColor:"#F1F5F9", marginBottom:10 }}>
                    <View style={{ width:46, height:46, borderRadius:15, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center", marginRight:14 }}>
                      <Briefcase size={20} color="#64748B" />
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:r.fs(14), color:"#0F172A", marginBottom:2 }} numberOfLines={1}>{job.title}</Text>
                      <Text style={{ fontFamily:Typography.fonts.regular, fontSize:r.fs(12), color:"#94A3B8" }}>{job.category?.name} · {job.preferred_date}</Text>
                    </View>
                    <View style={{ alignItems:"flex-end", gap:6 }}>
                      {job.final_price && <Text style={{ fontFamily:Typography.fonts.bold, fontSize:r.fs(14), color:"#10B981" }}>{job.final_price} EGP</Text>}
                      <View style={{ backgroundColor:(statusColor[job.status]??'#94A3B8')+"20", paddingHorizontal:8, paddingVertical:2, borderRadius:8 }}>
                        <Text style={{ fontFamily:Typography.fonts.medium, fontSize:10, color:statusColor[job.status]??'#94A3B8' }}>
                          {statusLabel[job.status]??job.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* REMOVED: The entire Performance Card with toggle is GONE */}

        </View>
      </ScrollView>
    </View>
  );
}