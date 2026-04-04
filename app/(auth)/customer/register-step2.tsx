import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal,
  ActivityIndicator, TextInput, StatusBar,
  Platform, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from "@/components/ui/lucide-icon";
import { useAuthStore } from "@/store/authStore";
import { Typography } from "@/theme/typography";
import { customerRegister, customerLogin } from "@/services/authService";
import type { CustomerProfile } from "@/types";

/* ─── Feedback modal ────────────────────────────────────────────── */
function FeedbackModal({ title, msg, onClose }: { title: string; msg: string; onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", paddingHorizontal: 24 }}>
        <View style={{ backgroundColor: "#fff", borderRadius: 24, overflow: "hidden" }}>
          <View style={{ backgroundColor: "#EF4444", paddingVertical: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 40 }}>⚠️</Text>
          </View>
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: "#0F172A", marginBottom: 10, textAlign: "center" }}>{title}</Text>
            <View style={{ backgroundColor: "#FEF2F2", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#FECACA", marginBottom: 20, width: "100%" }}>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#991B1B", textAlign: "center", lineHeight: 22 }}>{msg}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width: "100%", paddingVertical: 14, borderRadius: 16, backgroundColor: "#0F172A", alignItems: "center" }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>OK, Fix It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getApiError(err: any, fallback = "Something went wrong."): string {
  const tryExtract = (v: any): string => {
    if (!v) return "";
    if (Array.isArray(v) && v.length > 0) return String(v[0]);
    if (typeof v === "string" && v && !v.startsWith("API Error")) return v;
    if (typeof v === "object" && !Array.isArray(v)) {
      if (v.detail) return tryExtract(v.detail);
      if (v.non_field_errors) return tryExtract(v.non_field_errors);
      if (v.error) return tryExtract(v.error);
      for (const val of Object.values(v)) {
        const s = tryExtract(val);
        if (s) return s;
      }
    }
    return "";
  };
  return tryExtract(err?.data) || fallback;
}

const StepProgress = ({ current, total }: { current: number; total: number }) => (
  <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={{ flex: i < current ? 1.5 : 1, height: 4, borderRadius: 2, backgroundColor: i < current ? "#1E3A8A" : "#E2E8F0", opacity: i < current ? 1 : 0.5 }} />
    ))}
  </View>
);

export default function CustomerRegisterStep2() {
  const params = useLocalSearchParams<{ first_name: string; last_name: string; email: string; phone: string }>();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [feedback, setFeedback] = useState<{ title: string; msg: string } | null>(null);

  const setRole = useAuthStore((s) => s.setRole);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  const validate = () => {
    const e: typeof errors = {};
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (password !== confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Step 1: Register the user
      await customerRegister({
        first_name: params.first_name,
        last_name: params.last_name,
        email: params.email,
        phone: params.phone,
        password,
      });

      // Step 2: Auto-login after successful registration
      const loginResponse = await customerLogin({
        email: params.email,
        password: password,
      });

      // Step 3: Store the auth token and user data in the store
      if (loginResponse.token) {
        setToken(loginResponse.token);
        setRole("customer");
        
        // Build customer profile object matching the CustomerProfile type
        const customerProfile: CustomerProfile = {
          id: loginResponse.id ? Number(loginResponse.id) : 0,
          email: loginResponse.email || params.email,
          first_name: loginResponse.first_name || params.first_name,
          last_name: loginResponse.last_name || params.last_name,
          phone: loginResponse.phone || params.phone,
          role: "customer",
        };
        
        setUser(customerProfile);
      }

      setSuccess(true);
      
      // Step 4: Redirect to home page
      setTimeout(() => router.replace("/(customer)/home" as any), 1600);
      
    } catch (err: any) {
      const data = err?.data ?? {};
      // Inline password error
      if (data?.password) {
        setErrors(e => ({ ...e, password: Array.isArray(data.password) ? data.password[0] : data.password }));
      }
      // Show modal with exact API message
      const msg = getApiError(err, "Registration failed. Please try again.");
      setFeedback({ title: "Registration Failed", msg });
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = (hasError?: string): any => ({
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, height: 52,
    borderColor: hasError ? "#FCA5A5" : "#E2E8F0",
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {feedback && <FeedbackModal title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}

      <LinearGradient colors={["#1E3A8A", "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 32, paddingHorizontal: 24, overflow: "hidden" }}>
        <View style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.05)" }} />
        <TouchableOpacity onPress={() => router.back()}
          style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 26, color: "#fff", marginBottom: 4 }}>Secure Your Account</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Step 2 of 2 — Set your password</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <StepProgress current={2} total={2} />

        {/* Summary */}
        <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "#F1F5F9" }}>
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1, marginBottom: 12 }}>ACCOUNT SUMMARY</Text>
          {[
            { emoji: "👤", label: "Name", value: `${params.first_name} ${params.last_name}` },
            { emoji: "📧", label: "Email", value: params.email },
            { emoji: "📱", label: "Phone", value: params.phone },
          ].map(item => (
            <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#94A3B8", width: 44 }}>{item.label}</Text>
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#0F172A", flex: 1 }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Password */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B", marginBottom: 8 }}>Password <Text style={{ color: "#EF4444" }}>*</Text></Text>
          <View style={inputWrap(errors.password)}>
            <Lock size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <TextInput 
              value={password} 
              onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
              placeholder="Minimum 8 characters" 
              placeholderTextColor="#CBD5E1" 
              secureTextEntry={!showPass}
              style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A" }} 
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)}>
              {showPass ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
            </TouchableOpacity>
          </View>
          {errors.password && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
              <AlertCircle size={12} color="#EF4444" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444" }}>{errors.password}</Text>
            </View>
          )}
        </View>

        {/* Confirm */}
        <View style={{ marginBottom: 28 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize: 13, color: "#64748B", marginBottom: 8 }}>Confirm Password <Text style={{ color: "#EF4444" }}>*</Text></Text>
          <View style={inputWrap(errors.confirm)}>
            <Lock size={18} color="#94A3B8" style={{ marginRight: 10 }} />
            <TextInput 
              value={confirm} 
              onChangeText={t => { setConfirm(t); setErrors(e => ({ ...e, confirm: undefined })); }}
              placeholder="••••••••" 
              placeholderTextColor="#CBD5E1" 
              secureTextEntry={!showPass}
              style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 14, color: "#0F172A" }} 
            />
          </View>
          {errors.confirm && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
              <AlertCircle size={12} color="#EF4444" />
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444" }}>{errors.confirm}</Text>
            </View>
          )}
        </View>

        {/* Terms */}
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
          By creating an account you agree to our{" "}
          <Text style={{ color: "#1E3A8A", fontFamily: Typography.fonts.semibold }}>Terms of Service</Text>
          {" "}and{" "}
          <Text style={{ color: "#1E3A8A", fontFamily: Typography.fonts.semibold }}>Privacy Policy</Text>.
        </Text>

        {/* Submit */}
        {success ? (
          <View style={{ height: 54, borderRadius: 18, backgroundColor: "#10B981", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <CheckCircle size={20} color="#fff" />
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>Account Created! Redirecting...</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}
            style={{ borderRadius: 18, overflow: "hidden", opacity: loading ? 0.75 : 1 }}>
            <LinearGradient colors={["#1E3A8A", "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: 54, alignItems: "center", justifyContent: "center" }}>
              {loading ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>Create My Account</Text>}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 }}>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: "#64748B" }}>Already have an account?{" "}</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/customer/login" as any)}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#1E3A8A" }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}