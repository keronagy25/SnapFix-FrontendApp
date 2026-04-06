import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal,
  ActivityIndicator, TextInput, StatusBar, Platform, Image,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle } from "@/components/ui/lucide-icon";
import { useAuthStore }       from "@/store/authStore";
import { Typography }         from "@/theme/typography";
import { providerLogin }      from "@/services/authService";
import { getProviderProfile } from "@/services/providerService";

function FeedbackModal({ title, msg, onClose }: { title:string; msg:string; onClose:()=>void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"center", paddingHorizontal:24 }}>
        <View style={{ backgroundColor:"#fff", borderRadius:24, overflow:"hidden" }}>
          <View style={{ backgroundColor:"#EF4444", paddingVertical:20, alignItems:"center" }}>
            <Text style={{ fontSize:40 }}>⚠️</Text>
          </View>
          <View style={{ padding:24, alignItems:"center" }}>
            <Text style={{ fontFamily:Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:10, textAlign:"center" }}>{title}</Text>
            <View style={{ backgroundColor:"#FEF2F2", borderRadius:14, padding:14, borderWidth:1, borderColor:"#FECACA", marginBottom:20, width:"100%" }}>
              <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:"#991B1B", textAlign:"center", lineHeight:22 }}>{msg}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ width:"100%", paddingVertical:14, borderRadius:16, backgroundColor:"#0F172A", alignItems:"center" }}>
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>OK, Try Again</Text>
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
      if (v.detail)           return tryExtract(v.detail);
      if (v.non_field_errors) return tryExtract(v.non_field_errors);
      if (v.error)            return tryExtract(v.error);
      for (const val of Object.values(v)) { const s = tryExtract(val); if (s) return s; }
    }
    return "";
  };
  return tryExtract(err?.data) || fallback;
}

export default function ProviderLoginScreen() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<{ email?:string; password?:string }>({});
  const [feedback, setFeedback] = useState<{ title:string; msg:string } | null>(null);

  const setToken = useAuthStore((s) => s.setToken);
  const setUser  = useAuthStore((s) => s.setUser);
  const setRole  = useAuthStore((s) => s.setRole);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim())                    e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = "Enter a valid email";
    if (!password)                        e.password = "Password is required";
    else if (password.length < 6)         e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await providerLogin({ email: email.trim(), password });
      if (!res?.token) throw new Error("No token received from server.");
      setToken(res.token);
      setRole("provider");

      let profile: any = null;
      try {
        profile = await getProviderProfile(res.token);
        setUser({ ...profile, role:"provider" } as any);
      } catch {
        setUser({ role:"provider", email: email.trim() } as any);
      }

      const status = profile?.verification_status ?? "pending";
      if (status === "verified") {
        router.replace("/(provider)/dashboard" as any);
      } else {
        router.replace("/(auth)/provider/pending" as any);
      }
    } catch (err: any) {
      const data = err?.data ?? {};
      const nonField = getApiError(err, "");

      // Pending/not verified → redirect silently
      if (nonField.toLowerCase().includes("not verified") || nonField.toLowerCase().includes("pending")) {
        setRole("provider");
        setUser({ role:"provider", email: email.trim() } as any);
        router.replace("/(auth)/provider/pending" as any);
        return;
      }

      // Inline field errors
      if (data?.email)    setErrors(e => ({ ...e, email:    Array.isArray(data.email)    ? data.email[0]    : data.email    }));
      if (data?.password) setErrors(e => ({ ...e, password: Array.isArray(data.password) ? data.password[0] : data.password }));

      // Modal with exact API message
      const msg = getApiError(err, "Incorrect email or password. Please try again.");
      setFeedback({ title:"Login Failed", msg });
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const wrap = (field: string): any => ({
    flexDirection:"row", alignItems:"center", backgroundColor:"#fff",
    borderRadius:14, borderWidth:1.5, paddingHorizontal:14, height:52,
    borderColor: (errors as any)[field] ? "#FCA5A5" : "#E2E8F0",
  });

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      {feedback && <FeedbackModal title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}

      <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop:Platform.OS==="android"?48:60, paddingBottom:40, paddingHorizontal:24, overflow:"hidden" }}>
        <View style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:90, backgroundColor:"rgba(6,182,212,0.07)" }} />
        <TouchableOpacity onPress={() => router.replace("/(auth)/role-select" as any)}
          style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center", marginBottom:28 }}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ width:60, height:60, borderRadius:20, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center", marginBottom:18, borderWidth:1.5, borderColor:"rgba(6,182,212,0.3)" }}>
          <Image source={require("../../../assets/Logo.png")} style={{ width: 80, height: 80, resizeMode: "contain" }} />
        </View>
        <Text style={{ fontFamily:Typography.fonts.extrabold, fontSize:28, color:"#fff", marginBottom:6 }}>Provider Login</Text>
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:"rgba(255,255,255,0.5)", lineHeight:20 }}>Sign in to manage your jobs and earnings</Text>
      </LinearGradient>

      <View style={{ flex:1, paddingHorizontal:24, paddingTop:32 }}>

        {/* Email */}
        <View style={{ marginBottom:16 }}>
          <Text style={{ fontFamily:Typography.fonts.medium, fontSize:13, color:"#64748B", marginBottom:8 }}>Email <Text style={{ color:"#EF4444" }}>*</Text></Text>
          <View style={wrap("email")}>
            <Mail size={18} color="#94A3B8" style={{ marginRight:10 }} />
            <TextInput value={email} onChangeText={t => { setEmail(t); setErrors(e => ({...e, email:undefined})); }}
              placeholder="provider@example.com" placeholderTextColor="#CBD5E1"
              keyboardType="email-address" autoCapitalize="none"
              style={{ flex:1, fontFamily:Typography.fonts.regular, fontSize:14, color:"#0F172A" }} />
          </View>
          {errors.email && <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:5 }}>
            <AlertCircle size={12} color="#EF4444" />
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#EF4444" }}>{errors.email}</Text>
          </View>}
        </View>

        {/* Password */}
        <View style={{ marginBottom:28 }}>
          <Text style={{ fontFamily:Typography.fonts.medium, fontSize:13, color:"#64748B", marginBottom:8 }}>Password <Text style={{ color:"#EF4444" }}>*</Text></Text>
          <View style={wrap("password")}>
            <Lock size={18} color="#94A3B8" style={{ marginRight:10 }} />
            <TextInput value={password} onChangeText={t => { setPassword(t); setErrors(e => ({...e, password:undefined})); }}
              placeholder="••••••••" placeholderTextColor="#CBD5E1" secureTextEntry={!showPass}
              style={{ flex:1, fontFamily:Typography.fonts.regular, fontSize:14, color:"#0F172A" }} />
            <TouchableOpacity onPress={() => setShowPass(v => !v)}>
              {showPass ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
            </TouchableOpacity>
          </View>
          {errors.password && <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:5 }}>
            <AlertCircle size={12} color="#EF4444" />
            <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#EF4444" }}>{errors.password}</Text>
          </View>}
        </View>

        <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}
          style={{ borderRadius:18, overflow:"hidden", opacity:loading?0.75:1 }}>
          <LinearGradient colors={["#06B6D4","#0284C7"]} start={{x:0,y:0}} end={{x:1,y:0}}
            style={{ height:54, alignItems:"center", justifyContent:"center" }}>
            {loading ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ fontFamily:Typography.fonts.bold, fontSize:16, color:"#fff" }}>Sign In</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ backgroundColor:"#F0F9FF", borderRadius:14, padding:14, marginTop:20, flexDirection:"row", gap:8 }}>
          <Text style={{ fontSize:14 }}>💡</Text>
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize:12, color:"#0369A1", flex:1, lineHeight:18 }}>
            After registration, your account must be verified by admin before you can access the dashboard.
          </Text>
        </View>

        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"center", marginTop:28 }}>
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize:15, color:"#64748B" }}>New to SnapFix?{" "}</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/provider/register" as any)}>
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:15, color:"#06B6D4" }}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}