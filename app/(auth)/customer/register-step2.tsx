import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Alert,
  ActivityIndicator, TextInput, StatusBar,
  Platform, ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react-native";
import { useAuthStore }     from "@/store/authStore";
import { Typography }       from "@/theme/typography";
import { customerRegister } from "@/services/authService";
import { Shadows }          from "@/theme/shadows";

const StepProgress = ({ current, total }: { current: number; total: number }) => (
  <View style={{ flexDirection:"row", gap:8, marginBottom:32 }}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={{ flex: i < current ? 1.5 : 1, height:4, borderRadius:2, backgroundColor: i < current ? "#1E3A8A" : "#E2E8F0", opacity: i < current ? 1 : 0.5 }} />
    ))}
  </View>
);

export default function CustomerRegisterStep2() {
  const params = useLocalSearchParams<{ first_name:string; last_name:string; email:string; phone:string }>();

  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [errors,     setErrors]     = useState<{ password?:string; confirm?:string; general?:string }>({});

  const setRole = useAuthStore((s) => s.setRole);

  const validate = () => {
    const e: typeof errors = {};
    if (password.length < 8)       e.password = "Password must be at least 8 characters";
    if (password !== confirm)      e.confirm  = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      await customerRegister({
        first_name: params.first_name,
        last_name:  params.last_name,
        email:      params.email,
        phone:      params.phone,
        password,
      });

      setSuccess(true);
      setRole("customer");
      setTimeout(() => router.replace("/(auth)/customer/login" as any), 1600);

    } catch (err: any) {
      console.log("[CustomerRegister] ERROR:", JSON.stringify(err?.data ?? err?.message ?? err));
      const data = err?.data ?? {};

      // field-level errors
      const newErrors: typeof errors = {};
      if (data?.email)      { newErrors.general  = Array.isArray(data.email)    ? data.email[0]    : data.email;    }
      if (data?.password)   { newErrors.password  = Array.isArray(data.password) ? data.password[0] : data.password; }
      if (data?.phone)      { newErrors.general   = Array.isArray(data.phone)    ? data.phone[0]    : data.phone;    }
      if (data?.first_name) { newErrors.general   = Array.isArray(data.first_name) ? data.first_name[0] : data.first_name; }

      // general fallback
      if (!newErrors.general && !newErrors.password) {
        const msg =
          data?.non_field_errors?.[0] ??
          data?.detail ??
          err?.message ??
          "Registration failed. Please try again.";
        newErrors.general = msg;
      }

      setErrors(newErrors);
      Alert.alert("Registration Failed", newErrors.general ?? newErrors.password ?? "Please fix the errors and try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = (hasError?: string): any => ({
    flexDirection:"row", alignItems:"center", backgroundColor:"#fff",
    borderRadius:14, borderWidth:1.5, paddingHorizontal:14, height:52,
    borderColor: hasError ? "#FCA5A5" : "#E2E8F0",
  });

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <LinearGradient colors={["#1E3A8A","#2563EB"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop: Platform.OS==="android"?48:60, paddingBottom:32, paddingHorizontal:24, overflow:"hidden" }}>
        <View style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:90, backgroundColor:"rgba(255,255,255,0.05)" }} />
        <TouchableOpacity onPress={() => router.back()}
          style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <View >
          <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:26, color:"#fff", marginBottom:4 }}>
            Secure Your Account
          </Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"rgba(255,255,255,0.6)" }}>Step 2 of 2 — Set your password</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding:24, paddingBottom:60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <StepProgress current={2} total={2} />

        {/* Summary card */}
        <View style={{ backgroundColor:"#fff", borderRadius:18, padding:16, marginBottom:24, borderWidth:1, borderColor:"#F1F5F9" }}>
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:"#94A3B8", letterSpacing:1, marginBottom:12 }}>ACCOUNT SUMMARY</Text>
          {[
            { emoji:"👤", label:"Name",  value:`${params.first_name} ${params.last_name}` },
            { emoji:"📧", label:"Email", value: params.email },
            { emoji:"📱", label:"Phone", value: params.phone },
          ].map(item => (
            <View key={item.label} style={{ flexDirection:"row", alignItems:"center", gap:10, paddingVertical:6 }}>
              <Text style={{ fontSize:16 }}>{item.emoji}</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#94A3B8", width:44 }}>{item.label}</Text>
              <Text style={{ fontFamily: Typography.fonts.medium, fontSize:13, color:"#0F172A", flex:1 }}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* General error banner */}
        {errors.general && (
          <View style={{ flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#FEF2F2", borderRadius:14, padding:14, marginBottom:20, borderWidth:1, borderColor:"#FECACA" }}>
            <AlertCircle size={16} color="#EF4444" />
            <Text style={{ flex:1, fontFamily: Typography.fonts.medium, fontSize:13, color:"#EF4444" }}>{errors.general}</Text>
          </View>
        )}

        {/* Password */}
        <View style={{ marginBottom:16 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize:13, color:"#64748B", marginBottom:8 }}>Password <Text style={{ color:"#EF4444" }}>*</Text></Text>
          <View style={inputWrap(errors.password)}>
            <Lock size={18} color="#94A3B8" style={{ marginRight:10 }} />
            <TextInput value={password} onChangeText={t => { setPassword(t); setErrors(e => ({...e, password:undefined, general:undefined})); }}
              placeholder="Minimum 8 characters" placeholderTextColor="#CBD5E1" secureTextEntry={!showPass}
              style={{ flex:1, fontFamily: Typography.fonts.regular, fontSize:14, color:"#0F172A" }} />
            <TouchableOpacity onPress={() => setShowPass(v => !v)}>
              {showPass ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
            </TouchableOpacity>
          </View>
          {errors.password && <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:5 }}>
            <AlertCircle size={12} color="#EF4444" />
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#EF4444" }}>{errors.password}</Text>
          </View>}
        </View>

        {/* Confirm */}
        <View style={{ marginBottom:28 }}>
          <Text style={{ fontFamily: Typography.fonts.medium, fontSize:13, color:"#64748B", marginBottom:8 }}>Confirm Password <Text style={{ color:"#EF4444" }}>*</Text></Text>
          <View style={inputWrap(errors.confirm)}>
            <Lock size={18} color="#94A3B8" style={{ marginRight:10 }} />
            <TextInput value={confirm} onChangeText={t => { setConfirm(t); setErrors(e => ({...e, confirm:undefined})); }}
              placeholder="••••••••" placeholderTextColor="#CBD5E1" secureTextEntry={!showPass}
              style={{ flex:1, fontFamily: Typography.fonts.regular, fontSize:14, color:"#0F172A" }} />
          </View>
          {errors.confirm && <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:5 }}>
            <AlertCircle size={12} color="#EF4444" />
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:11, color:"#EF4444" }}>{errors.confirm}</Text>
          </View>}
        </View>

        {/* Terms */}
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#64748B", textAlign:"center", lineHeight:20, marginBottom:24 }}>
          By creating an account you agree to our{" "}
          <Text style={{ color:"#1E3A8A", fontFamily: Typography.fonts.semibold }}>Terms of Service</Text>
          {" "}and{" "}
          <Text style={{ color:"#1E3A8A", fontFamily: Typography.fonts.semibold }}>Privacy Policy</Text>.
        </Text>

        {/* Submit */}
        {success ? (
          <View style={{ height:54, borderRadius:18, backgroundColor:"#10B981", flexDirection:"row", alignItems:"center", justifyContent:"center", gap:8 }}>
            <CheckCircle size={20} color="#fff" />
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:15, color:"#fff" }}>Account Created! Redirecting…</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}
            style={{ borderRadius:18, overflow:"hidden", opacity: loading?0.75:1 }}>
            <LinearGradient colors={["#1E3A8A","#2563EB"]} start={{x:0,y:0}} end={{x:1,y:0}}
              style={{ height:54, alignItems:"center", justifyContent:"center" }}>
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ fontFamily: Typography.fonts.bold, fontSize:16, color:"#fff" }}>Create My Account</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"center", marginTop:20 }}>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#64748B" }}>Already have an account?{" "}</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/customer/login" as any)}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:14, color:"#1E3A8A" }}>Sign In</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}