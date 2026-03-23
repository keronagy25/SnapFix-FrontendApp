import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, Modal,
  ActivityIndicator, TextInput, StatusBar, Platform, ScrollView,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { User, Mail, Phone, Lock, ArrowLeft, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react-native";
import { useAuthStore }     from "@/store/authStore";
import { Typography }       from "@/theme/typography";
import { providerRegister } from "@/services/authService";

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
              <Text style={{ fontFamily:Typography.fonts.bold, fontSize:15, color:"#fff" }}>OK, Fix It</Text>
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
      for (const val of Object.values(v)) { const s = tryExtract(val); if (s) return s; }
    }
    return "";
  };
  return tryExtract(err?.data) || fallback;
}

interface Form { first_name:string; last_name:string; email:string; phone:string; password:string; }

function FieldRow({ label, value, onChange, placeholder, icon:Icon, keyboard="default", capitalize="none",
  secure=false, showToggle=false, onToggle, error, hint, maxLen }: {
  label:string; value:string; onChange:(v:string)=>void; placeholder:string; icon:any;
  keyboard?:any; capitalize?:any; secure?:boolean; showToggle?:boolean; onToggle?:()=>void;
  error?:string; hint?:string; maxLen?:number;
}) {
  return (
    <View style={{ marginBottom:16 }}>
      <Text style={{ fontFamily:Typography.fonts.medium, fontSize:13, color:"#64748B", marginBottom:8 }}>
        {label} <Text style={{ color:"#EF4444" }}>*</Text>
      </Text>
      <View style={{ flexDirection:"row", alignItems:"center", backgroundColor:"#fff", borderRadius:14, borderWidth:1.5, paddingHorizontal:14, height:52, borderColor:error?"#FCA5A5":"#E2E8F0" }}>
        <Icon size={18} color="#94A3B8" style={{ marginRight:10 }} />
        <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#CBD5E1"
          keyboardType={keyboard} autoCapitalize={capitalize} secureTextEntry={secure} maxLength={maxLen}
          style={{ flex:1, fontFamily:Typography.fonts.regular, fontSize:14, color:"#0F172A" }} />
        {showToggle && onToggle && (
          <TouchableOpacity onPress={onToggle}>
            {secure ? <Eye size={18} color="#94A3B8" /> : <EyeOff size={18} color="#94A3B8" />}
          </TouchableOpacity>
        )}
      </View>
      {error && <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:5 }}>
        <AlertCircle size={12} color="#EF4444" />
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#EF4444" }}>{error}</Text>
      </View>}
      {!error && value.length > 0 && <View style={{ flexDirection:"row", alignItems:"center", gap:5, marginTop:5 }}>
        <CheckCircle size={12} color="#10B981" />
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#10B981" }}>Looks good</Text>
      </View>}
      {hint && !error && value.length === 0 && (
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:11, color:"#94A3B8", marginTop:4 }}>{hint}</Text>
      )}
    </View>
  );
}

export default function ProviderRegisterScreen() {
  const [form,     setForm]     = useState<Form>({ first_name:"", last_name:"", email:"", phone:"", password:"" });
  const [errors,   setErrors]   = useState<Partial<Form>>({});
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [feedback, setFeedback] = useState<{ title:string; msg:string } | null>(null);

  const setToken = useAuthStore((s) => s.setToken);
  const setUser  = useAuthStore((s) => s.setUser);
  const setRole  = useAuthStore((s) => s.setRole);

  const set = (field: keyof Form) => (val: string) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (form.first_name.trim().length < 2) e.first_name = "At least 2 characters";
    if (form.last_name.trim().length  < 2) e.last_name  = "At least 2 characters";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email      = "Enter a valid email address";
    if (!/^01[0-9]{9}$/.test(form.phone)) e.phone      = "Must be 11 digits starting with 01";
    if (form.password.length < 6)          e.password   = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await providerRegister({
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        email:      form.email.trim().toLowerCase(),
        phone:      form.phone.trim(),
        password:   form.password,
      });
      setToken(res.token);
      setRole("provider");
      setUser({ id:res.id??"", first_name:form.first_name.trim(), last_name:form.last_name.trim(),
        email:form.email.trim(), phone:form.phone.trim(), role:"provider", verification_status:"pending" } as any);
      router.replace("/(auth)/provider/pending" as any);
    } catch (err: any) {
      const data = err?.data ?? {};
      // Map field errors inline
      const newErrors: typeof errors = {};
      if (data?.first_name) newErrors.first_name = Array.isArray(data.first_name) ? data.first_name[0] : data.first_name;
      if (data?.last_name)  newErrors.last_name  = Array.isArray(data.last_name)  ? data.last_name[0]  : data.last_name;
      if (data?.email)      newErrors.email      = Array.isArray(data.email)      ? data.email[0]      : data.email;
      if (data?.phone)      newErrors.phone      = Array.isArray(data.phone)      ? data.phone[0]      : data.phone;
      if (data?.password)   newErrors.password   = Array.isArray(data.password)   ? data.password[0]   : data.password;
      setErrors(newErrors);

      // Show modal with best message
      const msg = getApiError(err, "Registration failed. Please try again.");
      const hasFieldErrors = Object.keys(newErrors).length > 0;
      setFeedback({
        title: "Registration Failed",
        msg: hasFieldErrors ? "Please fix the highlighted fields above." : msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      {feedback && <FeedbackModal title={feedback.title} msg={feedback.msg} onClose={() => setFeedback(null)} />}

      <LinearGradient colors={["#0F172A","#1E293B"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop:Platform.OS==="android"?48:60, paddingBottom:32, paddingHorizontal:24, overflow:"hidden" }}>
        <View style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:90, backgroundColor:"rgba(6,182,212,0.07)" }} />
        <TouchableOpacity onPress={() => router.back()}
          style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.08)", alignItems:"center", justifyContent:"center", marginBottom:24 }}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:4, letterSpacing:0.6 }}>PROVIDER REGISTRATION</Text>
        <Text style={{ fontFamily:Typography.fonts.extrabold, fontSize:28, color:"#fff", lineHeight:34 }}>
          Join as a{"\n"}<Text style={{ color:"#06B6D4" }}>Professional</Text>
        </Text>
        <Text style={{ fontFamily:Typography.fonts.regular, fontSize:13, color:"rgba(255,255,255,0.5)", marginTop:8 }}>Create your account and start receiving jobs</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding:24, paddingBottom:60 }}>
        <FieldRow label="First Name"    value={form.first_name} onChange={set("first_name")} placeholder="e.g. Shady"           icon={User}  capitalize="words"       error={errors.first_name} />
        <FieldRow label="Last Name"     value={form.last_name}  onChange={set("last_name")}  placeholder="e.g. Abadeer"         icon={User}  capitalize="words"       error={errors.last_name}  />
        <FieldRow label="Email Address" value={form.email}      onChange={set("email")}      placeholder="provider@example.com"  icon={Mail}  keyboard="email-address" error={errors.email}      />
        <FieldRow label="Phone Number"  value={form.phone}      onChange={set("phone")}      placeholder="01xxxxxxxxx"           icon={Phone} keyboard="phone-pad"     error={errors.phone} hint="11 digits starting with 01" maxLen={11} />
        <FieldRow label="Password"      value={form.password}   onChange={set("password")}   placeholder="Minimum 6 characters"  icon={Lock}  secure={!showPass}       error={errors.password}
          showToggle onToggle={() => setShowPass(v => !v)} hint="At least 6 characters" />

        <View style={{ height:1, backgroundColor:"#F1F5F9", marginVertical:24 }} />

        <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}
          style={{ borderRadius:18, overflow:"hidden", opacity:loading?0.75:1 }}>
          <LinearGradient colors={["#06B6D4","#0284C7"]} start={{x:0,y:0}} end={{x:1,y:0}}
            style={{ height:54, alignItems:"center", justifyContent:"center" }}>
            {loading ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ fontFamily:Typography.fonts.bold, fontSize:16, color:"#fff" }}>Create Account</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"center", marginTop:20 }}>
          <Text style={{ fontFamily:Typography.fonts.regular, fontSize:14, color:"#64748B" }}>Already have an account?{" "}</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/provider/login" as any)}>
            <Text style={{ fontFamily:Typography.fonts.semibold, fontSize:14, color:"#06B6D4" }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}