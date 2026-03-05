import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, StatusBar, Platform, useWindowDimensions,
} from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell, Star, TrendingUp, CheckCircle, Clock,
  MapPin, ChevronRight, Zap, DollarSign,
  Briefcase, AlertCircle, ThumbsUp, Navigation,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";

/* ─── Responsive ─────────────────────────────────────────────────────────────── */
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

/* ─── Mock Data ──────────────────────────────────────────────────────────────── */
const STATS = [
  { label: "Today's Earnings", value: "0 EGP",  icon: DollarSign, color: "#10B981", bg: "#ECFDF5" },
  { label: "Jobs Done",        value: "0",       icon: CheckCircle,color: "#3B82F6", bg: "#EFF6FF" },
  { label: "Rating",           value: "—",       icon: Star,       color: "#F59E0B", bg: "#FFFBEB" },
  { label: "Response Rate",    value: "—",       icon: ThumbsUp,   color: "#8B5CF6", bg: "#F5F3FF" },
];

const JOB_REQUESTS = [
  {
    id: "1",
    customerName:  "Sara Ahmed",
    customerAvatar:"SA",
    avatarColor:   "#EC4899",
    service:       "AC Repair",
    emoji:         "❄️",
    address:       "Dokki, Giza",
    distance:      "2.3 km",
    price:         "250 EGP",
    urgency:       "urgent" as const,
    postedAt:      "2 min ago",
    timer:         45,
  },
  {
    id: "2",
    customerName:  "Omar Khalil",
    customerAvatar:"OK",
    avatarColor:   "#3B82F6",
    service:       "Electrical",
    emoji:         "⚡",
    address:       "Maadi, Cairo",
    distance:      "4.1 km",
    price:         "180 EGP",
    urgency:       "normal" as const,
    postedAt:      "8 min ago",
    timer:         120,
  },
];

const RECENT_JOBS = [
  { id:"1", service:"Plumbing",   customer:"Ahmed M.", price:"320 EGP", status:"completed", date:"Today, 10:30 AM",  emoji:"🔧" },
  { id:"2", service:"Electrical", customer:"Sara K.",  price:"200 EGP", status:"completed", date:"Today, 8:00 AM",   emoji:"⚡" },
  { id:"3", service:"AC Repair",  customer:"Mona S.",  price:"450 EGP", status:"completed", date:"Yesterday, 3 PM",  emoji:"❄️" },
];

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════════ */
export default function ProviderDashboard() {
  const [isOnline,    setIsOnline]    = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ══ HEADER ══ */}
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#0F172A"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            paddingTop:              Platform.OS === "web" ? 28 : 52,
            paddingBottom:           32,
            borderBottomLeftRadius:  r.isWeb ? 0 : 32,
            borderBottomRightRadius: r.isWeb ? 0 : 32,
            overflow: "hidden",
          }}
        >
          {/* Glow blobs */}
          <View style={{ position:"absolute", top:-60, right:-60, width:200, height:200, borderRadius:100, backgroundColor:"rgba(6,182,212,0.08)" }} />
          <View style={{ position:"absolute", bottom:-40, left:-40, width:160, height:160, borderRadius:80,  backgroundColor:"rgba(59,130,246,0.06)" }} />

          <View style={centerWrap}>
            {/* Top Row */}
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              {/* Greeting */}
              <MotiView from={{ opacity:0, translateY:-10 }} animate={{ opacity:1, translateY:0 }} transition={{ type:"timing", duration:500 }}>
                <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(13), color:"rgba(255,255,255,0.5)", marginBottom:2 }}>{greeting}, 👷</Text>
                <Text style={{ fontFamily:"Poppins_800ExtraBold", fontSize:r.fs(22), color:"#fff", lineHeight:28 }}>{firstName}</Text>
              </MotiView>

              <View style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                {/* Bell */}
                <TouchableOpacity style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center" }}>
                  <Bell size={20} color="#fff" />
                  <View style={{ position:"absolute", top:9, right:9, width:8, height:8, borderRadius:4, backgroundColor:"#06B6D4", borderWidth:1.5, borderColor:"#0F172A" }} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── ONLINE TOGGLE CARD ── */}
            <MotiView from={{ opacity:0, translateY:16 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:150, type:"timing", duration:500 }}>
              <View style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius:    20,
                padding:         20,
                borderWidth:     1,
                borderColor:     isOnline ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.08)",
              }}>
                <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
                  <View style={{ flex:1 }}>
                    {/* Status dot + label */}
                    <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:4 }}>
                      <MotiView
                        animate={{ scale: isOnline ? [1, 1.3, 1] : 1, opacity: isOnline ? 1 : 0.4 }}
                        transition={{ loop: isOnline, type:"timing", duration:1200 }}
                        style={{ width:10, height:10, borderRadius:5, backgroundColor: isOnline ? "#06B6D4" : "#475569" }}
                      />
                      <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(16), color: isOnline ? "#06B6D4" : "#94A3B8" }}>
                        {isOnline ? "Online" : "Offline"}
                      </Text>
                    </View>
                    <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"rgba(255,255,255,0.45)", lineHeight:18 }}>
                      {isOnline
                        ? "You're receiving job requests"
                        : "Toggle on to start receiving jobs"}
                    </Text>
                  </View>

                  <Switch
                    value={isOnline}
                    onValueChange={setIsOnline}
                    trackColor={{ false: "#334155", true: "#06B6D4" }}
                    thumbColor={isOnline ? "#fff" : "#94A3B8"}
                    ios_backgroundColor="#334155"
                    style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
                  />
                </View>

                {/* Earnings today preview */}
                {isOnline && (
                  <MotiView from={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" as any }} transition={{ type:"timing", duration:300 }}
                    style={{ marginTop:16, paddingTop:16, borderTopWidth:1, borderTopColor:"rgba(255,255,255,0.08)", flexDirection:"row", justifyContent:"space-around" }}>
                    {[
                      { label:"Today", value:"0 EGP", icon:DollarSign },
                      { label:"Active Jobs", value:"0", icon:Briefcase },
                      { label:"In Queue", value:`${JOB_REQUESTS.length}`, icon:Clock },
                    ].map((item) => (
                      <View key={item.label} style={{ alignItems:"center" }}>
                        <item.icon size={16} color="#06B6D4" style={{ marginBottom:4 }} />
                        <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(15), color:"#fff" }}>{item.value}</Text>
                        <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(10), color:"rgba(255,255,255,0.4)" }}>{item.label}</Text>
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

          {/* STATS GRID */}
          <MotiView from={{ opacity:0, translateY:20 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:200, type:"timing", duration:500 }}
            style={{ flexDirection:"row", flexWrap:"wrap", gap:r.gap, marginTop:20 }}>
            {STATS.map((s, i) => {
              const w: any = r.cols2
                ? Platform.OS === "web"
                  ? `calc(50% - ${r.gap / 2}px)`
                  : (r.width - r.px * 2 - r.gap) / 2
                : `calc(50% - ${r.gap / 2}px)`;
              // always 2-col on phone too for stats
              const wPhone: any = (r.width - r.px * 2 - r.gap) / 2;

              return (
                <MotiView key={s.label} from={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*60, type:"spring", damping:14 }}
                  style={{ width: r.isWeb ? w : wPhone }}>
                  <View style={{ backgroundColor:"#fff", borderRadius:20, padding:r.fs(16), shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:10, elevation:3, borderWidth:1, borderColor:"#F1F5F9" }}>
                    <View style={{ width:40, height:40, borderRadius:14, backgroundColor:s.bg, alignItems:"center", justifyContent:"center", marginBottom:10 }}>
                      <s.icon size={20} color={s.color} />
                    </View>
                    <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(20), color:"#0F172A", marginBottom:2 }}>{s.value}</Text>
                    <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(11), color:"#94A3B8", lineHeight:15 }}>{s.label}</Text>
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
                  <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(18), color:"#0F172A" }}>New Requests</Text>
                  {JOB_REQUESTS.length > 0 && (
                    <View style={{ backgroundColor:"#EF4444", width:22, height:22, borderRadius:11, alignItems:"center", justifyContent:"center" }}>
                      <Text style={{ fontFamily:"Poppins_700Bold", fontSize:11, color:"#fff" }}>{JOB_REQUESTS.length}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={{ flexDirection:"row", flexWrap:"wrap", gap:r.gap }}>
                {JOB_REQUESTS.map((job, i) => {
                  const cardW: any = r.cols2
                    ? Platform.OS === "web"
                      ? `calc(50% - ${r.gap / 2}px)`
                      : (r.width - r.px * 2 - r.gap) / 2
                    : "100%";

                  return (
                    <MotiView key={job.id} from={{ opacity:0, translateY:20 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:i*100, type:"timing", duration:400 }}
                      style={{ width: r.isTablet || r.isWeb ? cardW : "100%" }}>
                      <View style={{
                        backgroundColor: "#fff", borderRadius:20, padding:18,
                        shadowColor:"#1E3A8A", shadowOffset:{width:0,height:4},
                        shadowOpacity:0.08, shadowRadius:14, elevation:4,
                        borderWidth:1.5,
                        borderColor: job.urgency === "urgent" ? "#FEE2E2" : "#F1F5F9",
                        marginBottom: 0,
                      }}>
                        {/* Urgency badge */}
                        {job.urgency === "urgent" && (
                          <View style={{ flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#FEF2F2", paddingHorizontal:10, paddingVertical:4, borderRadius:20, alignSelf:"flex-start", marginBottom:12 }}>
                            <AlertCircle size={12} color="#EF4444" />
                            <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:10, color:"#EF4444" }}>URGENT</Text>
                          </View>
                        )}

                        {/* Customer row */}
                        <View style={{ flexDirection:"row", alignItems:"center", marginBottom:12 }}>
                          <View style={{ width:44, height:44, borderRadius:14, backgroundColor:job.avatarColor+"22", alignItems:"center", justifyContent:"center", marginRight:12 }}>
                            <Text style={{ fontFamily:"Poppins_700Bold", fontSize:14, color:job.avatarColor }}>{job.customerAvatar}</Text>
                          </View>
                          <View style={{ flex:1 }}>
                            <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:r.fs(14), color:"#0F172A" }}>{job.customerName}</Text>
                            <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#94A3B8" }}>{job.postedAt}</Text>
                          </View>
                          <View style={{ alignItems:"flex-end" }}>
                            <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(16), color:"#10B981" }}>{job.price}</Text>
                          </View>
                        </View>

                        {/* Service */}
                        <View style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#F8FAFC", borderRadius:12, padding:10, marginBottom:12 }}>
                          <Text style={{ fontSize:20 }}>{job.emoji}</Text>
                          <View>
                            <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:r.fs(14), color:"#0F172A" }}>{job.service}</Text>
                            <View style={{ flexDirection:"row", alignItems:"center", gap:4, marginTop:2 }}>
                              <MapPin size={11} color="#94A3B8" />
                              <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(11), color:"#94A3B8" }}>{job.address}</Text>
                              <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(11), color:"#CBD5E1" }}>·</Text>
                              <Navigation size={11} color="#3B82F6" />
                              <Text style={{ fontFamily:"Poppins_500Medium", fontSize:r.fs(11), color:"#3B82F6" }}>{job.distance}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Timer bar */}
                        <View style={{ height:3, backgroundColor:"#F1F5F9", borderRadius:2, marginBottom:14, overflow:"hidden" }}>
                          <MotiView
                            from={{ width:"100%" }}
                            animate={{ width:"0%" }}
                            transition={{ type:"timing", duration: job.timer * 1000, loop:false }}
                            style={{ height:"100%", backgroundColor: job.urgency === "urgent" ? "#EF4444" : "#06B6D4", borderRadius:2 }}
                          />
                        </View>

                        {/* Buttons */}
                        <View style={{ flexDirection:"row", gap:10 }}>
                          <TouchableOpacity style={{ flex:1, paddingVertical:11, borderRadius:14, backgroundColor:"#F1F5F9", alignItems:"center" }}>
                            <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:r.fs(13), color:"#64748B" }}>Decline</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setActiveJobId(job.id)}
                            style={{ flex:2, paddingVertical:11, borderRadius:14, backgroundColor:"#0F172A", alignItems:"center", flexDirection:"row", justifyContent:"center", gap:6 }}
                          >
                            <Zap size={14} color="#06B6D4" fill="#06B6D4" />
                            <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(13), color:"#fff" }}>Accept Job</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </MotiView>
                  );
                })}
              </View>
            </MotiView>
          )}

          {/* OFFLINE NUDGE */}
          {!isOnline && (
            <MotiView from={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:400, type:"timing", duration:400 }}
              style={{ marginTop:28, backgroundColor:"#fff", borderRadius:20, padding:24, alignItems:"center", borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:10, elevation:2 }}>
              <Text style={{ fontSize:40, marginBottom:12 }}>😴</Text>
              <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(16), color:"#0F172A", marginBottom:6, textAlign:"center" }}>You're currently offline</Text>
              <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(13), color:"#94A3B8", textAlign:"center", lineHeight:20, marginBottom:20 }}>
                Toggle the switch above to go online{"\n"}and start receiving job requests.
              </Text>
              <TouchableOpacity
                onPress={() => setIsOnline(true)}
                style={{ backgroundColor:"#0F172A", paddingHorizontal:28, paddingVertical:12, borderRadius:16 }}
              >
                <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(14), color:"#06B6D4" }}>Go Online Now</Text>
              </TouchableOpacity>
            </MotiView>
          )}

          {/* RECENT JOBS */}
          <View style={{ marginTop:28 }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(18), color:"#0F172A" }}>Recent Jobs</Text>
              <TouchableOpacity style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                <Text style={{ fontFamily:"Poppins_500Medium", fontSize:r.fs(13), color:"#3B82F6" }}>View all</Text>
                <ChevronRight size={14} color="#3B82F6" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection:"row", flexWrap:"wrap", gap:r.gap }}>
              {RECENT_JOBS.map((job, i) => {
                const cardW: any = r.cols2
                  ? Platform.OS === "web"
                    ? `calc(50% - ${r.gap / 2}px)`
                    : (r.width - r.px * 2 - r.gap) / 2
                  : "100%";

                return (
                  <MotiView key={job.id} from={{ opacity:0, translateX:20 }} animate={{ opacity:1, translateX:0 }} transition={{ delay:i*80, type:"timing", duration:400 }}
                    style={{ width: r.isTablet || r.isWeb ? cardW : "100%" }}>
                    <TouchableOpacity style={{ backgroundColor:"#fff", borderRadius:18, padding:16, flexDirection:"row", alignItems:"center", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:10, elevation:2, borderWidth:1, borderColor:"#F1F5F9", marginBottom:0 }}>
                      <View style={{ width:46, height:46, borderRadius:15, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center", marginRight:14 }}>
                        <Text style={{ fontSize:22 }}>{job.emoji}</Text>
                      </View>
                      <View style={{ flex:1 }}>
                        <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:r.fs(14), color:"#0F172A", marginBottom:2 }}>{job.service}</Text>
                        <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(12), color:"#94A3B8" }}>{job.customer} · {job.date}</Text>
                      </View>
                      <View style={{ alignItems:"flex-end", gap:6 }}>
                        <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(14), color:"#10B981" }}>{job.price}</Text>
                        <View style={{ backgroundColor:"#ECFDF5", paddingHorizontal:8, paddingVertical:2, borderRadius:8 }}>
                          <Text style={{ fontFamily:"Poppins_500Medium", fontSize:10, color:"#10B981" }}>Completed</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </MotiView>
                );
              })}
            </View>
          </View>

          {/* PERFORMANCE CARD */}
          <MotiView from={{ opacity:0, translateY:20 }} animate={{ opacity:1, translateY:0 }} transition={{ delay:500, type:"timing", duration:500 }} style={{ marginTop:28 }}>
            <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
              style={{ borderRadius:24, padding:24, overflow:"hidden" }}>
              <View style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:60, backgroundColor:"rgba(6,182,212,0.08)" }} />
              <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(16), color:"#fff" }}>📈 Your Performance</Text>
                <View style={{ backgroundColor:"rgba(6,182,212,0.15)", paddingHorizontal:10, paddingVertical:4, borderRadius:20 }}>
                  <Text style={{ fontFamily:"Poppins_600SemiBold", fontSize:11, color:"#06B6D4" }}>This Week</Text>
                </View>
              </View>
              {[
                { label:"Completion Rate", value:"—%",  color:"#06B6D4" },
                { label:"Avg. Response",   value:"—",   color:"#3B82F6" },
                { label:"Customer Rating", value:"—★",  color:"#F59E0B" },
              ].map((item) => (
                <View key={item.label} style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:10, borderBottomWidth:1, borderBottomColor:"rgba(255,255,255,0.05)" }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                    <View style={{ width:6, height:6, borderRadius:3, backgroundColor:item.color }} />
                    <Text style={{ fontFamily:"Poppins_400Regular", fontSize:r.fs(13), color:"rgba(255,255,255,0.6)" }}>{item.label}</Text>
                  </View>
                  <Text style={{ fontFamily:"Poppins_700Bold", fontSize:r.fs(14), color:item.color }}>{item.value}</Text>
                </View>
              ))}
            </LinearGradient>
          </MotiView>

        </View>
      </ScrollView>
    </View>
  );
}