import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StatusBar, Platform, Animated, Easing, ActivityIndicator,
  Linking,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Location      from "expo-location";
import {
  Clock, Shield, CheckCircle, ArrowLeft, RefreshCw,
  Mail, XCircle, Building2, MapPin, Navigation,
  LocateFixed, Star, AlertCircle, Info,
} from "@/components/ui/lucide-icon";
import { Typography }         from "@/theme/typography";
import { useAuthStore }       from "@/store/authStore";
import { getProviderProfile } from "@/services/providerService";
import {
  getOffices, getOfficeById, getNearestOffice,
  type Office,
} from "@/services/coreService";

/* ─── Helpers ─────────────────────────────────────────────────── */
function getApiError(err: any, fallback = "Something went wrong."): string {
  const tryExtract = (v: any): string => {
    if (!v) return "";
    if (Array.isArray(v) && v.length > 0) return String(v[0]);
    if (typeof v === "string" && v && !v.startsWith("API Error")) return v;
    if (typeof v === "object" && !Array.isArray(v)) {
      if (v.detail)           return tryExtract(v.detail);
      if (v.non_field_errors) return tryExtract(v.non_field_errors);
      for (const val of Object.values(v)) { const s = tryExtract(val); if (s) return s; }
    }
    return "";
  };
  return tryExtract(err?.data) || fallback;
}

function openMaps(lat: string, lng: string, name: string) {
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`).catch(() => {});
}

/* ─── Feedback modal ──────────────────────────────────────────── */
function FeedbackModal({ ok, title, msg, onClose, onAction, actionLabel }: {
  ok:boolean; title:string; msg:string; onClose:()=>void; onAction?:()=>void; actionLabel?:string;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, overflow:"hidden" }}>
          <View style={{ backgroundColor:ok?"#10B981":"#EF4444", paddingVertical:20, alignItems:"center" }}>
            <Text style={{ fontSize:40 }}>{ok?"✅":"⚠️"}</Text>
          </View>
          <View style={{ padding:24, alignItems:"center" }}>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:10, textAlign:"center" }}>{title}</Text>
            <View style={{ backgroundColor:ok?"#ECFDF5":"#FEF2F2", borderRadius:14, padding:14, borderWidth:1, borderColor:ok?"#A7F3D0":"#FECACA", marginBottom:20, width:"100%" }}>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:ok?"#065F46":"#991B1B", textAlign:"center", lineHeight:22 }}>{msg}</Text>
            </View>
            {onAction && actionLabel && (
              <TouchableOpacity onPress={onAction} style={{ width:"100%", paddingVertical:14, borderRadius:16, backgroundColor:ok?"#10B981":"#0F172A", alignItems:"center", marginBottom:10 }}>
                <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>{actionLabel}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={{ width:"100%", paddingVertical:14, borderRadius:16, backgroundColor:"#F1F5F9", alignItems:"center" }}>
              <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:15, color:"#64748B" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Office detail bottom sheet ──────────────────────────────── */
function OfficeDetailSheet({ office, onClose }: { office: Office | null; onClose: () => void }) {
  const token = useAuthStore((s) => s.token);
  const [detail,  setDetail]  = useState<Office | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!office) { setDetail(null); return; }
    setLoading(true);
    getOfficeById(office.id, token ?? undefined)
      .then(setDetail)
      .catch(() => setDetail(office)) // fallback to list data
      .finally(() => setLoading(false));
  }, [office?.id]);

  if (!office) return null;
  const o = detail ?? office;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.55)", justifyContent:"flex-end" }}>
        <TouchableOpacity style={{ flex:1 }} onPress={onClose} activeOpacity={1} />
        <View style={{ backgroundColor:"#fff", borderTopLeftRadius:28, borderTopRightRadius:28, overflow:"hidden", maxHeight:"80%" }}>
          <View style={{ width:40, height:4, borderRadius:2, backgroundColor:"#E2E8F0", alignSelf:"center", marginTop:12, marginBottom:4 }} />

          <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
            style={{ paddingHorizontal:20, paddingTop:16, paddingBottom:20 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
              <View style={{ width:46, height:46, borderRadius:14, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center" }}>
                <Building2 size={22} color="#06B6D4" />
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:Typography.fonts.bold, fontSize:17, color:"#fff" }}>{o.name}</Text>
                <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"rgba(255,255,255,0.45)", marginTop:2 }}>
                  {o.region?.name ?? o.region_name ?? ""}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}
                style={{ width:34, height:34, borderRadius:10, backgroundColor:"rgba(255,255,255,0.1)", alignItems:"center", justifyContent:"center" }}>
                <Text style={{ fontSize:16, color:"rgba(255,255,255,0.7)" }}>✕</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {loading ? (
            <View style={{ padding:40, alignItems:"center" }}>
              <ActivityIndicator size="large" color="#06B6D4" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding:20, paddingBottom:Platform.OS==="ios"?40:24 }} showsVerticalScrollIndicator={false}>
              {/* Address */}
              <View style={{ flexDirection:"row", alignItems:"flex-start", gap:12, marginBottom:16 }}>
                <View style={{ width:36, height:36, borderRadius:11, backgroundColor:"#FEF2F2", alignItems:"center", justifyContent:"center" }}>
                  <MapPin size={16} color="#EF4444" />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#94A3B8", marginBottom:2 }}>Address</Text>
                  <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#0F172A", lineHeight:20 }}>{o.address}</Text>
                  {o.landmark ? <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B", marginTop:3 }}>📍 {o.landmark}</Text> : null}
                </View>
              </View>

              {/* Working hours */}
              {o.working_hours && (
                <View style={{ flexDirection:"row", alignItems:"flex-start", gap:12, marginBottom:16 }}>
                  <View style={{ width:36, height:36, borderRadius:11, backgroundColor:"#ECFDF5", alignItems:"center", justifyContent:"center" }}>
                    <Clock size={16} color="#10B981" />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#94A3B8", marginBottom:2 }}>Working Hours</Text>
                    <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#0F172A" }}>{o.working_hours}</Text>
                  </View>
                </View>
              )}

              {/* Region */}
              {(o.region?.name ?? o.region_name) && (
                <View style={{ flexDirection:"row", alignItems:"flex-start", gap:12, marginBottom:16 }}>
                  <View style={{ width:36, height:36, borderRadius:11, backgroundColor:"#EFF6FF", alignItems:"center", justifyContent:"center" }}>
                    <Building2 size={16} color="#3B82F6" />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#94A3B8", marginBottom:2 }}>Region</Text>
                    <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#0F172A" }}>{o.region?.name ?? o.region_name}</Text>
                  </View>
                </View>
              )}

              {/* Distance */}
              {o.distance_km !== undefined && (
                <View style={{ flexDirection:"row", alignItems:"flex-start", gap:12, marginBottom:16 }}>
                  <View style={{ width:36, height:36, borderRadius:11, backgroundColor:"#ECFEFF", alignItems:"center", justifyContent:"center" }}>
                    <Navigation size={16} color="#06B6D4" />
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#94A3B8", marginBottom:2 }}>Distance from you</Text>
                    <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#0F172A" }}>{o.distance_km.toFixed(2)} km away</Text>
                  </View>
                </View>
              )}

              {/* Directions */}
              {o.latitude && o.longitude && (
                <TouchableOpacity onPress={() => openMaps(o.latitude, o.longitude, o.name)}
                  activeOpacity={0.85} style={{ borderRadius:16, overflow:"hidden", marginBottom:10 }}>
                  <LinearGradient colors={["#1E3A8A","#2563EB"]} start={{x:0,y:0}} end={{x:1,y:0}}
                    style={{ paddingVertical:14, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <Navigation size={16} color="#fff" />
                    <Text style={{ fontFamily:Typography.fonts.bold, fontSize:14, color:"#fff" }}>Get Directions</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={onClose}
                style={{ paddingVertical:14, borderRadius:16, backgroundColor:"#F1F5F9", alignItems:"center" }}>
                <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ─── Spinning clock ──────────────────────────────────────────── */
function SpinningClock() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(rot, { toValue:1, duration:8000, easing:Easing.linear, useNativeDriver:true })).start();
  }, []);
  return (
    <Animated.View style={{ transform:[{ rotate: rot.interpolate({ inputRange:[0,1], outputRange:["0deg","360deg"] }) }] }}>
      <Clock size={44} color="#06B6D4" />
    </Animated.View>
  );
}

function Step({ icon, title, subtitle, done }: { icon:any; title:string; subtitle:string; done:boolean }) {
  return (
    <View style={{ flexDirection:"row", alignItems:"flex-start", gap:14, marginBottom:20 }}>
      <View style={{ width:44, height:44, borderRadius:14, backgroundColor:done?"#ECFDF5":"#EFF6FF", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:done?"#A7F3D0":"#BFDBFE" }}>
        {done ? <CheckCircle size={20} color="#10B981" fill="#10B981" /> : React.createElement(icon, { size:20, color:"#3B82F6" })}
      </View>
      <View style={{ flex:1, paddingTop:2 }}>
        <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:15, color:"#0F172A", marginBottom:2 }}>{title}</Text>
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#64748B", lineHeight:18 }}>{subtitle}</Text>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════ */
export default function ProviderPendingScreen() {
  const token   = useAuthStore((s) => s.token);
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const [checking,      setChecking]      = useState(false);
  const [feedback,      setFeedback]      = useState<{ok:boolean;title:string;msg:string;action?:()=>void;actionLabel?:string}|null>(null);
  const [offices,       setOffices]       = useState<Office[]>([]);
  const [officesLoading,setOfficesLoading]= useState(true);
  const [nearest,       setNearest]       = useState<Office | null>(null);
  const [selectedOffice,setSelectedOffice]= useState<Office | null>(null);
  const [locLoading,    setLocLoading]    = useState(false);
  const [hasLocation,   setHasLocation]   = useState(false);
  const [locDenied,     setLocDenied]     = useState(false);

  const isRejected = (user as any)?.verification_status === "rejected";
  const firstName  = (user as any)?.first_name ?? "Provider";
  const email      = (user as any)?.email ?? "";

  // Fetch all offices on mount
  useEffect(() => {
    getOffices(token ?? undefined)
      .then(setOffices)
      .catch(() => {})
      .finally(() => setOfficesLoading(false));

    // Auto-fetch nearest if permission already granted
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      if (status === "granted") fetchNearest();
    });
  }, []);

  const fetchNearest = useCallback(async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocDenied(true); setLocLoading(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setHasLocation(true);
      const office = await getNearestOffice(pos.coords.latitude, pos.coords.longitude, token ?? undefined);
      setNearest(office);
    } catch { setNearest(null); }
    finally { setLocLoading(false); }
  }, [token]);

  const handleCheckAgain = async () => {
    if (!token) { router.replace("/(auth)/provider/login" as any); return; }
    setChecking(true);
    try {
      const profile = await getProviderProfile(token);
      setUser({ ...profile, role:"provider" } as any);
      const status = profile?.verification_status ?? "pending";
      if (status === "verified") {
        setFeedback({ ok:true, title:"Account Verified! 🎉", msg:"Your account has been verified. You can now access your dashboard.", action:() => router.replace("/(provider)/dashboard" as any), actionLabel:"Go to Dashboard →" });
      } else if (status === "rejected") {
        setFeedback({ ok:false, title:"Account Rejected", msg:"Your account was not approved. Please contact support@snapfix.eg." });
      } else {
        setFeedback({ ok:false, title:"Still Under Review", msg:"Your account is still being reviewed. This typically takes 24–48 hours. We'll email you once approved." });
      }
    } catch (err: any) {
      setFeedback({ ok:false, title:"Check Failed", msg:getApiError(err, "Could not check status. Please try again.") });
    } finally { setChecking(false); }
  };

  const handleLogout = async () => { await logout(); router.replace("/(auth)/provider/login" as any); };

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {feedback && (
        <FeedbackModal ok={feedback.ok} title={feedback.title} msg={feedback.msg}
          onAction={feedback.action} actionLabel={feedback.actionLabel}
          onClose={() => setFeedback(null)} />
      )}
      <OfficeDetailSheet office={selectedOffice} onClose={() => setSelectedOffice(null)} />

      <ScrollView contentContainerStyle={{ flexGrow:1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={["#1E3A8A","#2563EB"]} start={{x:0,y:0}} end={{x:1,y:1}}
          style={{ paddingTop:Platform.OS==="android"?48:60, paddingBottom:36, paddingHorizontal:20, overflow:"hidden" }}>
          <View style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:90, backgroundColor:"rgba(255,255,255,0.05)" }} />
          <View style={{ position:"absolute", bottom:-20, left:-20, width:120, height:120, borderRadius:60, backgroundColor:"rgba(6,182,212,0.1)" }} />

          <TouchableOpacity onPress={handleLogout}
            style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center", marginBottom:28 }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ alignItems:"center" }}>
            <View style={{ width:90, height:90, borderRadius:28, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center", marginBottom:20, borderWidth:2, borderColor:"rgba(255,255,255,0.2)" }}>
              {isRejected ? <XCircle size={44} color="#EF4444" /> : <SpinningClock />}
            </View>
            <Text style={{ fontFamily:Typography.fonts.extrabold, fontSize:26, color:"#fff", textAlign:"center", marginBottom:8 }}>
              {isRejected ? "Account Rejected" : "Under Review"}
            </Text>
            <View style={{ backgroundColor:isRejected?"rgba(239,68,68,0.2)":"rgba(6,182,212,0.25)", paddingHorizontal:16, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:isRejected?"rgba(239,68,68,0.4)":"rgba(6,182,212,0.4)" }}>
              <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:12, color:isRejected?"#FCA5A5":"#67E8F9", letterSpacing:0.6 }}>
                {isRejected ? "⛔ NOT APPROVED" : "⏳ PENDING VERIFICATION"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ flex:1, paddingHorizontal:20, paddingTop:28 }}>

          {/* Description */}
          <View style={{ marginBottom:24 }}>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:6 }}>
              {isRejected ? "We're sorry 😔" : `Hi ${firstName}! 👋`}
            </Text>
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:"#64748B", lineHeight:22 }}>
              {isRejected
                ? "Your account was not approved. Please contact support@snapfix.eg for assistance."
                : "Your provider account has been submitted and is being reviewed. This typically takes 24–48 hours."
              }
            </Text>
          </View>

          {/* Verification steps */}
          {!isRejected && (
            <View style={{ backgroundColor:"#fff", borderRadius:20, padding:20, marginBottom:20, borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:2 }}>
              <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:11, color:"#94A3B8", letterSpacing:1, marginBottom:18 }}>VERIFICATION STEPS</Text>
              <Step icon={CheckCircle} title="Account Created"   subtitle="Your profile was submitted successfully" done={true} />
              <Step icon={Shield}      title="Admin Review"      subtitle="Our team is verifying your information"  done={false} />
              <Step icon={CheckCircle} title="Account Activated" subtitle="You'll be notified once approved"        done={false} />
            </View>
          )}

          {/* Email notification */}
          {email && !isRejected && (
            <View style={{ flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#EFF6FF", borderRadius:14, padding:14, marginBottom:24, borderWidth:1, borderColor:"#BFDBFE" }}>
              <Mail size={16} color="#3B82F6" />
              <Text style={{ flex:1, fontFamily:Typography.fonts.regular, fontSize:13, color:"#1E40AF", lineHeight:18 }}>
                We'll email you at <Text style={{ fontFamily:Typography.fonts.semibold }}>{email}</Text> once approved.
              </Text>
            </View>
          )}

          {/* ══ OFFICES SECTION ══ */}
          {!isRejected && (
            <View style={{ marginBottom:24 }}>

              {/* Visit office banner */}
              <View style={{ flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#FFF7ED", borderRadius:14, padding:14, marginBottom:16, borderWidth:1, borderColor:"#FED7AA" }}>
                <Text style={{ fontSize:20 }}>🏢</Text>
                <Text style={{ fontFamily:Typography.fonts.medium, fontSize:13, color:"#92400E", flex:1, lineHeight:20 }}>
                  Visit one of our offices with your ID and certificates to complete verification.
                </Text>
              </View>

              {/* Nearest office — find my location */}
              {!hasLocation && !locDenied && (
                <TouchableOpacity onPress={fetchNearest} disabled={locLoading} activeOpacity={0.88}
                  style={{ backgroundColor:"#0F172A", borderRadius:16, padding:14, flexDirection:"row", alignItems:"center", gap:12, marginBottom:14 }}>
                  {locLoading
                    ? <ActivityIndicator size="small" color="#06B6D4" />
                    : <LocateFixed size={20} color="#06B6D4" />
                  }
                  <View style={{ flex:1 }}>
                    <Text style={{ fontFamily:Typography.fonts.bold, fontSize:14, color:"#fff" }}>Find Nearest Office</Text>
                    <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2 }}>
                      Use my location to find the closest office
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {locDenied && (
                <View style={{ backgroundColor:"#FFF7ED", borderRadius:14, padding:12, marginBottom:14, flexDirection:"row", gap:8, alignItems:"center", borderWidth:1, borderColor:"#FED7AA" }}>
                  <AlertCircle size={14} color="#F59E0B" />
                  <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#92400E", flex:1 }}>
                    Location denied. Enable it in settings to find the nearest office.
                  </Text>
                </View>
              )}

              {/* Nearest banner */}
              {nearest && (
                <TouchableOpacity onPress={() => setSelectedOffice(nearest)} activeOpacity={0.88}
                  style={{ borderRadius:18, overflow:"hidden", marginBottom:14 }}>
                  <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
                    style={{ padding:16, flexDirection:"row", alignItems:"center", gap:14 }}>
                    <View style={{ width:46, height:46, borderRadius:14, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"rgba(6,182,212,0.4)" }}>
                      <LocateFixed size={22} color="#06B6D4" />
                    </View>
                    <View style={{ flex:1 }}>
                      <View style={{ flexDirection:"row", alignItems:"center", gap:6, marginBottom:3 }}>
                        <Star size={11} color="#F59E0B" fill="#F59E0B" />
                        <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:10, color:"#F59E0B", letterSpacing:0.6 }}>NEAREST TO YOU</Text>
                      </View>
                      <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff", marginBottom:2 }}>{nearest.name}</Text>
                      <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"rgba(255,255,255,0.5)" }} numberOfLines={1}>{nearest.address}</Text>
                    </View>
                    <View style={{ alignItems:"flex-end", gap:4 }}>
                      {nearest.distance_km !== undefined && (
                        <View style={{ backgroundColor:"rgba(6,182,212,0.2)", paddingHorizontal:10, paddingVertical:4, borderRadius:20 }}>
                          <Text style={{ fontFamily:Typography.fonts.bold, fontSize:12, color:"#06B6D4" }}>{nearest.distance_km.toFixed(1)} km</Text>
                        </View>
                      )}
                      <Text style={{ fontSize:16, color:"rgba(255,255,255,0.4)" }}>›</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* All offices list */}
              {officesLoading ? (
                <View style={{ alignItems:"center", paddingVertical:20 }}>
                  <ActivityIndicator size="small" color="#06B6D4" />
                  <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#94A3B8", marginTop:8 }}>Loading offices…</Text>
                </View>
              ) : offices.length === 0 ? (
                <View style={{ backgroundColor:"#F8FAFC", borderRadius:14, padding:16, alignItems:"center" }}>
                  <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#94A3B8" }}>No offices available.</Text>
                </View>
              ) : (
                <>
                  <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:12 }}>All Offices</Text>
                  {offices.map(office => (
                    <TouchableOpacity key={office.id} onPress={() => setSelectedOffice(office)} activeOpacity={0.88}
                      style={{ backgroundColor:"#fff", borderRadius:20, marginBottom:12, borderWidth:1.5, borderColor:"rgba(6,182,212,0.3)", overflow:"hidden",
                        shadowColor:"#06B6D4", shadowOffset:{width:0,height:4}, shadowOpacity:0.1, shadowRadius:12, elevation:4 }}>
                      {/* Card header */}
                      <View style={{ backgroundColor:"#0F172A", paddingHorizontal:16, paddingVertical:13, flexDirection:"row", alignItems:"center", gap:12 }}>
                        <View style={{ width:38, height:38, borderRadius:12, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center" }}>
                          <Building2 size={18} color="#06B6D4" />
                        </View>
                        <View style={{ flex:1 }}>
                          <Text style={{ fontFamily:Typography.fonts.bold, fontSize:14, color:"#fff" }}>{office.name}</Text>
                          {(office.region_name ?? office.region?.name) && (
                            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:1 }}>{office.region_name ?? office.region?.name}</Text>
                          )}
                        </View>
                        <Text style={{ fontSize:16, color:"rgba(255,255,255,0.4)" }}>›</Text>
                      </View>
                      {/* Card body */}
                      <View style={{ padding:14, gap:8 }}>
                        <View style={{ flexDirection:"row", alignItems:"flex-start", gap:8 }}>
                          <MapPin size={13} color="#EF4444" style={{ marginTop:2 }} />
                          <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#374151", flex:1, lineHeight:18 }}>{office.address}</Text>
                        </View>
                        {office.working_hours && (
                          <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
                            <Clock size={13} color="#10B981" />
                            <Text style={{ fontFamily:Typography.fonts.medium, fontSize:12, color:"#374151" }}>{office.working_hours}</Text>
                          </View>
                        )}
                      </View>
                      {/* Footer */}
                      <View style={{ flexDirection:"row", borderTopWidth:1, borderTopColor:"#F1F5F9" }}>
                        <TouchableOpacity onPress={() => openMaps(office.latitude, office.longitude, office.name)}
                          activeOpacity={0.8} style={{ flex:1, paddingVertical:11, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, borderRightWidth:1, borderRightColor:"#F1F5F9" }}>
                          <Navigation size={13} color="#1E3A8A" />
                          <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:12, color:"#1E3A8A" }}>Directions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setSelectedOffice(office)}
                          activeOpacity={0.8} style={{ flex:1, paddingVertical:11, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6 }}>
                          <Info size={13} color="#64748B" />
                          <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:12, color:"#64748B" }}>Details</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}

          {/* Action buttons */}
          <View style={{ gap:12, marginBottom:40 }}>
            {!isRejected && (
              <TouchableOpacity onPress={handleCheckAgain} disabled={checking} activeOpacity={0.88}
                style={{ borderRadius:18, overflow:"hidden", opacity:checking?0.75:1 }}>
                <LinearGradient colors={["#06B6D4","#0284C7"]} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{ height:54, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:8 }}>
                  {checking
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><RefreshCw size={18} color="#fff" /><Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>Check Verification Status</Text></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleLogout} activeOpacity={0.75}
              style={{ height:54, alignItems:"center", justifyContent:"center", borderRadius:18, borderWidth:1.5, borderColor:"#E2E8F0" }}>
              <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:15, color:"#64748B" }}>Sign Out</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}