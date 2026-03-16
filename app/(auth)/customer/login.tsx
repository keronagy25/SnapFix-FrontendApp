import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Alert,
  ActivityIndicator, TextInput, StatusBar, Platform,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { useAuthStore }       from "@/store/authStore";
import { Typography }         from "@/theme/typography";
import { customerLogin }      from "@/services/authService";
import { getCustomerProfile } from "@/services/customerService";

export default function CustomerLoginScreen() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<{ email?: string; password?: string; general?: string }>({});

  const setToken = useAuthStore((s) => s.setToken);
  const setUser  = useAuthStore((s) => s.setUser);
  const setRole  = useAuthStore((s) => s.setRole);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!email.trim())                     e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))  e.email    = "Enter a valid email";
    if (!password)                         e.password = "Password is required";
    else if (password.length < 6)          e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      /* ── Step 1: login ── */
      const res = await customerLogin({ email: email.trim(), password });

      if (!res?.token) throw new Error("No token received from server.");

      setToken(res.token);
      setRole("customer");

      /* ── Step 2: fetch profile (non-blocking) ── */
      try {
        const profile = await getCustomerProfile(res.token);
        setUser({ ...profile, role: "customer" } as any);
      } catch {
        setUser({ role: "customer", email: email.trim() } as any);
      }

      /* ── Step 3: navigate ── */
      router.replace("/(customer)/home" as any);

    } catch (err: any) {
      console.log("[CustomerLogin] ERROR:", JSON.stringify(err?.data ?? err?.message ?? err));

      /* ── Parse error message ── */
      const data = err?.data ?? {};
      let msg = "Incorrect email or password. Please try again.";

      if (data?.non_field_errors?.[0])            msg = data.non_field_errors[0];
      else if (data?.detail)                      msg = data.detail;
      else if (data?.email?.[0])                  msg = data.email[0];
      else if (data?.password?.[0])               msg = data.password[0];
      else if (typeof data === "string" && data)  msg = data;
      else if (err?.message && err.message !== `API Error ${err?.status}`) msg = err.message;

      /* ── Show inline field errors ── */
      if (data?.email)    setErrors(e => ({ ...e, email:    Array.isArray(data.email)    ? data.email[0]    : data.email    }));
      if (data?.password) setErrors(e => ({ ...e, password: Array.isArray(data.password) ? data.password[0] : data.password }));

      /* ── Always show general error ── */
      setErrors(e => ({ ...e, general: msg }));
      Alert.alert("Login Failed", msg);
      setPassword("");

    } finally {
      setLoading(false);
    }
  };

  /* ── Input wrapper style ── */
  const wrap = (field: "email" | "password"): any => ({
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1.5, paddingHorizontal: 14, height: 52,
    borderColor: errors[field] ? "#FCA5A5" : "#E2E8F0",
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* ── Header ── */}
      <LinearGradient colors={["#1E3A8A", "#2563EB"]} start={{ x:0, y:0 }} end={{ x:1, y:1 }}
        style={{ paddingTop: Platform.OS === "android" ? 48 : 60, paddingBottom: 40, paddingHorizontal: 24, overflow: "hidden" }}>
        <View style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:90, backgroundColor:"rgba(255,255,255,0.05)" }} />

        <TouchableOpacity onPress={() => router.replace("/(auth)/role-select " as any)}
          style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center", marginBottom:28 }}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        <View >
          <View style={{ width:60, height:60, borderRadius:20, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
            <Text style={{ fontSize:28 }}>👋</Text>
          </View>
          <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:28, color:"#fff", marginBottom:6 }}>Welcome Back</Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:20 }}>
            Sign in to your customer account
          </Text>
        </View>
      </LinearGradient>

      {/* ── Form ── */}
      <View style={{ flex:1, paddingHorizontal:24, paddingTop:32 }}>

        {/* General error banner */}
        {errors.general && (
          <View style={{ flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#FEF2F2", borderRadius:14, padding:14, marginBottom:20, borderWidth:1, borderColor:"#FECACA" }}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={{ flex:1, fontFamily: Typography.fonts.medium, fontSize:13, color:"#EF4444", lineHeight:18 }}>
              {errors.general}
            </Text>
          </View>
        )}

        <View >

          {/* Email */}
          <View style={{ marginBottom:16 }}>
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize:13, color:"#64748B", marginBottom:8 }}>
              Email <Text style={{ color:"#EF4444" }}>*</Text>
            </Text>
            <View style={wrap("email")}>
              <Mail size={18} color="#94A3B8" style={{ marginRight:10 }} />
              <TextInput
                value={email}
                onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email:undefined, general:undefined })); }}
                placeholder="you@example.com" placeholderTextColor="#CBD5E1"
                keyboardType="email-address" autoCapitalize="none"
                style={{ flex:1, fontFamily: Typography.fonts.regular, fontSize:14, color:"#0F172A" }}
              />
            </View>
            {errors.email && (
              <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:5 }}>
                <AlertCircle size={12} color="#EF4444" />
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#EF4444" }}>{errors.email}</Text>
              </View>
            )}
          </View>

          {/* Password */}
          <View style={{ marginBottom:28 }}>
            <Text style={{ fontFamily: Typography.fonts.medium, fontSize:13, color:"#64748B", marginBottom:8 }}>
              Password <Text style={{ color:"#EF4444" }}>*</Text>
            </Text>
            <View style={wrap("password")}>
              <Lock size={18} color="#94A3B8" style={{ marginRight:10 }} />
              <TextInput
                value={password}
                onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password:undefined, general:undefined })); }}
                placeholder="••••••••" placeholderTextColor="#CBD5E1"
                secureTextEntry={!showPass}
                style={{ flex:1, fontFamily: Typography.fonts.regular, fontSize:14, color:"#0F172A" }}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:5 }}>
                <AlertCircle size={12} color="#EF4444" />
                <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#EF4444" }}>{errors.password}</Text>
              </View>
            )}
          </View>

          {/* Submit */}
          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}
            style={{ borderRadius:18, overflow:"hidden", opacity: loading ? 0.75 : 1 }}>
            <LinearGradient colors={["#1E3A8A","#2563EB"]} start={{x:0,y:0}} end={{x:1,y:0}}
              style={{ height:54, alignItems:"center", justifyContent:"center", flexDirection:"row", gap:10 }}>
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#fff" }}>Sign In</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

        </View>

        {/* Register link */}
        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"center", marginTop:28 }}>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:15, color:"#64748B" }}>
            New to SnapFix?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/customer/register-step1" as any)}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:15, color:"#1E3A8A" }}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}