import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  RefreshControl, Modal, useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Plus, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, MapPin, Zap, RefreshCw, Briefcase, ChevronRight, DollarSign,
  ChevronLeft, ChevronsLeft, ChevronsRight,
} from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import {
  getBookingsPaginated, cancelBooking,
  type ServiceRequest, type BookingStatus,
} from "@/services/bookingService";

const STATUS: Record<BookingStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending:     { label:"Pending",     color:"#F59E0B", bg:"#FFFBEB", icon:Clock       },
  assigned:    { label:"Assigned",    color:"#3B82F6", bg:"#EFF6FF", icon:Briefcase   },
  quoted:      { label:"Quoted",      color:"#8B5CF6", bg:"#F5F3FF", icon:DollarSign  },
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
const canTrack: BookingStatus[]  = ["assigned","confirmed","in_progress"];

/** Tablet / desktop: show all filter chips without a single-line strip that collapses. */
const WIDE_BREAKPOINT = 600;
const CONTENT_MAX_WIDTH = 720;

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
function BookingCard({ booking, onCancel, isWide }: { booking:ServiceRequest; onCancel:(id:string)=>void; isWide:boolean }) {
  const s = STATUS[booking.status] ?? STATUS.pending;
  const Icon = s.icon;
  return (
    <View style={{ marginBottom:12, width:"100%" }}>
      <View style={{ backgroundColor:"#fff", borderRadius:20, borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:3}, shadowOpacity:0.07, shadowRadius:12, elevation:3, overflow:"hidden" }}>
        
        {/* ── Card body ───────────────── */}
        <TouchableOpacity 
          activeOpacity={0.88} 
          onPress={() => router.push(`/(customer)/booking/${booking.id}` as any)} 
          style={{ padding:16 }}
        >
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
          <View style={{ flexDirection: isWide ? "column" : "row", gap: isWide ? 8 : 16, marginBottom:12 }}>
            <View style={{ flexDirection:"row", alignItems:"center", gap:5 }}>
              <Calendar size={13} color="#94A3B8" />
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B" }}>{booking.preferred_date}</Text>
            </View>
            <View style={{ flexDirection:"row", alignItems:"flex-start", gap:5, flex: isWide ? undefined : 1 }}>
              <MapPin size={13} color="#94A3B8" style={{ marginTop:2 }} />
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#64748B", flex:1 }} numberOfLines={isWide ? 3 : 2}>
                {booking.region?.name} · {booking.address}
              </Text>
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

        {/* ── Action buttons row ────────────────────────────── */}
        {(canTrack.includes(booking.status) || canCancel.includes(booking.status)) && (
          <View style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderTopColor: "#F1F5F9",
          }}>

            {canTrack.includes(booking.status) && (
              <TouchableOpacity
                onPress={() => router.push(`/(customer)/booking/track?bookingId=${booking.id}` as any)}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  minWidth: isWide ? 120 : undefined,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  backgroundColor: "#EFF6FF",
                  borderBottomLeftRadius: canCancel.includes(booking.status) ? 0 : 20,
                  borderRightWidth: canCancel.includes(booking.status) ? 1 : 0,
                  borderRightColor: "#DBEAFE",
                }}
              >
                <MapPin size={14} color="#3B82F6" />
                <Text style={{
                  fontFamily: Typography.fonts.semibold,
                  fontSize: 13,
                  color: "#3B82F6",
                }}>
                  Track
                </Text>
              </TouchableOpacity>
            )}

            {canCancel.includes(booking.status) && (
              <TouchableOpacity
                onPress={() => onCancel(booking.id)}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  minWidth: isWide ? 120 : undefined,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  backgroundColor: "#FFF5F5",
                  borderBottomLeftRadius: canTrack.includes(booking.status) ? 0 : 20,
                  borderBottomRightRadius: 20,
                }}
              >
                <XCircle size={14} color="#EF4444" />
                <Text style={{
                  fontFamily: Typography.fonts.semibold,
                  fontSize: 13,
                  color: "#EF4444",
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}

          </View>
        )}

      </View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        backgroundColor: active ? "#1E3A8A" : "#F1F5F9",
        borderWidth: active ? 0 : 1,
        borderColor: "#E2E8F0",
      }}
    >
      <Text
        style={{
          fontFamily: active ? Typography.fonts.semibold : Typography.fonts.medium,
          fontSize: 13,
          color: active ? "#fff" : "#475569",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ─── Pagination Controls Component ──────────────────────────── */
function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) {
  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <View style={{ 
      marginTop: 20, 
      marginBottom: 10,
      paddingVertical: 12,
      alignItems: "center",
    }}>
      {/* Pagination Row */}
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "center",
        gap: 8,
        flexWrap: "wrap",
      }}>
        {/* First Page Button */}
        <TouchableOpacity
          onPress={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          style={{
            padding: 10,
            borderRadius: 8,
            backgroundColor: currentPage === 1 ? "#E2E8F0" : "#1E3A8A",
            opacity: currentPage === 1 || isLoading ? 0.5 : 1,
          }}
        >
          <ChevronsLeft size={18} color={currentPage === 1 ? "#94A3B8" : "#fff"} />
        </TouchableOpacity>

        {/* Previous Button */}
        <TouchableOpacity
          onPress={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: currentPage === 1 ? "#E2E8F0" : "#3B82F6",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            opacity: currentPage === 1 || isLoading ? 0.5 : 1,
          }}
        >
          <ChevronLeft size={16} color={currentPage === 1 ? "#94A3B8" : "#fff"} />
          <Text style={{ color: currentPage === 1 ? "#94A3B8" : "#fff", fontWeight: "600" }}>Prev</Text>
        </TouchableOpacity>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <TouchableOpacity
              key={index}
              onPress={() => onPageChange(page)}
              disabled={isLoading}
              style={{
                minWidth: 40,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: currentPage === page ? "#1E3A8A" : "#F1F5F9",
                borderWidth: currentPage === page ? 0 : 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text style={{
                textAlign: "center",
                color: currentPage === page ? "#fff" : "#475569",
                fontWeight: currentPage === page ? "700" : "500",
              }}>
                {page}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text key={index} style={{ color: "#94A3B8", paddingHorizontal: 4 }}>
              {page}
            </Text>
          )
        ))}

        {/* Next Button */}
        <TouchableOpacity
          onPress={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: currentPage === totalPages ? "#E2E8F0" : "#3B82F6",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            opacity: currentPage === totalPages || isLoading ? 0.5 : 1,
          }}
        >
          <Text style={{ color: currentPage === totalPages ? "#94A3B8" : "#fff", fontWeight: "600" }}>Next</Text>
          <ChevronRight size={16} color={currentPage === totalPages ? "#94A3B8" : "#fff"} />
        </TouchableOpacity>

        {/* Last Page Button */}
        <TouchableOpacity
          onPress={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          style={{
            padding: 10,
            borderRadius: 8,
            backgroundColor: currentPage === totalPages ? "#E2E8F0" : "#1E3A8A",
            opacity: currentPage === totalPages || isLoading ? 0.5 : 1,
          }}
        >
          <ChevronsRight size={18} color={currentPage === totalPages ? "#94A3B8" : "#fff"} />
        </TouchableOpacity>
      </View>
      
      {/* Page Info */}
      <Text style={{
        marginTop: 12,
        fontFamily: Typography.fonts.regular,
        fontSize: 12,
        color: "#64748B",
      }}>
        Page {currentPage} of {totalPages}
      </Text>
    </View>
  );
}

export default function CustomerBookingsScreen() {
  const token = useAuthStore((s) => s.token);
  const { width: windowWidth } = useWindowDimensions();
  const isWide = windowWidth >= WIDE_BREAKPOINT;
  const horizontalPad = Math.max(16, Math.min(24, windowWidth * 0.04));

  const [bookings, setBookings] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<BookingStatus|"all">("all");
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok:boolean; title:string; msg:string } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  const fetchBookings = useCallback(async (page: number = 1, isRefresh = false) => {
    if (!token) return;
    
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    
    try {
      const statusParam = filter === "all" ? undefined : filter;
      const response = await getBookingsPaginated(token, page, statusParam);
      
      setBookings(response.results);
      setTotalPages(Math.ceil(response.count / 10)); // Assuming 10 items per page
      setTotalBookings(response.count);
      setCurrentPage(page);
      
      console.log(`📄 Loaded page ${page}: ${response.results.length} of ${response.count} bookings`);
    } catch (err: any) {
      setError(getApiError(err, "Failed to load bookings."));
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  }, [token, filter]);

  // Initial load and when filter changes
  useEffect(() => { 
    setCurrentPage(1);
    fetchBookings(1); 
  }, [fetchBookings]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchBookings(newPage);
      // Scroll to top when page changes
      // You can add scrollToTop functionality here if needed
    }
  };

  const doCancel = async () => {
    if (!confirmId || !token) return;
    const id = confirmId;
    setConfirmId(null);
    try {
      const updated = await cancelBooking(id, token, "Cancelled by customer");
      setBookings(prev => prev.map(b => b.id === id ? updated : b));
      setFeedback({ ok:true, title:"Booking Cancelled ✓", msg:"Your booking has been successfully cancelled." });
      
      // Refresh current page after cancellation
      setTimeout(() => {
        fetchBookings(currentPage);
      }, 500);
    } catch (err: any) {
      setFeedback({ ok:false, title:"Cannot Cancel", msg: getApiError(err, "Could not cancel this booking.") });
    }
  };

  const confirmBooking = bookings.find(b => b.id === confirmId);
  const filtered = bookings; // Already filtered by API

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
        style={{ paddingTop:Platform.OS==="android"?48:60, paddingBottom:24, paddingHorizontal:horizontalPad, overflow:"hidden" }}>
        <View style={{ position:"absolute", top:-40, right:-30, width:160, height:160, borderRadius:80, backgroundColor:"rgba(6,182,212,0.08)" }} />
        <View style={{ width:"100%", maxWidth:CONTENT_MAX_WIDTH, alignSelf:"center" }}>
          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", gap:12 }}>
            <View style={{ flex:1, minWidth:0 }}>
              <Text style={{ fontFamily:Typography.fonts.extrabold, fontSize: isWide ? 28 : 24, color:"#fff" }}>My Bookings</Text>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:2 }} numberOfLines={1}>
                {totalBookings} total request{totalBookings !== 1 ? "s" : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(customer)/booking/create" as any)}
              style={{ width:48, height:48, borderRadius:16, backgroundColor:"#06B6D4", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Plus size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Filters */}
      <View
        style={{
          flexShrink: 0,
          flexGrow: 0,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E2E8F0",
          zIndex: 2,
          elevation: 4,
        }}
      >
        {isWide ? (
          <View
            style={{
              width: "100%",
              maxWidth: CONTENT_MAX_WIDTH,
              alignSelf: "center",
              paddingHorizontal: horizontalPad,
              paddingVertical: 12,
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                active={filter === f.key}
                onPress={() => {
                  setFilter(f.key);
                  setCurrentPage(1);
                }}
              />
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator
            style={{ minHeight: 52, maxHeight: 56 }}
            contentContainerStyle={{
              paddingHorizontal: horizontalPad,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              gap: 8,
              paddingRight: horizontalPad + 8,
            }}
          >
            {FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                label={f.label}
                active={filter === f.key}
                onPress={() => {
                  setFilter(f.key);
                  setCurrentPage(1);
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

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
          <TouchableOpacity onPress={() => fetchBookings(currentPage)}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#1E3A8A", paddingHorizontal:24, paddingVertical:12, borderRadius:16 }}>
            <RefreshCw size={16} color="#fff" />
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 100,
            paddingHorizontal: horizontalPad,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBookings(currentPage, true)} tintColor="#1E3A8A" colors={["#1E3A8A"]} />}
        >
          <View style={{ width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" }}>
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
            <>
              {filtered.map(b => (
                <BookingCard key={b.id} booking={b} isWide={isWide} onCancel={id => setConfirmId(id)} />
              ))}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  isLoading={loading || refreshing}
                />
              )}
            </>
          )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}