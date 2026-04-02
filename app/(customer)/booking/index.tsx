import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  RefreshControl, Modal,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Plus, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, MapPin, Zap, RefreshCw, Briefcase, ChevronRight,
} from "@/components/ui/lucide-icon";
import { useAuthStore }   from "@/store/authStore";
import { Typography }     from "@/theme/typography";
import {
  getBookings, cancelBooking,
  type ServiceRequest, type BookingStatus,
} from "@/services/bookingService";

const STATUS: Record<BookingStatus, { label:string; color:string; bg:string; icon:any }> = {
  pending:     { label:"Pending",     color:"#F59E0B", bg:"#FFFBEB", icon:Clock       },
  assigned:    { label:"Assigned",    color:"#3B82F6", bg:"#EFF6FF", icon:Briefcase   },
  confirmed:   { label:"Confirmed",   color:"#8B5CF6", bg:"#F5F3FF", icon:CheckCircle },
  in_progress: { label:"In Progress", color:"#06B6D4", bg:"#ECFEFF", icon:Zap         },
  completed:   { label:"Completed",   color:"#10B981", bg:"#ECFDF5", icon:CheckCircle },
  cancelled:   { label:"Cancelled",   color:"#EF4444", bg:"#FEF2F2", icon:XCircle     },
  declined:    { label:"Declined",    color:"#94A3B8", bg:"#F8FAFC", icon:AlertCircle },
};

const FILTERS: { key:BookingStatus|"all"; label:string }[] = [
  { key:"all",         label:"All"       },
  { key:"pending",     label:"Pending"   },
  { key:"assigned",    label:"Assigned"  },
  { key:"confirmed",   label:"Confirmed" },
  { key:"in_progress", label:"Active"    },
  { key:"completed",   label:"Completed" },
  { key:"cancelled",   label:"Cancelled" },
  { key:"declined",    label:"Declined"  },
];

const canCancel: BookingStatus[] = ["pending","assigned","confirmed","in_progress"];

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

/* ─── Feedback modal ──────────────────────────────────────────── */
function FeedbackModal({ ok, title, msg, onClose }: { ok:boolean; title:string; msg:string; onClose:()=>void }) {
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
            <TouchableOpacity onPress={onClose} style={{ width:"100%", paddingVertical:14, borderRadius:16, backgroundColor:ok?"#10B981":"#0F172A", alignItems:"center" }}>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Confirm modal ───────────────────────────────────────────── */
function ConfirmModal({ title, msg, onConfirm, onClose }: { title:string; msg:string; onConfirm:()=>void; onClose:()=>void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, overflow:"hidden" }}>
          <View style={{ backgroundColor:"#F59E0B", paddingVertical:20, alignItems:"center" }}>
            <Text style={{ fontSize:40 }}>🤔</Text>
          </View>
          <View style={{ padding:24, alignItems:"center" }}>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:10, textAlign:"center" }}>{title}</Text>
            <View style={{ backgroundColor:"#FFFBEB", borderRadius:14, padding:14, borderWidth:1, borderColor:"#FDE68A", marginBottom:20, width:"100%" }}>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:"#92400E", textAlign:"center", lineHeight:22 }}>{msg}</Text>
            </View>
            <View style={{ flexDirection:"row", gap:10, width:"100%" }}>
              <TouchableOpacity onPress={onClose} style={{ flex:1, paddingVertical:14, borderRadius:16, backgroundColor:"#F1F5F9", alignItems:"center" }}>
                <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:15, color:"#64748B" }}>Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onConfirm} style={{ flex:1, paddingVertical:14, borderRadius:16, backgroundColor:"#EF4444", alignItems:"center" }}>
                <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>Cancel It</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Booking card ────────────────────────────────────────────── */
function BookingCard({ booking, onCancel }: { booking:ServiceRequest; onCancel:(id:string)=>void }) {
  const s = STATUS[booking.status] ?? STATUS.pending;
  const Icon = s.icon;
  return (
    <View style={{ marginBottom:12 }}>
      <View style={{ backgroundColor:"#fff", borderRadius:20, borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:3}, shadowOpacity:0.07, shadowRadius:12, elevation:3, overflow:"hidden" }}>
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push(`/(customer)/booking/${booking.id}` as any)} style={{ padding:16 }}>
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <View style={{ flex:1, marginRight:10 }}>
              {booking.is_urgent && (
                <View style={{ flexDirection:"row", alignItems:"center", gap:4, marginBottom:6 }}>
                  <AlertCircle size={11} color="#EF4444" />
                  <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:10, color:"#EF4444", letterSpacing:0.5 }}>URGENT</Text>
                </View>
              )}
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:3 }} numberOfLines={1}>{booking.title}</Text>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#94A3B8" }}>{booking.category?.name}</Text>
            </View>
            <View style={{ flexDirection:"row", alignItems:"center", gap:5, backgroundColor:s.bg, paddingHorizontal:10, paddingVertical:5, borderRadius:20 }}>
              <Icon size={11} color={s.color} />
              <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:11, color:s.color }}>{s.label}</Text>
            </View>
          </View>
          <View style={{ flexDirection:"row", gap:16, marginBottom:12 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
              <Calendar size={13} color="#94A3B8" />
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B" }}>{booking.preferred_date}</Text>
            </View>
            <View style={{ flexDirection:"row", alignItems:"center", gap:5, flex:1 }}>
              <MapPin size={13} color="#94A3B8" />
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B" }} numberOfLines={1}>{booking.region?.name} · {booking.address}</Text>
            </View>
          </View>
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
            <View>
              {booking.final_price
                ? <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#10B981" }}>{booking.final_price} EGP</Text>
                : booking.estimated_price
                  ? <Text style={{ fontFamily:Typography.fonts.medium, fontSize:13, color:"#64748B" }}>~{booking.estimated_price} EGP</Text>
                  : <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#CBD5E1" }}>No price set</Text>
              }
            </View>
            <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
              <Text style={{ fontFamily:Typography.fonts.medium, fontSize:12, color:"#64748B" }}>View details</Text>
              <ChevronRight size={13} color="#64748B" />
            </View>
          </View>
        </TouchableOpacity>

        {canCancel.includes(booking.status) && (
          <TouchableOpacity onPress={() => onCancel(booking.id)} activeOpacity={0.75}
            style={{ borderTopWidth:1, borderTopColor:"#FEE2E2", backgroundColor:"#FFF5F5", paddingVertical:11, paddingHorizontal:16, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6 }}>
            <XCircle size={14} color="#EF4444" />
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:13, color:"#EF4444" }}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function CustomerBookingsScreen() {
  const token = useAuthStore((s) => s.token);

  const [bookings,   setBookings]   = useState<ServiceRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<BookingStatus|"all">("all");
  const [error,      setError]      = useState<string | null>(null);
  const [confirmId,  setConfirmId]  = useState<string | null>(null);
  const [feedback,   setFeedback]   = useState<{ ok:boolean; title:string; msg:string } | null>(null);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await getBookings(token);
      setBookings(data);
    } catch (err: any) {
      setError(getApiError(err, "Failed to load bookings."));
    } finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const doCancel = async () => {
    if (!confirmId || !token) return;
    const id = confirmId;
    setConfirmId(null);
    try {
      const updated = await cancelBooking(id, token, "Cancelled by customer");
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
      setFeedback({ ok:true, title:"Booking Cancelled ✓", msg:"Your booking has been successfully cancelled." });
    } catch (err: any) {
      setFeedback({ ok:false, title:"Cannot Cancel", msg: getApiError(err, "Could not cancel this booking.") });
    }
  };

  const confirmBooking = bookings.find(b => b.id === confirmId);
  const filtered = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {feedback && <FeedbackModal ok={feedback.ok} title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}
      {confirmId && confirmBooking && (
        <ConfirmModal
          title="Cancel Booking?"
          msg={`Cancel "${confirmBooking.title}"?\n\nThis cannot be undone.`}
          onConfirm={doCancel}
          onClose={() => setConfirmId(null)}
        />
      )}

      <LinearGradient colors={["#1E3A8A","#1E40AF"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop:Platform.OS==="android"?48:60, paddingBottom:24, paddingHorizontal:20, overflow:"hidden" }}>
        <View style={{ position:"absolute", top:-40, right:-30, width:160, height:160, borderRadius:80, backgroundColor:"rgba(6,182,212,0.08)" }} />
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <View>
            <Text style={{ fontFamily:Typography.fonts.extrabold, fontSize:24, color:"#fff" }}>My Bookings</Text>
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:2 }}>
              {bookings.length} total request{bookings.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(customer)/booking/create" as any)}
            style={{ width:44, height:44, borderRadius:15, backgroundColor:"#06B6D4", alignItems:"center", justifyContent:"center" }}>
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:16, paddingVertical:14, gap:8 }}
        style={{ flexGrow:0, backgroundColor:"#fff", borderBottomWidth:1, borderBottomColor:"#F1F5F9" }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
              style={{ paddingHorizontal:16, paddingVertical:8, borderRadius:20, backgroundColor:active?"#1E3A8A":"#F1F5F9" }}>
              <Text style={{ fontFamily:active?Typography.fonts.semibold:Typography.fonts.regular, fontSize:13, color:active?"#fff":"#64748B" }}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator size="large" color="#1E3A8A" />
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:"#94A3B8", marginTop:12 }}>Loading bookings…</Text>
        </View>
      ) : error ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal:32 }}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom:16 }} />
          <Text style={{ fontFamily:Typography.fonts.bold, fontSize:16, color:"#0F172A", marginBottom:8 }}>Failed to load</Text>
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"#94A3B8", textAlign:"center", marginBottom:24 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchBookings()}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#1E3A8A", paddingHorizontal:24, paddingVertical:12, borderRadius:16 }}>
            <RefreshCw size={16} color="#fff" />
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:100 }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBookings(true)} tintColor="#1E3A8A" colors={["#1E3A8A"]} />}>
          {filtered.length === 0 ? (
            <View style={{ alignItems:"center", paddingTop:60 }}>
              <Text style={{ fontSize:56, marginBottom:16 }}>📋</Text>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:17, color:"#0F172A", marginBottom:8 }}>
                {filter==="all"?"No bookings yet":`No ${filter} bookings`}
              </Text>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:"#94A3B8", textAlign:"center", marginBottom:28, lineHeight:22 }}>
                {filter==="all"?"Book a service and it'll appear here.":"Try a different filter."}
              </Text>
              {filter==="all" && (
                <TouchableOpacity onPress={() => router.push("/(customer)/booking/create" as any)}
                  style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#1E3A8A", paddingHorizontal:28, paddingVertical:14, borderRadius:18 }}>
                  <Plus size={18} color="#06B6D4" />
                  <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>Book a Service</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map(b => <BookingCard key={b.id} booking={b} onCancel={id => setConfirmId(id)} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}