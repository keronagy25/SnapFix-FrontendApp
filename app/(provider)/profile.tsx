import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  Alert, TextInput, RefreshControl,
} from "react-native";
import { router }         from "expo-router";
import { MotiView }       from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, User, Mail, Phone, Star,
  Briefcase, CheckCircle, Clock, Edit3,
  Save, X, RefreshCw, AlertCircle,
  DollarSign, Shield, MapPin, TrendingUp,
  Award, BarChart2, Wallet,
} from "lucide-react-native";
import { useAuthStore }          from "@/store/authStore";
import { Typography }            from "@/theme/typography";
import {
  getProviderProfile,
  updateProviderProfile,
  type ProviderProfile,
} from "@/services/providerService";

/* ─── helpers ───────────────────────────────────────────────────── */
const fmt = (v: string | number | null | undefined, suffix = "") =>
  v != null && v !== "" ? `${v}${suffix}` : "—";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-EG", {
    year: "numeric", month: "long", day: "numeric",
  });

/* ══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════════ */
function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginBottom: 10, marginTop: 24 }}>
      {label}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
      {children}
    </View>
  );
}

function InfoRow({ icon: Icon, label, value, color = "#3B82F6", last = false }: { icon: any; label: string; value: string; color?: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: "#F1F5F9" }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: color + "15", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        <Icon size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#0F172A" }} numberOfLines={3}>{value}</Text>
      </View>
    </View>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string; color: string; sub?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: color + "15", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Icon size={17} color={color} />
      </View>
      <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#0F172A" }}>{value}</Text>
      <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 10, color: "#94A3B8", marginTop: 2, textAlign: "center" }}>{label}</Text>
      {sub && <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 10, color: color, marginTop: 1 }}>{sub}</Text>}
    </View>
  );
}

function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
    verified: { label: "Verified",     color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: CheckCircle },
    pending:  { label: "Under Review", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: Clock       },
    rejected: { label: "Rejected",     color: "#EF4444", bg: "#FEF2F2", border: "#FECACA", icon: AlertCircle },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: cfg.bg, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: cfg.border }}>
      <cfg.icon size={13} color={cfg.color} />
      <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

function EditField({ label, value, onChange, multiline = false, keyboardType = "default" }: {
  label: string; value: string; onChange: (v: string) => void;
  multiline?: boolean; keyboardType?: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 12, color: "#64748B", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange}
        multiline={multiline} numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        style={{
          fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A",
          backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1.5, borderColor: "#E2E8F0",
          paddingHorizontal: 14, paddingVertical: multiline ? 10 : 0,
          height: multiline ? 80 : 48, textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════════ */
export default function ProviderProfileScreen() {
  const token    = useAuthStore((s) => s.token);
  const setUser  = useAuthStore((s) => s.setUser);

  const [profile,    setProfile]    = useState<ProviderProfile | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [editOpen,   setEditOpen]   = useState(false);
  const [saving,     setSaving]     = useState(false);

  const [editForm, setEditForm] = useState({
    first_name:          "",
    last_name:           "",
    phone:               "",
    bio:                 "",
    address:             "",
    business_name:       "",
    hourly_rate:         "",
    years_of_experience: "",
  });

  /* ── fetch ── */
  const fetchProfile = async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await getProviderProfile(token);
      setProfile(data);
      setUser({ ...data, role: "provider" } as any);
    } catch (err: any) {
      setError(err?.data?.detail ?? err?.message ?? "Failed to load profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProfile(); }, [token]);

  /* ── open edit ── */
  const openEdit = () => {
    setEditForm({
      first_name:          profile?.first_name          ?? "",
      last_name:           profile?.last_name           ?? "",
      phone:               profile?.phone               ?? "",
      bio:                 profile?.bio                 ?? "",
      address:             profile?.address             ?? "",
      business_name:       profile?.business_name       ?? "",
      hourly_rate:         profile?.hourly_rate         ?? "",
      years_of_experience: String(profile?.years_of_experience ?? ""),
    });
    setEditOpen(true);
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await updateProviderProfile(
        {
          first_name:          editForm.first_name.trim(),
          last_name:           editForm.last_name.trim(),
          phone:               editForm.phone.trim(),
          bio:                 editForm.bio.trim(),
          address:             editForm.address.trim(),
          business_name:       editForm.business_name.trim(),
          hourly_rate:         editForm.hourly_rate.trim(),
          years_of_experience: editForm.years_of_experience
            ? Number(editForm.years_of_experience)
            : undefined,
        },
        token,
      );
      setProfile(updated);
      setUser({ ...updated, role: "provider" } as any);
      setEditOpen(false);
    } catch (err: any) {
      const d   = err?.data ?? {};
      const msg = d.phone?.[0] ?? d.hourly_rate?.[0] ?? d.detail ?? err?.message ?? "Failed to save.";
      Alert.alert("Save Failed", msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── derived ── */
  const firstName = profile?.first_name ?? "Provider";
  const lastName  = profile?.last_name  ?? "";
  const initials  = `${firstName[0] ?? "P"}${lastName[0] ?? ""}`.toUpperCase();
  const fullName  = `${firstName} ${lastName}`.trim();

  /* ════════ LOADING ════════ */
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#94A3B8", marginTop: 12 }}>Loading profile…</Text>
      </View>
    );
  }

  /* ════════ ERROR ════════ */
  if (error && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 8, textAlign: "center" }}>Could not load profile</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 24 }}>{error}</Text>
        <TouchableOpacity onPress={() => fetchProfile()}
          style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0F172A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}>
          <RefreshCw size={16} color="#06B6D4" />
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#fff" }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ════════ MAIN ════════ */
  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor="#06B6D4" colors={["#06B6D4"]} />}
      >
        {/* ══ HEADER ══ */}
        <LinearGradient colors={["#0F172A", "#1E293B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 36, paddingHorizontal: 20, overflow: "hidden" }}
        >
          <View style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(6,182,212,0.07)" }} />
          <View style={{ position: "absolute", bottom: -20, left: -20, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(59,130,246,0.05)" }} />

          {/* Back + Edit */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 28 }}>
            <TouchableOpacity onPress={() => router.back()}
              style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={openEdit}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(6,182,212,0.15)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: "rgba(6,182,212,0.3)" }}>
              <Edit3 size={15} color="#06B6D4" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#06B6D4" }}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar + identity */}
          <MotiView from={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 14 }} style={{ alignItems: "center" }}>
            <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: "rgba(6,182,212,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 2.5, borderColor: "rgba(6,182,212,0.4)" }}>
              <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 32, color: "#06B6D4" }}>{initials}</Text>
            </View>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 22, color: "#fff", marginBottom: 4 }}>{fullName}</Text>
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
              {profile?.business_name ?? ""}
            </Text>
            <VerificationBadge status={profile?.verification_status ?? "pending"} />

            {/* Available badge */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: profile?.is_available ? "#10B981" : "#64748B" }} />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: profile?.is_available ? "#10B981" : "#64748B" }}>
                {profile?.is_available ? "Available for jobs" : "Not available"}
              </Text>
            </View>
          </MotiView>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20 }}>

          {/* ══ STATS ROW 1 ══ */}
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 100, type: "timing", duration: 500 }}
            style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <StatCard icon={Star}      label="Avg. Rating"   value={fmt(profile?.average_rating)} color="#F59E0B" sub={`${profile?.total_reviews ?? 0} reviews`} />
            <StatCard icon={Briefcase} label="Total Jobs"    value={fmt(profile?.total_jobs)}     color="#3B82F6" sub={`${profile?.completed_jobs ?? 0} done`} />
            <StatCard icon={BarChart2} label="Completion"    value={`${profile?.completion_rate ?? 0}%`} color="#8B5CF6" />
          </MotiView>

          {/* ══ STATS ROW 2 ══ */}
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 160, type: "timing", duration: 500 }}
            style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <StatCard icon={Wallet}     label="Balance"        value={`${profile?.available_balance ?? "0.00"} EGP`} color="#10B981" />
            <StatCard icon={TrendingUp} label="Total Earnings" value={`${profile?.total_earnings ?? "0.00"} EGP`}    color="#06B6D4" />
            <StatCard icon={DollarSign} label="Hourly Rate"    value={`${profile?.hourly_rate ?? "—"} EGP`}          color="#EC4899" />
          </MotiView>

          {/* ══ PERSONAL INFO ══ */}
          <SectionLabel label="PERSONAL INFORMATION" />
          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200, type: "timing", duration: 500 }}>
            <Card>
              <InfoRow icon={User}  label="First Name" value={fmt(profile?.first_name)} color="#3B82F6" />
              <InfoRow icon={User}  label="Last Name"  value={fmt(profile?.last_name)}  color="#3B82F6" />
              <InfoRow icon={Mail}  label="Email"      value={fmt(profile?.email)}       color="#8B5CF6" />
              <InfoRow icon={Phone} label="Phone"      value={fmt(profile?.phone)}       color="#10B981" last />
            </Card>
          </MotiView>

          {/* ══ BUSINESS INFO ══ */}
          <SectionLabel label="BUSINESS INFORMATION" />
          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 260, type: "timing", duration: 500 }}>
            <Card>
              <InfoRow icon={Briefcase}  label="Business Name"      value={fmt(profile?.business_name)}                     color="#06B6D4" />
              <InfoRow icon={DollarSign} label="Hourly Rate"        value={fmt(profile?.hourly_rate, " EGP/hr")}            color="#EC4899" />
              <InfoRow icon={Award}      label="Years of Experience" value={fmt(profile?.years_of_experience, " yrs")}       color="#F59E0B" />
              <InfoRow icon={MapPin}     label="Address"            value={fmt(profile?.address?.replace(/\r\n/g, ", "))}   color="#EF4444" last />
            </Card>
          </MotiView>

          {/* ══ BIO ══ */}
          {!!profile?.bio && (
            <>
              <SectionLabel label="BIO" />
              <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 300, type: "timing", duration: 500 }}>
                <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                  <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#475569", lineHeight: 22 }}>{profile.bio}</Text>
                </View>
              </MotiView>
            </>
          )}

          {/* ══ ACCOUNT ══ */}
          <SectionLabel label="ACCOUNT" />
          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 340, type: "timing", duration: 500 }}>
            <Card>
              <InfoRow icon={Shield} label="Verification Status"
                value={profile?.verification_status?.charAt(0).toUpperCase() + (profile?.verification_status?.slice(1) ?? "")}
                color={profile?.verification_status === "verified" ? "#10B981" : "#F59E0B"} />
              <InfoRow icon={Clock} label="Member Since" value={profile?.date_joined ? fmtDate(profile.date_joined) : "—"} color="#64748B" last />
            </Card>
          </MotiView>

          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#CBD5E1", textAlign: "center", marginTop: 20 }}>
            Pull down to refresh
          </Text>
        </View>
      </ScrollView>

      {/* ══ EDIT BOTTOM SHEET ══ */}
      {editOpen && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.6)", justifyContent: "flex-end" }}>
          <MotiView from={{ translateY: 600 }} animate={{ translateY: 0 }} transition={{ type: "spring", damping: 22, stiffness: 180 }}
            style={{ backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 16, paddingBottom: Platform.OS === "ios" ? 40 : 28, maxHeight: "90%" }}
          >
            {/* Handle */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 16 }} />

            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#0F172A" }}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}
                style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                <X size={17} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <EditField label="First Name"    value={editForm.first_name}    onChange={(v) => setEditForm((f) => ({ ...f, first_name: v }))} />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Last Name"     value={editForm.last_name}     onChange={(v) => setEditForm((f) => ({ ...f, last_name: v }))} />
                </View>
              </View>
              <EditField label="Phone"          value={editForm.phone}         onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))}         keyboardType="phone-pad" />
              <EditField label="Business Name"  value={editForm.business_name} onChange={(v) => setEditForm((f) => ({ ...f, business_name: v }))} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <EditField label="Hourly Rate (EGP)" value={editForm.hourly_rate}         onChange={(v) => setEditForm((f) => ({ ...f, hourly_rate: v }))}         keyboardType="decimal-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Years Experience"  value={editForm.years_of_experience} onChange={(v) => setEditForm((f) => ({ ...f, years_of_experience: v }))} keyboardType="number-pad" />
                </View>
              </View>
              <EditField label="Address"  value={editForm.address} onChange={(v) => setEditForm((f) => ({ ...f, address: v }))}  multiline />
              <EditField label="Bio"      value={editForm.bio}     onChange={(v) => setEditForm((f) => ({ ...f, bio: v }))}       multiline />

              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>
                ✉️ Email cannot be changed. Contact support if needed.
              </Text>

              <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.88} style={{ borderRadius: 18, overflow: "hidden", opacity: saving ? 0.7 : 1, marginBottom: 8 }}>
                <LinearGradient colors={["#06B6D4", "#0284C7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}>
                  {saving
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Save size={17} color="#fff" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>Save Changes</Text></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </MotiView>
        </View>
      )}
    </View>
  );
}