import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator,
  RefreshControl, Alert, TextInput, Modal,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  User, Mail, Phone, BookOpen, LogOut,
  ChevronRight, AlertCircle, RefreshCw, Settings,
  HelpCircle, Shield, Building2, Edit3, X, Save,
} from "lucide-react-native";
import { useAuthStore }        from "@/store/authStore";
import { Typography }          from "@/theme/typography";
import { getCustomerProfile, updateCustomerProfile, type CustomerProfile, type UpdateCustomerPayload } from "@/services/customerService";

function InfoRow({ icon: Icon, label, value, color = "#1E3A8A", last = false }: {
  icon: any; label: string; value: string; color?: string; last?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: last ? 0 : 1, borderBottomColor: "#F1F5F9" }}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: color + "15", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        <Icon size={17} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#0F172A" }}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function MenuRow({ icon: Icon, label, onPress, danger = false }: {
  icon: any; label: string; onPress: () => void; danger?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: danger ? "#FEF2F2" : "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
        <Icon size={17} color={danger ? "#EF4444" : "#64748B"} />
      </View>
      <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 14, color: danger ? "#EF4444" : "#0F172A", flex: 1 }}>{label}</Text>
      {!danger && <ChevronRight size={16} color="#CBD5E1" />}
    </TouchableOpacity>
  );
}

function EditField({ label, value, onChange, keyboardType = "default", error }: {
  label: string; value: string; onChange: (v: string) => void;
  keyboardType?: any; error?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 12, color: "#64748B", marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange}
        keyboardType={keyboardType}
        style={{
          fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A",
          backgroundColor: error ? "#FEF2F2" : "#F8FAFC",
          borderRadius: 12, borderWidth: 1.5,
          borderColor: error ? "#FCA5A5" : "#E2E8F0",
          paddingHorizontal: 14, paddingVertical: 0,
          height: 48, textAlignVertical: "center",
        }}
      />
      {error && (
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444", marginTop: 4 }}>⚠ {error}</Text>
      )}
    </View>
  );
}

export default function CustomerProfileScreen() {
  const token    = useAuthStore((s) => s.token);
  const setUser  = useAuthStore((s) => s.setUser);
  const logout   = useAuthStore((s) => s.logout);

  const [profile,    setProfile]    = useState<CustomerProfile | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [editOpen,   setEditOpen]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name:  "",
    phone:      "",
    address:    "",
  });

  const fetchProfile = async (isRefresh = false) => {
    if (!token) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await getCustomerProfile(token);
      setProfile(data);
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
      first_name: profile?.first_name ?? "",
      last_name:  profile?.last_name  ?? "",
      phone:      profile?.phone      ?? "",
      address:    profile?.address    ?? "",
    });
    setEditErrors({});
    setEditOpen(true);
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setEditErrors({});
    try {
      const updated = await updateCustomerProfile(
        {
          first_name: editForm.first_name.trim(),
          last_name:  editForm.last_name.trim(),
          phone:      editForm.phone.trim(),
          address:    editForm.address.trim(),
        } as UpdateCustomerPayload,
        token,
      );
      setProfile(updated);
      setUser({ ...updated, role: "customer" } as any);
      setEditOpen(false);
      Alert.alert("✓ Saved", "Your profile has been updated successfully.");
    } catch (err: any) {
      console.log("[ProfileSave]", JSON.stringify(err?.data ?? err));
      const d = err?.data ?? {};
      const inline: Record<string, string> = {};
      const fields = ["first_name", "last_name", "phone", "address"];
      let hasField = false;
      for (const f of fields) {
        if (d[f]) { inline[f] = Array.isArray(d[f]) ? d[f][0] : d[f]; hasField = true; }
      }
      if (hasField) {
        setEditErrors(inline);
        Alert.alert("Fix Errors", "Please fix the highlighted fields.");
      } else {
        const msg = d?.detail ?? d?.non_field_errors?.[0] ?? err?.message ?? "Failed to save profile.";
        Alert.alert("Save Failed", msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/customer/login" as any);
        },
      },
    ]);
  };

  const firstName = profile?.first_name ?? "Customer";
  const lastName  = profile?.last_name  ?? "";
  const initials  = `${firstName[0] ?? "C"}${lastName[0] ?? ""}`.toUpperCase();
  const fullName  = `${firstName} ${lastName}`.trim();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#94A3B8", marginTop: 12 }}>Loading profile…</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 17, color: "#0F172A", marginBottom: 8, textAlign: "center" }}>Could not load profile</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#94A3B8", textAlign: "center", marginBottom: 24 }}>{error}</Text>
        <TouchableOpacity onPress={() => fetchProfile()}
          style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1E3A8A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}>
          <RefreshCw size={16} color="#fff" />
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#fff" }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* ── Edit Modal ── */}
      <Modal visible={editOpen} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
          <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
          <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 20, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <TouchableOpacity onPress={() => setEditOpen(false)}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
              <X size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: saving ? "#94A3B8" : "rgba(34,197,94,0.9)", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }}>
              <Save size={16} color="#fff" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 13, color: "#fff" }}>{saving ? "Saving…" : "Save"}</Text>
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}>
            <EditField 
              label="First Name" 
              value={editForm.first_name} 
              onChange={(v) => setEditForm({ ...editForm, first_name: v })}
              error={editErrors.first_name}
            />
            <EditField 
              label="Last Name" 
              value={editForm.last_name} 
              onChange={(v) => setEditForm({ ...editForm, last_name: v })}
              error={editErrors.last_name}
            />
            <EditField 
              label="Phone" 
              value={editForm.phone} 
              onChange={(v) => setEditForm({ ...editForm, phone: v })}
              keyboardType="phone-pad"
              error={editErrors.phone}
            />
            <EditField 
              label="Address" 
              value={editForm.address} 
              onChange={(v) => setEditForm({ ...editForm, address: v })}
              error={editErrors.address}
            />
          </ScrollView>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor="#1E3A8A" colors={["#1E3A8A"]} />}
      >
        {/* ── Header ── */}
        <LinearGradient colors={["#1E3A8A", "#1E40AF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 40, paddingHorizontal: 20, overflow: "hidden" }}
        >
          <View style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(6,182,212,0.08)" }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={openEdit}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(6,182,212,0.2)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "rgba(6,182,212,0.4)" }}>
              <Edit3 size={14} color="#06B6D4" />
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#06B6D4" }}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center" }}
          >
            {/* Avatar */}
            <View style={{ width: 86, height: 86, borderRadius: 28, backgroundColor: "rgba(6,182,212,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 2.5, borderColor: "rgba(6,182,212,0.5)" }}>
              <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 30, color: "#06B6D4" }}>{initials}</Text>
            </View>

            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 22, color: "#fff", marginBottom: 4 }}>{fullName}</Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{profile?.email}</Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20 }}>

          {/* ── Stats ── */}
          <View style={{ marginTop: 20, marginBottom: 24 }}
          >
            <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3, flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={20} color="#1E3A8A" style={{ marginRight: 10 }} />
              <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 28, color: "#1E3A8A", marginRight: 8 }}>
                {profile?.total_bookings ?? 0}
              </Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#64748B" }}>Total Bookings</Text>
            </View>
          </View>

          {/* ── Personal Info ── */}
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginBottom: 10 }}>PERSONAL INFORMATION</Text>
          <View >
            <View style={{ backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <InfoRow icon={User}  label="First Name" value={profile?.first_name ?? ""} color="#1E3A8A" />
              <InfoRow icon={User}  label="Last Name"  value={profile?.last_name  ?? ""} color="#1E3A8A" />
              <InfoRow icon={Mail}  label="Email"      value={profile?.email      ?? ""} color="#8B5CF6" />
              <InfoRow icon={Phone} label="Phone"      value={profile?.phone      ?? ""} color="#10B981" last />
            </View>
          </View>

          {/* ── Menu ── */}
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1.1, marginBottom: 10, marginTop: 24 }}>MORE</Text>
          <View >
            <View style={{ backgroundColor: "#fff", borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              <MenuRow icon={BookOpen}   label="My Bookings"   onPress={() => router.push("/(customer)/booking" as any)} />
              <MenuRow icon={Settings}   label="Settings"      onPress={() => {}} />
              <MenuRow icon={Building2}  label="Our Offices"   onPress={() => router.push("/(customer)/offices" as any)} />
              <MenuRow icon={HelpCircle} label="Help & Support" onPress={() => {}} />
              <MenuRow icon={Shield}     label="Privacy Policy" onPress={() => {}} />
              <MenuRow icon={LogOut}     label="Sign Out"      onPress={handleLogout} danger />
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}