import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  RefreshControl, Alert, TextInput, Modal,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle, XCircle, Play, Flag, Zap,
  MapPin, Calendar, Clock, DollarSign,
  AlertCircle, RefreshCw, ChevronRight,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { Typography }   from "@/theme/typography";
import {
  getIncomingJobs, getBookings, getOpenJobs,
  acceptJob, declineJob, startJob,
  completeJob, providerCancelJob, pickJob,
  type ServiceRequest,
} from "@/services/bookingService";


const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Pending",     color: "#F59E0B", bg: "#FFFBEB" },
  assigned:    { label: "Assigned",    color: "#3B82F6", bg: "#EFF6FF" },
  confirmed:   { label: "Confirmed",   color: "#8B5CF6", bg: "#F5F3FF" },
  in_progress: { label: "In Progress", color: "#06B6D4", bg: "#ECFEFF" },
  completed:   { label: "Completed",   color: "#10B981", bg: "#ECFDF5" },
  cancelled:   { label: "Cancelled",   color: "#EF4444", bg: "#FEF2F2" },
  declined:    { label: "Declined",    color: "#94A3B8", bg: "#F8FAFC" },
};
/* ─── Parse any API error body into a readable string ─────────── */
function getErrMsg(err: any, fallback = "Something went wrong."): string {
  // The API can return: ["message"], {detail:"msg"}, {non_field_errors:["msg"]}, "msg"
  // err.data is the parsed JSON body, err.message is "API Error 400"
  const tryExtract = (v: any): string => {
    if (!v) return "";
    if (Array.isArray(v) && v.length > 0) return String(v[0]);
    if (typeof v === "string" && v && !v.startsWith("API Error")) return v;
    if (typeof v === "object" && !Array.isArray(v)) {
      if (v.detail)           return tryExtract(v.detail);
      if (v.non_field_errors) return tryExtract(v.non_field_errors);
      if (v.error)            return tryExtract(v.error);
      if (v.message)          return tryExtract(v.message);
      for (const val of Object.values(v)) {
        const s = tryExtract(val);
        if (s) return s;
      }
    }
    return "";
  };
  const result = tryExtract(err?.data) || tryExtract(err?.message);
  return result || fallback;
}



/* ─── Reason modal ─────────────────────────────────────────────── */
function ReasonModal({ visible, title, confirmLabel = "Confirm", danger = false, onConfirm, onClose }: {
  visible: boolean; title: string; confirmLabel?: string; danger?: boolean;
  onConfirm: (r: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, padding:24 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize:17, color:"#0F172A", marginBottom:14 }}>{title}</Text>
          <TextInput value={reason} onChangeText={setReason} placeholder="Reason (optional)" multiline numberOfLines={3}
            style={{ fontFamily: Typography.fonts.regular, fontSize:14, backgroundColor:"#F8FAFC", borderRadius:12, borderWidth:1.5, borderColor:"#E2E8F0", paddingHorizontal:14, paddingVertical:10, height:80, textAlignVertical:"top", marginBottom:16 }} />
          <View style={{ flexDirection:"row", gap:10 }}>
            <TouchableOpacity onPress={onClose} style={{ flex:1, paddingVertical:13, borderRadius:14, backgroundColor:"#F1F5F9", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onConfirm(reason); setReason(""); }}
              style={{ flex:2, paddingVertical:13, borderRadius:14, backgroundColor: danger ? "#EF4444" : "#0F172A", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Final price modal ─────────────────────────────────────────── */
function FinalPriceModal({ visible, onConfirm, onClose }: {
  visible: boolean; onConfirm: (p: string) => void; onClose: () => void;
}) {
  const [price, setPrice] = useState("");
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, padding:24 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize:17, color:"#0F172A", marginBottom:6 }}>Complete Job</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#64748B", marginBottom:16 }}>Enter the final price (optional).</Text>
          <TextInput value={price} onChangeText={setPrice} placeholder="e.g. 250.00" keyboardType="decimal-pad"
            style={{ fontFamily: Typography.fonts.regular, fontSize:14, backgroundColor:"#F8FAFC", borderRadius:12, borderWidth:1.5, borderColor:"#E2E8F0", paddingHorizontal:14, height:50, marginBottom:16 }} />
          <View style={{ flexDirection:"row", gap:10 }}>
            <TouchableOpacity onPress={onClose} style={{ flex:1, paddingVertical:13, borderRadius:14, backgroundColor:"#F1F5F9", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onConfirm(price); setPrice(""); }}
              style={{ flex:2, paddingVertical:13, borderRadius:14, backgroundColor:"#10B981", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Action feedback modal ─────────────────────────────────────── */
function ActionFeedbackModal({ data, onClose }: {
  data: { title: string; msg: string } | null; onClose: () => void;
}) {
  if (!data) return null;
  const isSuccess = data.title.startsWith("✓");
  const isWarning = data.title.includes("😔") || data.title.includes("Cannot") || data.title.includes("Already");
  const bgColor  = isSuccess ? "#ECFDF5" : "#FEF2F2";
  const border   = isSuccess ? "#A7F3D0" : "#FECACA";
  const txtColor = isSuccess ? "#065F46" : "#991B1B";
  const emoji    = isSuccess ? "✅" : "⚠️";

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, overflow:"hidden" }}>
          {/* Colored top bar */}
          <View style={{ backgroundColor: isSuccess ? "#10B981" : "#EF4444", paddingVertical:20, alignItems:"center" }}>
            <Text style={{ fontSize:40 }}>{emoji}</Text>
          </View>
          {/* Content */}
          <View style={{ padding:24, alignItems:"center" }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:10, textAlign:"center" }}>
              {data.title}
            </Text>
            <View style={{ backgroundColor:bgColor, borderRadius:14, padding:14, borderWidth:1, borderColor:border, marginBottom:20, width:"100%" }}>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:txtColor, textAlign:"center", lineHeight:22 }}>
                {data.msg}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}
              style={{ width:"100%", paddingVertical:14, borderRadius:16, backgroundColor: isSuccess ? "#10B981" : "#0F172A", alignItems:"center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:15, color:"#fff" }}>
                {isSuccess ? "Got it!" : "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ─── Job card ─────────────────────────────────────────────────── */
function JobCard({ job, isOpenPool, onAccept, onDecline, onStart, onComplete, onCancel, onPick }: {
  job: ServiceRequest; isOpenPool?: boolean;
  onAccept:   (id: string) => void; onDecline:  (id: string) => void;
  onStart:    (id: string) => void; onComplete: (id: string) => void;
  onCancel:   (id: string) => void; onPick:     (id: string) => void;
}) {
  const s = STATUS[job.status] ?? STATUS.pending;
  const showAcceptDecline = job.status === "assigned" && !isOpenPool;
  const showStart         = job.status === "confirmed";
  const showComplete      = job.status === "in_progress";
  const hasActions        = isOpenPool || showAcceptDecline || showStart || showComplete;

  return (
    <View style={{ marginBottom:12 }}>
      <View style={{
        backgroundColor:"#fff", borderRadius:20,
        borderWidth:1.5, borderColor: job.is_urgent ? "#FEE2E2" : "#F1F5F9",
        shadowColor:"#0F172A", shadowOffset:{width:0,height:3},
        shadowOpacity:0.07, shadowRadius:12, elevation:3, overflow:"hidden",
      }}>
        <TouchableOpacity activeOpacity={0.88}
          onPress={() => !isOpenPool && router.push(`/(provider)/jobs/${job.id}` as any)}
          style={{ padding:16 }}>

          {job.is_urgent && (
            <View style={{ flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#FEF2F2", paddingHorizontal:10, paddingVertical:4, borderRadius:20, alignSelf:"flex-start", marginBottom:10 }}>
              <AlertCircle size={12} color="#EF4444" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:10, color:"#EF4444" }}>URGENT</Text>
            </View>
          )}

          <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <View style={{ flex:1, marginRight:10 }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:15, color:"#0F172A", marginBottom:3 }} numberOfLines={1}>{job.title}</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#94A3B8" }}>{job.category?.name}</Text>
            </View>
            <View style={{ backgroundColor:s.bg, paddingHorizontal:10, paddingVertical:5, borderRadius:20 }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:s.color }}>{s.label}</Text>
            </View>
          </View>

          <View style={{ flexDirection:"row", gap:14, flexWrap:"wrap", marginBottom:10 }}>
            {job.region?.name && <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
              <MapPin size={12} color="#94A3B8" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#64748B" }}>{job.region.name}</Text>
            </View>}
            {job.preferred_date && <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
              <Calendar size={12} color="#94A3B8" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#64748B" }}>{job.preferred_date}</Text>
            </View>}
            {job.preferred_time && <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
              <Clock size={12} color="#94A3B8" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#64748B" }}>{job.preferred_time.slice(0,5)}</Text>
            </View>}
            {(job.final_price ?? job.estimated_price) && (
              <View style={{ flexDirection:"row", alignItems:"center", gap:4 }}>
                <DollarSign size={12} color="#10B981" />
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:12, color:"#10B981" }}>
                  {job.final_price ?? `~${job.estimated_price}`} EGP
                </Text>
              </View>
            )}
          </View>

          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#475569", lineHeight:20 }} numberOfLines={2}>{job.description}</Text>

          {!isOpenPool && (
            <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"flex-end", gap:4, marginTop:10 }}>
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize:12, color:"#64748B" }}>View details</Text>
              <ChevronRight size={13} color="#64748B" />
            </View>
          )}
        </TouchableOpacity>

        {/* Action buttons — outside card touchable */}
        {hasActions && (
          <View style={{ borderTopWidth:1, borderTopColor:"#F1F5F9" }}>

            {/* Open pool — Pick button */}
            {isOpenPool && (
              <TouchableOpacity onPress={() => onPick(job.id)} activeOpacity={0.8}
                style={{ paddingVertical:14, alignItems:"center", backgroundColor:"#0F172A", flexDirection:"row", justifyContent:"center", gap:8 }}>
                <Zap size={16} color="#06B6D4" />
                <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>Pick This Job</Text>
              </TouchableOpacity>
            )}

            {/* Incoming — Accept / Decline */}
            {showAcceptDecline && (
              <View style={{ flexDirection:"row" }}>
                <TouchableOpacity onPress={() => onDecline(job.id)} activeOpacity={0.8}
                  style={{ flex:1, paddingVertical:13, alignItems:"center", backgroundColor:"#F8FAFC", borderRightWidth:1, borderRightColor:"#F1F5F9" }}>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#64748B" }}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onAccept(job.id)} activeOpacity={0.8}
                  style={{ flex:2, paddingVertical:13, alignItems:"center", backgroundColor:"#0F172A", flexDirection:"row", justifyContent:"center", gap:6 }}>
                  <CheckCircle size={15} color="#06B6D4" />
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>Accept Job</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Start */}
            {showStart && (
              <View style={{ flexDirection:"row" }}>
                <TouchableOpacity onPress={() => onCancel(job.id)} activeOpacity={0.8}
                  style={{ flex:1, paddingVertical:13, alignItems:"center", backgroundColor:"#FFF5F5", borderRightWidth:1, borderRightColor:"#FEE2E2" }}>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#EF4444" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onStart(job.id)} activeOpacity={0.8}
                  style={{ flex:2, paddingVertical:13, alignItems:"center", backgroundColor:"#06B6D4", flexDirection:"row", justifyContent:"center", gap:6 }}>
                  <Play size={14} color="#fff" fill="#fff" />
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>Start Job</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Complete */}
            {showComplete && (
              <View style={{ flexDirection:"row" }}>
                <TouchableOpacity onPress={() => onCancel(job.id)} activeOpacity={0.8}
                  style={{ flex:1, paddingVertical:13, alignItems:"center", backgroundColor:"#FFF5F5", borderRightWidth:1, borderRightColor:"#FEE2E2" }}>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#EF4444" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onComplete(job.id)} activeOpacity={0.8}
                  style={{ flex:2, paddingVertical:13, alignItems:"center", backgroundColor:"#10B981", flexDirection:"row", justifyContent:"center", gap:6 }}>
                  <Flag size={14} color="#fff" />
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize:14, color:"#fff" }}>Mark Complete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════════ */
type Tab = "open" | "incoming" | "my-jobs";

export default function ProviderJobsScreen() {
  const token = useAuthStore((s) => s.token);

  const [tab,        setTab]        = useState<Tab>("open");
  const [openJobs,   setOpenJobs]   = useState<ServiceRequest[]>([]);
  const [incoming,   setIncoming]   = useState<ServiceRequest[]>([]);
  const [myJobs,     setMyJobs]     = useState<ServiceRequest[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [declineId,  setDeclineId]  = useState<string | null>(null);
  const [cancelId,   setCancelId]   = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ title: string; msg: string } | null>(null);
  const [pickingId,  setPickingId]  = useState<string | null>(null);  // which job is being picked
  const [pickError,  setPickError]  = useState<{ title: string; msg: string } | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [open, inc, jobs] = await Promise.all([
        getOpenJobs(token),
        getIncomingJobs(token),
        getBookings(token),
      ]);
      setOpenJobs(open);
      setIncoming(inc);
      setMyJobs(jobs);
    } catch (err: any) {
      setError(err?.data?.detail ?? err?.message ?? "Failed to load jobs.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Actions ── */
  const doPick = async (id: string) => {
    if (!token) return;
    try {
      const updated = await pickJob(id, token);
      setOpenJobs(p => p.filter(j => j.id !== id));
      setIncoming(p => [updated, ...p]);
      setTab("incoming");
      setActionError({ title: "✓ Job Picked!", msg: "Job moved to Incoming. Tap Accept to confirm it." });
    } catch (err: any) {
      const status = err?.status;
      const d      = err?.data ?? {};

      console.log("[doPick]", status, JSON.stringify(err?.data));

      // extractApiMessage handles: ["msg"], {detail:"msg"}, {non_field_errors:["msg"]}
      const raw = getErrMsg(err, "");

      let title = "Cannot Pick Job";
      let msg   = raw || "Could not pick this job. Please try again.";

      if (status === 404) {
        title = "Job No Longer Available";
        msg   = "Another provider just picked this job. Try another one.";
      } else if (status === 400 && raw) {
        const lower = raw.toLowerCase();
        if (lower.includes("active") || lower.includes("already") || lower.includes("complete") || lower.includes("cancel")) {
          title = "You Have an Active Job";
        }
        msg = raw; // Always show exact API message
      }

      setActionError({ title, msg });
    }
  };

  const doAccept = async (id: string) => {
    if (!token) return;
    try {
      const updated = await acceptJob(id, token);
      setIncoming(p => p.filter(j => j.id !== id));
      setMyJobs(p => [updated, ...p.filter(j => j.id !== id)]);
      setActionError({ title: "✓ Job Accepted!", msg: "Job confirmed and moved to My Jobs. Get ready!" });
    } catch (err: any) { setActionError({ title: "Cannot Accept Job", msg: getErrMsg(err, "Could not accept job.") }); }
  };

  const doDecline = async (id: string, reason: string) => {
    if (!token) return;
    setDeclineId(null);
    try {
      await declineJob(id, token, reason);
      setIncoming(p => p.filter(j => j.id !== id));
      setActionError({ title: "✓ Job Declined", msg: "Job returned to the open pool. Another provider can now pick it." });
    } catch (err: any) { setActionError({ title: "Cannot Decline Job", msg: getErrMsg(err, "Could not decline job.") }); }
  };

  const doStart = async (id: string) => {
    if (!token) return;
    try {
      const updated = await startJob(id, token);
      setMyJobs(p => p.map(j => j.id === id ? updated : j));
      setActionError({ title: "✓ Job Started!", msg: "You're now on-site. Mark complete when done." });
    } catch (err: any) { setActionError({ title: "Cannot Start Job", msg: getErrMsg(err, "Could not start job.") }); }
  };

  const doComplete = async (id: string, price: string) => {
    if (!token) return;
    setCompleteId(null);
    try {
      const updated = await completeJob(id, token, price || undefined);
      setMyJobs(p => p.map(j => j.id === id ? updated : j));
      setActionError({ title: "✓ Job Completed!", msg: "Great work! Your earnings have been updated." });
    } catch (err: any) { setActionError({ title: "Cannot Complete Job", msg: getErrMsg(err, "Could not complete job.") }); }
  };

  const doCancel = async (id: string, reason: string) => {
    if (!token) return;
    setCancelId(null);
    try {
      const updated = await providerCancelJob(id, token, reason);
      setMyJobs(p => p.map(j => j.id === id ? updated : j));
      setIncoming(p => p.filter(j => j.id !== id));
      setActionError({ title: "✓ Job Cancelled", msg: "The job has been cancelled successfully." });
    } catch (err: any) { setActionError({ title: "Cannot Cancel Job", msg: getErrMsg(err, "Could not cancel job.") }); }
  };

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "open",     label: "Open Pool", count: openJobs.length },
    { key: "incoming", label: "Incoming",  count: incoming.length  },
    { key: "my-jobs",  label: "My Jobs",   count: myJobs.length    },
  ];

  const displayed = tab === "open" ? openJobs : tab === "incoming" ? incoming : myJobs;

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ReasonModal visible={!!declineId} title="Decline Job" confirmLabel="Decline" danger
        onConfirm={r => doDecline(declineId!, r)} onClose={() => setDeclineId(null)} />
      <ReasonModal visible={!!cancelId}  title="Cancel Job"  confirmLabel="Cancel Job" danger
        onConfirm={r => doCancel(cancelId!, r)}   onClose={() => setCancelId(null)}  />
      <FinalPriceModal visible={!!completeId}
        onConfirm={p => doComplete(completeId!, p)} onClose={() => setCompleteId(null)} />
      <ActionFeedbackModal data={actionError} onClose={() => setActionError(null)} />

      {/* Header */}
      <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop: Platform.OS==="android"?48:60, paddingBottom:0, paddingHorizontal:20 }}>
        <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:24, color:"#fff", marginBottom:16 }}>Jobs</Text>

        {/* 3-tab switcher */}
        <View style={{ flexDirection:"row", backgroundColor:"rgba(255,255,255,0.07)", borderRadius:16, padding:4 }}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)}
              style={{ flex:1, paddingVertical:9, borderRadius:13, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:5,
                backgroundColor: tab===t.key ? "rgba(255,255,255,0.12)" : "transparent" }}>
              <Text style={{ fontFamily: tab===t.key ? Typography.fonts.bold : Typography.fonts.regular, fontSize:12,
                color: tab===t.key ? "#fff" : "rgba(255,255,255,0.5)" }}>
                {t.label}
              </Text>
              {t.count > 0 && (
                <View style={{ backgroundColor: tab===t.key ? "#06B6D4" : "rgba(255,255,255,0.2)", minWidth:18, height:18, borderRadius:9, alignItems:"center", justifyContent:"center", paddingHorizontal:3 }}>
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize:10, color:"#fff" }}>{t.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Open pool info banner */}
        {tab === "open" && (
          <View style={{ backgroundColor:"rgba(6,182,212,0.12)", borderRadius:12, padding:10, marginTop:12, flexDirection:"row", alignItems:"center", gap:8 }}>
            <Zap size={14} color="#06B6D4" />
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:12, color:"#67E8F9", flex:1 }}>
              Pick a job to self-assign. You can only hold one active job at a time.
            </Text>
          </View>
        )}
      </LinearGradient>

      {loading ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
          <ActivityIndicator size="large" color="#06B6D4" />
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#94A3B8", marginTop:12 }}>Loading jobs…</Text>
        </View>
      ) : error ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal:32 }}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom:16 }} />
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#0F172A", marginBottom:8 }}>Failed to load</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#94A3B8", textAlign:"center", marginBottom:20 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAll()}
            style={{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#0F172A", paddingHorizontal:24, paddingVertical:12, borderRadius:16 }}>
            <RefreshCw size={16} color="#06B6D4" />
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding:16, paddingBottom:100 }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor="#06B6D4" colors={["#06B6D4"]} />}>
          {displayed.length === 0 ? (
            <View style={{ alignItems:"center", paddingTop:60 }}>
              <Text style={{ fontSize:52, marginBottom:16 }}>
                {tab === "open" ? "🔍" : tab === "incoming" ? "📭" : "🗂️"}
              </Text>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:17, color:"#0F172A", marginBottom:8, textAlign:"center" }}>
                {tab === "open"     ? "No open jobs right now"  :
                 tab === "incoming" ? "No incoming jobs"        : "No jobs yet"}
              </Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#94A3B8", textAlign:"center", lineHeight:22 }}>
                {tab === "open"     ? "Check back soon — new requests appear here."  :
                 tab === "incoming" ? "Pick a job from the Open Pool to get started." :
                 "Accepted jobs will appear here."}
              </Text>
            </View>
          ) : (
            displayed.map(job => (
              <JobCard
                key={job.id}
                job={job}
                isOpenPool={tab === "open"}
                onPick={doPick}
                onAccept={doAccept}
                onDecline={id => setDeclineId(id)}
                onStart={doStart}
                onComplete={id => setCompleteId(id)}
                onCancel={id => setCancelId(id)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}