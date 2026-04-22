// app/(provider)/jobs/[id].tsx - Updated version

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  Alert, RefreshControl, TextInput, Modal, Linking,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, MapPin, Calendar, Clock, DollarSign,
  FileText, Tag, CheckCircle, XCircle, Play, Flag,
  AlertCircle, RefreshCw, Star, Navigation, CreditCard, Wallet,
} from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import {
  getHistoryDetail, quoteJob, acceptJob, declineJob,
  startJob, completeJob, providerCancelJob,
  type ServiceRequest, type HistoryDetail,
} from "@/services/bookingService";

const STATUS: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  pending:     { label:"Pending",     color:"#F59E0B", bg:"#FFFBEB", desc:"Waiting for provider assignment." },
  assigned:    { label:"Assigned",    color:"#3B82F6", bg:"#EFF6FF", desc:"Assigned to you — quote or accept directly." },
  quoted:      { label:"Quoted",      color:"#8B5CF6", bg:"#F5F3FF", desc:"You quoted the job — awaiting customer approval." },
  confirmed:   { label:"Confirmed",   color:"#8B5CF6", bg:"#F5F3FF", desc:"You accepted — job is scheduled." },
  in_progress: { label:"In Progress", color:"#06B6D4", bg:"#ECFEFF", desc:"You are currently working on this job." },
  completed:   { label:"Completed",   color:"#10B981", bg:"#ECFDF5", desc:"Job finished. Earnings updated." },
  cancelled:   { label:"Cancelled",   color:"#EF4444", bg:"#FEF2F2", desc:"This job was cancelled." },
  declined:    { label:"Declined",    color:"#94A3B8", bg:"#F8FAFC", desc:"You declined this assignment." },
};

function SectionLabel({ label }: { label: string }) {
  return <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:"#94A3B8", letterSpacing:1.1, marginBottom:10, marginTop:22 }}>{label}</Text>;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor:"#fff", borderRadius:20, paddingHorizontal:16, borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#0F172A", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
      {children}
    </View>
  );
}

function Row({ icon: Icon, label, value, color="#3B82F6", last=false }: {
  icon:any; label:string; value:string; color?:string; last?:boolean;
}) {
  if (!value) return null;
  return (
    <View style={{ flexDirection:"row", alignItems:"flex-start", paddingVertical:13, borderBottomWidth: last?0:1, borderBottomColor:"#F1F5F9" }}>
      <View style={{ width:36, height:36, borderRadius:11, backgroundColor:color+"15", alignItems:"center", justifyContent:"center", marginRight:12 }}>
        <Icon size={16} color={color} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#94A3B8", marginBottom:2 }}>{label}</Text>
        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#0F172A", lineHeight:20 }}>{value}</Text>
      </View>
    </View>
  );
}

function LocationRow({ label, address, latitude, longitude, color = "#EF4444" }: {
  label: string; address: string; latitude?: number | string | null; longitude?: number | string | null; color?: string;
}) {
  const lat = latitude ? parseFloat(String(latitude)) : undefined;
  const lon = longitude ? parseFloat(String(longitude)) : undefined;
  const hasCoords = lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon);

  const openMaps = () => {
    if (!hasCoords || lat === undefined || lon === undefined) {
      Alert.alert("Location", "Coordinates not available for this address.");
      return;
    }

    let url = "";

    if (Platform.OS === "web") {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}&zoom=16`;
    } else if (Platform.OS === "ios") {
      url = `maps:?q=${encodeURIComponent(address)}&ll=${lat},${lon}`;
    } else {
      url = `geo:${lat},${lon}?q=${encodeURIComponent(address)}`;
    }

    Linking.openURL(url).catch(err =>
      Alert.alert("Error", "Unable to open maps application.")
    );
  };

  if (!address) return null;

  return (
    <View style={{ flexDirection:"row", alignItems:"flex-start", paddingVertical:13, borderBottomWidth:1, borderBottomColor:"#F1F5F9" }}>
      <View style={{ width:36, height:36, borderRadius:11, backgroundColor:color+"15", alignItems:"center", justifyContent:"center", marginRight:12 }}>
        <MapPin size={16} color={color} />
      </View>
      <View style={{ flex:1 }}>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#94A3B8", marginBottom:2 }}>{label}</Text>
        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#0F172A", lineHeight:20, marginBottom:8 }}>{address}</Text>
        
        {hasCoords && lat !== undefined && lon !== undefined && (
          <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#94A3B8" }}>
              📍 {lat.toFixed(4)}, {lon.toFixed(4)}
            </Text>
            <TouchableOpacity onPress={openMaps}
              style={{ flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:8, paddingVertical:4, backgroundColor:"#F0F9FF", borderRadius:8, borderWidth:1, borderColor:"#BAE6FD" }}>
              <Navigation size={12} color="#0284C7" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:"#0284C7" }}>Open Maps</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function ReasonModal({ visible, title, confirmLabel="Confirm", danger=false, onConfirm, onClose }: {
  visible:boolean; title:string; confirmLabel?:string; danger?:boolean;
  onConfirm:(r:string)=>void; onClose:()=>void;
}) {
  const [reason, setReason] = useState("");
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, padding:24 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize:17, color:"#0F172A", marginBottom:14 }}>{title}</Text>
          <TextInput value={reason} onChangeText={setReason} placeholder="Reason (optional)" multiline numberOfLines={3}
            style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#0F172A", backgroundColor:"#F8FAFC", borderRadius:12, borderWidth:1.5, borderColor:"#E2E8F0", paddingHorizontal:14, paddingVertical:10, height:80, textAlignVertical:"top", marginBottom:16 }}
          />
          <View style={{ flexDirection:"row", gap:10 }}>
            <TouchableOpacity onPress={onClose} style={{ flex:1, paddingVertical:13, borderRadius:14, backgroundColor:"#F1F5F9", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onConfirm(reason); setReason(""); }}
              style={{ flex:2, paddingVertical:13, borderRadius:14, backgroundColor: danger?"#EF4444":"#0F172A", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function QuoteModal({ visible, onConfirm, onClose }: {
  visible:boolean; onConfirm:(p:string)=>void; onClose:()=>void;
}) {
  const [price, setPrice] = useState("");
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, padding:24 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize:17, color:"#0F172A", marginBottom:6 }}>Submit Quote</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#64748B", marginBottom:16 }}>Enter price in EGP</Text>
          <TextInput value={price} onChangeText={setPrice} placeholder="e.g. 250.00" keyboardType="decimal-pad"
            style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#0F172A", backgroundColor:"#F8FAFC", borderRadius:12, borderWidth:1.5, borderColor:"#E2E8F0", paddingHorizontal:14, height:50, marginBottom:16 }}
          />
          <View style={{ flexDirection:"row", gap:10 }}>
            <TouchableOpacity onPress={onClose} style={{ flex:1, paddingVertical:13, borderRadius:14, backgroundColor:"#F1F5F9", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onConfirm(price); setPrice(""); }}
              disabled={!price.trim()}
              style={{ flex:2, paddingVertical:13, borderRadius:14, backgroundColor:price.trim()?"#0F172A":"#CBD5E1", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>Confirm Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ActionFeedbackModal({ data, onClose }: {
  data: { title: string; msg: string } | null; onClose: () => void;
}) {
  if (!data) return null;
  const isSuccess = data.title.startsWith("✓");
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, overflow:"hidden" }}>
          <View style={{ backgroundColor: isSuccess ? "#10B981" : "#EF4444", paddingVertical:20, alignItems:"center" }}>
            <Text style={{ fontSize:40 }}>{isSuccess ? "✅" : "⚠️"}</Text>
          </View>
          <View style={{ padding:24, alignItems:"center" }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:10, textAlign:"center" }}>
              {data.title}
            </Text>
            <View style={{ backgroundColor:isSuccess?"#ECFDF5":"#FEF2F2", borderRadius:14, padding:14, borderWidth:1, borderColor:isSuccess?"#A7F3D0":"#FECACA", marginBottom:20, width:"100%" }}>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:isSuccess?"#065F46":"#991B1B", textAlign:"center", lineHeight:22 }}>
                {data.msg}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}
              style={{ width:"100%", paddingVertical:14, borderRadius:16, backgroundColor: isSuccess ? "#10B981" : "#0F172A", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:15, color:"#fff" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProviderJobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);

  const [job, setJob] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const [showDecline, setShowDecline] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [actionFeed, setActionFeed] = useState<{ title: string; msg: string } | null>(null);

  const fetch = async (isRefresh = false) => {
    if (!token || !id) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await getHistoryDetail(id, token) as HistoryDetail;
      console.log("📊 Fetched job:", {
        id: data.id,
        status: data.status,
        payment_method: data.payment_method,
        payment_status: data.payment_status,
        final_price: data.final_price,
        card_amount: data.card_amount,
      });
      setJob(data);
    } catch (err: any) {
      setError(err?.data?.detail ?? err?.message ?? "Failed to load job.");
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetch(); }, [id, token]);

  // Simplified: Check if card payment is required
  // Card payment is ready when final_price is set (quote approved)
  const isCardPaymentRequired = (): boolean => {
    if (!job) return false;
    
    // If payment is already paid, definitely not required
    if (job.payment_status === "paid") {
      return false;
    }
    
    // Cash jobs - never required
    if (job.payment_method === "cash") {
      return false;
    }
    
    // Wallet jobs - never required (deducted at completion)
    if (job.payment_method === "wallet") {
      return false;
    }
    
    // For card jobs:
    // If final_price is set (quote was approved), the payment can be processed
    // The backend will handle capturing the payment when job completes
    if (job.payment_method === "card" && job.final_price && parseFloat(job.final_price) > 0) {
      console.log("✅ Card job ready for completion (final_price:", job.final_price, ")");
      return false;
    }
    
    // If we get here, something is wrong
    console.log("⚠️ Card payment required - no final_price or invalid state");
    return true;
  };

  const handleCompletePress = () => {
    if (isCardPaymentRequired()) {
      Alert.alert(
        "Cannot Complete Job",
        "⚠️ Cannot complete this card payment job.\n\nPlease make sure the customer has approved the quote first.",
        [{ text: "OK", style: "default" }]
      );
    } else {
      setShowCompleteConfirm(true);
    }
  };

  const act = async (fn: () => Promise<ServiceRequest>, successMsg: string) => {
    if (!token || !id) return;
    setActing(true);
    try {
      const updated = await fn();
      setJob(updated as HistoryDetail);
      setActionFeed({ title: "✓ Success", msg: successMsg });
    } catch (err: any) {
      console.log("[JobDetail]", JSON.stringify(err?.data ?? err));
      const d = err?.data ?? {};
      const msg = d?.detail ?? d?.non_field_errors?.[0] ?? err?.message ?? "Action failed.";
      setActionFeed({ title: "Error", msg });
    } finally { setActing(false); }
  };

  const doAccept = () => act(() => acceptJob(id!, token!), "Job confirmed! Get ready.");
  const doDecline = (r: string) => { setShowDecline(false); act(() => declineJob(id!, token!, r), "Job declined."); };
  const doQuote = (p: string) => { setShowQuote(false); act(() => quoteJob(id!, token!, p), `Quoted ${p} EGP. Waiting for customer approval.`); };
  const doStart = () => act(() => startJob(id!, token!), "Job started! Good luck.");
  const doComplete = () => { 
    setShowCompleteConfirm(false); 
    act(() => completeJob(id!, token!), "Job completed! Payment settled and earnings updated.");
  };
  const doCancel = (r: string) => { setShowCancel(false); act(() => providerCancelJob(id!, token!, r), "Job cancelled."); };

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#94A3B8", marginTop:12 }}>Loading job…</Text>
      </View>
    );
  }

  if (error || !job) {
    return (
      <View style={{ flex:1, backgroundColor:"#F8FAFC", alignItems:"center", justifyContent:"center", paddingHorizontal:32 }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom:16 }} />
        <Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#0F172A", marginBottom:8 }}>Not Found</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#94A3B8", textAlign:"center", marginBottom:24 }}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()}
          style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#0F172A", paddingHorizontal:24, paddingVertical:12, borderRadius:16 }}>
          <ArrowLeft size={16} color="#06B6D4" />
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#fff" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const s = STATUS[job.status] ?? STATUS.pending;

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ReasonModal visible={showDecline} title="Decline Job" confirmLabel="Decline" danger onConfirm={doDecline} onClose={() => setShowDecline(false)} />
      <ReasonModal visible={showCancel} title="Cancel Job" confirmLabel="Cancel Job" danger onConfirm={doCancel} onClose={() => setShowCancel(false)} />
      <QuoteModal visible={showQuote} onConfirm={doQuote} onClose={() => setShowQuote(false)} />
      <ActionFeedbackModal data={actionFeed} onClose={() => setActionFeed(null)} />

      <Modal visible={showCompleteConfirm} transparent animationType="fade" onRequestClose={() => setShowCompleteConfirm(false)}>
        <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
          <View style={{ backgroundColor:"#fff", borderRadius:24, padding:24 }}>
            <View style={{ alignItems:"center", marginBottom:20 }}>
              <Flag size={48} color="#10B981" />
            </View>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:17, color:"#0F172A", marginBottom:10, textAlign:"center" }}>
              Complete Job?
            </Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#64748B", marginBottom:20, textAlign:"center" }}>
              Once completed, the customer will be charged {job.final_price ? `${job.final_price} EGP` : "the approved amount"}.
              This action cannot be undone.
            </Text>
            
            {job.payment_method === "card" && (
              <View style={{ backgroundColor:"#EFF6FF", borderRadius:12, padding:12, marginBottom:16 }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#1E3A8A", textAlign:"center" }}>
                  💳 Card payment will be processed automatically
                </Text>
              </View>
            )}
            
            {job.payment_method === "wallet" && (
              <View style={{ backgroundColor:"#ECFDF5", borderRadius:12, padding:12, marginBottom:16 }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#065F46", textAlign:"center" }}>
                  👛 Amount will be deducted from customer's wallet
                </Text>
              </View>
            )}
            
            {job.payment_method === "cash" && (
              <View style={{ backgroundColor:"#FFFBEB", borderRadius:12, padding:12, marginBottom:16 }}>
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#92400E", textAlign:"center" }}>
                  💵 Customer will pay cash directly to you
                </Text>
              </View>
            )}
            
            <View style={{ flexDirection:"row", gap:10 }}>
              <TouchableOpacity onPress={() => setShowCompleteConfirm(false)} style={{ flex:1, paddingVertical:13, borderRadius:14, backgroundColor:"#F1F5F9", alignItems:"center" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={doComplete} style={{ flex:2, paddingVertical:13, borderRadius:14, backgroundColor:"#10B981", alignItems:"center" }}>
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>Complete Job</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetch(true)} tintColor="#06B6D4" colors={["#06B6D4"]} />}>

        <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
          style={{ paddingTop: Platform.OS==="android"?48:60, paddingBottom:32, paddingHorizontal:20, overflow:"hidden" }}>
          <View style={{ position:"absolute", top:-30, right:-30, width:150, height:150, borderRadius:75, backgroundColor:"rgba(6,182,212,0.06)" }} />

          <TouchableOpacity onPress={() => router.back()}
            style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ flexDirection:"row", alignItems:"center", gap:7, backgroundColor:"rgba(255,255,255,0.1)", paddingHorizontal:14, paddingVertical:7, borderRadius:20, alignSelf:"flex-start", marginBottom:14 }}>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor:s.color }} />
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:13, color:"#fff" }}>{s.label}</Text>
          </View>

          {job.is_urgent && (
            <View style={{ flexDirection:"row", alignItems:"center", gap:6, marginBottom:10 }}>
              <AlertCircle size={14} color="#FCA5A5" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:12, color:"#FCA5A5" }}>URGENT REQUEST</Text>
            </View>
          )}

          <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:22, color:"#fff", marginBottom:6, lineHeight:30 }}>{job.title}</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"rgba(255,255,255,0.5)" }}>{job.category?.name} · {job.region?.name}</Text>
        </LinearGradient>

        <View style={{ paddingHorizontal:20 }}>
          <View style={{ backgroundColor:s.bg, borderRadius:16, padding:14, marginTop:16, flexDirection:"row", alignItems:"center", gap:10 }}>
            <View style={{ width:8, height:8, borderRadius:4, backgroundColor:s.color }} />
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize:13, color:s.color, flex:1 }}>{s.desc}</Text>
          </View>

          <SectionLabel label="SERVICE DETAILS" />
          <Card>
            <Row icon={Tag} label="Category" value={job.category?.name ?? ""} color="#8B5CF6" />
            <Row icon={FileText} label="Description" value={job.description} color="#1E3A8A" />
            <Row icon={DollarSign} label="Estimated Price" value={job.estimated_price ? `${job.estimated_price} EGP` : ""} color="#F59E0B" />
            <Row icon={DollarSign} label="Quoted Price" value={job.quoted_price ? `${job.quoted_price} EGP` : ""} color="#8B5CF6" />
            <Row icon={DollarSign} label="Final Price" value={job.final_price ? `${job.final_price} EGP` : ""} color="#10B981" last />
          </Card>

          <SectionLabel label="PAYMENT INFO" />
          <Card>
            <Row icon={job.payment_method === "cash" ? DollarSign : job.payment_method === "card" ? CreditCard : Wallet} 
                 label="Payment Method" 
                 value={job.payment_method_display} 
                 color={job.payment_method === "cash" ? "#F59E0B" : job.payment_method === "card" ? "#3B82F6" : "#10B981"} />
            <Row icon={Wallet} label="Wallet Amount" value={job.wallet_amount && parseFloat(job.wallet_amount) > 0 ? `${job.wallet_amount} EGP` : "0 EGP"} color="#F59E0B" />
            {job.card_amount && parseFloat(job.card_amount) > 0 && (
              <Row icon={CreditCard} label="Card Amount" value={`${job.card_amount} EGP`} color="#06B6D4" />
            )}
            <Row icon={CheckCircle} label="Payment Status" value={job.payment_status_display} color={job.payment_status === "paid" ? "#10B981" : "#F59E0B"} last />
          </Card>

          <SectionLabel label="LOCATION & SCHEDULE" />
          <Card>
            <LocationRow label="Region" address={job.region?.name ?? ""} color="#EF4444" />
            <LocationRow 
              label="Address" 
              address={job.address}
              latitude={job.latitude}
              longitude={job.longitude}
              color="#EF4444"
            />
            <Row icon={Calendar} label="Date" value={job.preferred_date} color="#3B82F6" />
            <Row icon={Clock} label="Time" value={job.preferred_time?.slice(0,5) ?? ""} color="#3B82F6" last />
          </Card>

          <SectionLabel label="TIMELINE" />
          <Card>
            {[
              { key:"created_at", label:"Request Created" },
              { key:"assigned_at", label:"Assigned to You" },
              { key:"confirmed_at", label:"You Accepted" },
              { key:"started_at", label:"Work Started" },
              { key:"completed_at", label:"Job Completed" },
              { key:"cancelled_at", label:"Cancelled" },
            ].filter(step => !!(job as any)[step.key])
             .map((step, i, arr) => (
              <View key={step.key} style={{ flexDirection:"row", alignItems:"flex-start", paddingVertical:12, borderBottomWidth: i<arr.length-1?1:0, borderBottomColor:"#F1F5F9" }}>
                <View style={{ width:10, height:10, borderRadius:5, backgroundColor: i===arr.length-1?"#1E3A8A":"#06B6D4", marginTop:4, marginRight:12 }} />
                <View>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:13, color:"#0F172A" }}>{step.label}</Text>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#94A3B8", marginTop:2 }}>
                    {new Date((job as any)[step.key]).toLocaleString("en-EG")}
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          {job.customer && (
            <>
              <SectionLabel label="CUSTOMER INFORMATION" />
              <Card>
                <View style={{ paddingVertical:12 }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:12 }}>
                    <View style={{ width:48, height:48, borderRadius:12, backgroundColor:"#E2E8F0", alignItems:"center", justifyContent:"center" }}>
                      <Text style={{ fontSize:20 }}>👤</Text>
                    </View>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontFamily: Typography.fonts.bold, fontSize:15, color:"#0F172A" }}>
                        {job.customer.first_name} {job.customer.last_name}
                      </Text>
                      <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#94A3B8", marginTop:2 }}>
                        {job.customer.total_bookings || 0} bookings
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </>
          )}

          {job.status === "completed" && job.review && (
            <>
              <SectionLabel label="CUSTOMER REVIEW" />
              <Card>
                <View style={{ paddingVertical:12 }}>
                  <View style={{ flexDirection:"row", alignItems:"center", gap:8, marginBottom:12 }}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={18} color="#F59E0B" fill={n <= job.review!.rating ? "#F59E0B" : "transparent"} />
                    ))}
                    <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#0F172A", marginLeft:8 }}>
                      {job.review.rating}.0
                    </Text>
                  </View>
                  {job.review.comment && (
                    <View style={{ backgroundColor:"#FFFBEB", borderRadius:12, padding:12, borderWidth:1, borderColor:"#FDE68A", marginBottom:10 }}>
                      <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#92400E", lineHeight:20 }}>
                        "{job.review.comment}"
                      </Text>
                    </View>
                  )}
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#94A3B8" }}>
                    Reviewed on {new Date(job.review.created_at).toLocaleDateString("en-EG")}
                  </Text>
                </View>
              </Card>
            </>
          )}

          <View style={{ marginTop:24, gap:12 }}>
            {job.status === "assigned" && (<>
              <TouchableOpacity onPress={() => setShowQuote(true)} disabled={acting} activeOpacity={0.88}
                style={{ borderRadius:18, overflow:"hidden", opacity: acting?0.7:1 }}>
                <LinearGradient colors={["#8B5CF6","#7C3AED"]} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{ paddingVertical:16, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:10 }}>
                  {acting ? <ActivityIndicator size="small" color="#fff" />
                    : <><DollarSign size={18} color="#fff" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#fff" }}>Submit Quote</Text></>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={doAccept} disabled={acting} activeOpacity={0.88}
                style={{ borderRadius:18, overflow:"hidden", opacity: acting?0.7:1 }}>
                <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{ paddingVertical:16, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:10 }}>
                  {acting ? <ActivityIndicator size="small" color="#06B6D4" />
                    : <><CheckCircle size={18} color="#06B6D4" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#fff" }}>Accept Job (Skip Quote)</Text></>}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowDecline(true)} disabled={acting} activeOpacity={0.88}
                style={{ paddingVertical:16, borderRadius:18, borderWidth:1.5, borderColor:"#E2E8F0", backgroundColor:"#F8FAFC", flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 }}>
                <XCircle size={17} color="#64748B" />
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:15, color:"#64748B" }}>Decline Job</Text>
              </TouchableOpacity>
            </>)}

            {job.status === "quoted" && (
              <View style={{ backgroundColor:"#F5F3FF", borderRadius:16, padding:16, alignItems:"center" }}>
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#6D28D9", textAlign:"center" }}>
                  ⏳ Waiting for customer to approve your quote of {job.quoted_price} EGP
                </Text>
              </View>
            )}

            {job.status === "confirmed" && (
              <TouchableOpacity onPress={doStart} disabled={acting} activeOpacity={0.88}
                style={{ borderRadius:18, overflow:"hidden", opacity: acting?0.7:1 }}>
                <LinearGradient colors={["#0284C7","#06B6D4"]} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{ paddingVertical:16, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:10 }}>
                  {acting ? <ActivityIndicator size="small" color="#fff" />
                    : <><Play size={18} color="#fff" fill="#fff" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#fff" }}>Start Job</Text></>}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {job.status === "in_progress" && (
              <TouchableOpacity 
                onPress={handleCompletePress} 
                disabled={acting} 
                activeOpacity={0.88}
                style={{ borderRadius:18, overflow:"hidden", opacity: acting?0.7:1 }}
              >
                <LinearGradient colors={["#059669","#10B981"]} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{ paddingVertical:16, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:10 }}>
                  {acting ? <ActivityIndicator size="small" color="#fff" />
                    : <><Flag size={18} color="#fff" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#fff" }}>Complete Job</Text></>}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {["assigned","confirmed","in_progress"].includes(job.status) && (
              <TouchableOpacity onPress={() => setShowCancel(true)} disabled={acting} activeOpacity={0.88}
                style={{ paddingVertical:16, borderRadius:18, backgroundColor:"#FFF5F5", borderWidth:1.5, borderColor:"#FEE2E2", flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 }}>
                <XCircle size={17} color="#EF4444" />
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:15, color:"#EF4444" }}>Cancel Job</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}