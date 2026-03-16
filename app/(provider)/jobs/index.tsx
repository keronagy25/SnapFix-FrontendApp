import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  RefreshControl, Alert, TextInput, Modal,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle, XCircle, Play, Flag,
  MapPin, Calendar, Clock, DollarSign,
  AlertCircle, RefreshCw, ChevronRight,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import {
  getIncomingJobs, getMyJobs,
  acceptJob, declineJob, startJob,
  completeJob, providerCancelJob,
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

function ReasonModal({ visible, title, placeholder, confirmLabel = "Confirm", danger = false, onConfirm, onClose }: {
  visible: boolean; title: string; placeholder: string;
  confirmLabel?: string; danger?: boolean;
  onConfirm: (r: string) => void; onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 24 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 14 }}>{title}</Text>
          <TextInput value={reason} onChangeText={setReason} placeholder={placeholder} multiline numberOfLines={3}
            style={{ fontFamily: Typography.fonts.regular, fontSize: 14, backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, paddingVertical: 10, height: 80, textAlignVertical: "top", marginBottom: 16 }} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: "#F1F5F9", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#64748B" }}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onConfirm(reason); setReason(""); }}
              style={{ flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: danger ? "#EF4444" : "#0F172A", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#fff" }}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FinalPriceModal({ visible, onConfirm, onClose }: {
  visible: boolean; onConfirm: (p: string) => void; onClose: () => void;
}) {
  const [price, setPrice] = useState("");
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 24 }}>
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 6 }}>Complete Job</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#64748B", marginBottom: 16 }}>Enter the final price (optional).</Text>
          <TextInput value={price} onChangeText={setPrice} placeholder="e.g. 250.00" keyboardType="decimal-pad"
            style={{ fontFamily: Typography.fonts.regular, fontSize: 14, backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 14, height: 50, marginBottom: 16 }} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, paddingVertical: 13, borderRadius: 14, backgroundColor: "#F1F5F9", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#64748B" }}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onConfirm(price); setPrice(""); }}
              style={{ flex: 2, paddingVertical: 13, borderRadius: 14, backgroundColor: "#10B981", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#fff" }}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function JobCard({ job, onAccept, onDecline, onStart, onComplete, onCancel }: {
  job: ServiceRequest;
  onAccept: (id: string) => void; onDecline: (id: string) => void;
  onStart: (id: string) => void; onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const s = STATUS[job.status] ?? STATUS.pending;
  const showAcceptDecline = job.status === "assigned";
  const showStart = job.status === "confirmed";
  const showComplete = job.status === "in_progress";
  const hasActions = showAcceptDecline || showStart || showComplete;

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ backgroundColor: "#fff", borderRadius: 20, borderWidth: 1.5,
        borderColor: job.is_urgent ? "#FEE2E2" : "#F1F5F9",
        shadowColor: "#0F172A", shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07, shadowRadius: 12, elevation: 3, overflow: "hidden" }}>

        <TouchableOpacity activeOpacity={0.88}
          onPress={() => router.push(`/(provider)/jobs/${job.id}` as any)}
          style={{ padding: 16 }}>

          {job.is_urgent && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FEF2F2", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start", marginBottom: 10 }}>
              <AlertCircle size={12} color="#EF4444" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 10, color: "#EF4444" }}>URGENT</Text>
            </View>
          )}

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#0F172A", marginBottom: 3 }} numberOfLines={1}>{job.title}</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#94A3B8" }}>{job.category?.name}</Text>
            </View>
            <View style={{ backgroundColor: s.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: s.color }}>{s.label}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
            {job.region?.name && <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MapPin size={12} color="#94A3B8" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#64748B" }}>{job.region.name}</Text>
            </View>}
            {job.preferred_date && <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Calendar size={12} color="#94A3B8" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#64748B" }}>{job.preferred_date}</Text>
            </View>}
            {(job.final_price ?? job.estimated_price) && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <DollarSign size={12} color="#10B981" />
                <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#10B981" }}>
                  {job.final_price ?? `~${job.estimated_price}`} EGP
                </Text>
              </View>
            )}
          </View>

          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#475569", lineHeight: 20 }} numberOfLines={2}>{job.description}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 10 }}>
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 12, color: "#64748B" }}>View details</Text>
            <ChevronRight size={13} color="#64748B" />
          </View>
        </TouchableOpacity>

        {hasActions && (
          <View style={{ borderTopWidth: 1, borderTopColor: "#F1F5F9" }}>
            {showAcceptDecline && (
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity onPress={() => onDecline(job.id)} activeOpacity={0.8}
                  style={{ flex: 1, paddingVertical: 13, alignItems: "center", backgroundColor: "#F8FAFC", borderRightWidth: 1, borderRightColor: "#F1F5F9" }}>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#64748B" }}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onAccept(job.id)} activeOpacity={0.8}
                  style={{ flex: 2, paddingVertical: 13, alignItems: "center", backgroundColor: "#0F172A", flexDirection: "row", justifyContent: "center", gap: 6 }}>
                  <CheckCircle size={15} color="#06B6D4" />
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#fff" }}>Accept Job</Text>
                </TouchableOpacity>
              </View>
            )}
            {showStart && (
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity onPress={() => onCancel(job.id)} activeOpacity={0.8}
                  style={{ flex: 1, paddingVertical: 13, alignItems: "center", backgroundColor: "#FFF5F5", borderRightWidth: 1, borderRightColor: "#FEE2E2" }}>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#EF4444" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onStart(job.id)} activeOpacity={0.8}
                  style={{ flex: 2, paddingVertical: 13, alignItems: "center", backgroundColor: "#06B6D4", flexDirection: "row", justifyContent: "center", gap: 6 }}>
                  <Play size={14} color="#fff" fill="#fff" />
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#fff" }}>Start Job</Text>
                </TouchableOpacity>
              </View>
            )}
            {showComplete && (
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity onPress={() => onCancel(job.id)} activeOpacity={0.8}
                  style={{ flex: 1, paddingVertical: 13, alignItems: "center", backgroundColor: "#FFF5F5", borderRightWidth: 1, borderRightColor: "#FEE2E2" }}>
                  <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#EF4444" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onComplete(job.id)} activeOpacity={0.8}
                  style={{ flex: 2, paddingVertical: 13, alignItems: "center", backgroundColor: "#10B981", flexDirection: "row", justifyContent: "center", gap: 6 }}>
                  <Flag size={14} color="#fff" />
                  <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 14, color: "#fff" }}>Mark Complete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default function ProviderJobsScreen() {
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState<"incoming" | "my-jobs">("incoming");
  const [incoming, setIncoming] = useState<ServiceRequest[]>([]);
  const [myJobs, setMyJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [completeId, setCompleteId] = useState<string | null>(null);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [inc, jobs] = await Promise.all([getIncomingJobs(token), getMyJobs(token)]);
      setIncoming(inc);
      setMyJobs(jobs);
    } catch (err: any) {
      setError(err?.data?.detail ?? err?.message ?? "Failed to load jobs.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const doAccept = async (id: string) => {
    if (!token) return;
    try {
      const updated = await acceptJob(id, token);
      setIncoming(p => p.filter(j => j.id !== id));
      setMyJobs(p => [updated, ...p.filter(j => j.id !== id)]);
      Alert.alert("✓ Accepted", "Job confirmed. Check My Jobs tab.");
    } catch (err: any) { Alert.alert("Error", err?.data?.detail ?? err?.message ?? "Could not accept."); }
  };

  const doDecline = async (id: string, reason: string) => {
    if (!token) return;
    setDeclineId(null);
    try {
      await declineJob(id, token, reason);
      setIncoming(p => p.filter(j => j.id !== id));
      Alert.alert("Declined", "Job returned to pool.");
    } catch (err: any) { Alert.alert("Error", err?.data?.detail ?? err?.message ?? "Could not decline."); }
  };

  const doStart = async (id: string) => {
    if (!token) return;
    try {
      const updated = await startJob(id, token);
      setMyJobs(p => p.map(j => j.id === id ? updated : j));
      Alert.alert("✓ Started", "Job is now in progress.");
    } catch (err: any) { Alert.alert("Error", err?.data?.detail ?? err?.message ?? "Could not start."); }
  };

  const doComplete = async (id: string, price: string) => {
    if (!token) return;
    setCompleteId(null);
    try {
      const updated = await completeJob(id, token, price || undefined);
      setMyJobs(p => p.map(j => j.id === id ? updated : j));
      Alert.alert("✓ Completed", "Job complete. Earnings updated.");
    } catch (err: any) { Alert.alert("Error", err?.data?.detail ?? err?.message ?? "Could not complete."); }
  };

  const doCancel = async (id: string, reason: string) => {
    if (!token) return;
    setCancelId(null);
    try {
      const updated = await providerCancelJob(id, token, reason);
      setMyJobs(p => p.map(j => j.id === id ? updated : j));
      setIncoming(p => p.filter(j => j.id !== id));
      Alert.alert("Cancelled", "Job has been cancelled.");
    } catch (err: any) { Alert.alert("Error", err?.data?.detail ?? err?.message ?? "Could not cancel."); }
  };

  const displayed = tab === "incoming" ? incoming : myJobs;

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ReasonModal visible={!!declineId} title="Decline Job" placeholder="Reason (optional)" confirmLabel="Decline" danger
        onConfirm={r => doDecline(declineId!, r)} onClose={() => setDeclineId(null)} />
      <ReasonModal visible={!!cancelId} title="Cancel Job" placeholder="Reason (optional)" confirmLabel="Cancel Job" danger
        onConfirm={r => doCancel(cancelId!, r)} onClose={() => setCancelId(null)} />
      <FinalPriceModal visible={!!completeId}
        onConfirm={p => doComplete(completeId!, p)} onClose={() => setCompleteId(null)} />

      <LinearGradient colors={["#0F172A", "#1E293B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 0, paddingHorizontal: 20 }}>
        <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 24, color: "#fff", marginBottom: 20 }}>Jobs</Text>
        <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 4 }}>
          {(["incoming", "my-jobs"] as const).map(t => {
            const count = t === "incoming" ? incoming.length : myJobs.length;
            const label = t === "incoming" ? "Incoming" : "My Jobs";
            return (
              <TouchableOpacity key={t} onPress={() => setTab(t)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 13, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6,
                  backgroundColor: tab === t ? "rgba(255,255,255,0.12)" : "transparent" }}>
                <Text style={{ fontFamily: tab === t ? Typography.fonts.bold : Typography.fonts.regular, fontSize: 13, color: tab === t ? "#fff" : "rgba(255,255,255,0.5)" }}>
                  {label}
                </Text>
                {count > 0 && (
                  <View style={{ backgroundColor: tab === t ? "#06B6D4" : "rgba(255,255,255,0.2)", width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 10, color: "#fff" }}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#06B6D4" />
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#94A3B8", marginTop: 12 }}>Loading jobs…</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#0F172A", marginBottom: 8 }}>Failed to load</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 20 }}>{error}</Text>
          <TouchableOpacity onPress={() => fetchAll()}
            style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0F172A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}>
            <RefreshCw size={16} color="#06B6D4" />
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#fff" }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor="#06B6D4" colors={["#06B6D4"]} />}>
          {displayed.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontSize: 52, marginBottom: 16 }}>{tab === "incoming" ? "📭" : "🗂️"}</Text>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 8 }}>
                {tab === "incoming" ? "No incoming jobs" : "No jobs yet"}
              </Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#94A3B8", textAlign: "center", lineHeight: 22 }}>
                {tab === "incoming" ? "Go online to start receiving requests." : "Accepted jobs will appear here."}
              </Text>
            </View>
          ) : (
            displayed.map(job => (
              <JobCard key={job.id} job={job}
                onAccept={doAccept} onDecline={id => setDeclineId(id)}
                onStart={doStart} onComplete={id => setCompleteId(id)} onCancel={id => setCancelId(id)} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}