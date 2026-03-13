import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { router }       from "expo-router";
import { MotiView }     from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  User, Mail, Phone, Lock, ArrowLeft,
  Eye, EyeOff, CheckCircle, AlertCircle,
} from "lucide-react-native";
import { useAuthStore }        from "@/store/authStore";
import { Colors }              from "@/theme/colors";
import { Typography }          from "@/theme/typography";
import { providerRegister }    from "@/services/authService";
import { Input }               from "@/components/ui/Input";
import { Button }              from "@/components/ui/Button";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
interface FormState {
  first_name: string;
  last_name:  string;
  email:      string;
  phone:      string;
  password:   string;
}

interface FormErrors {
  first_name?: string;
  last_name?:  string;
  email?:      string;
  phone?:      string;
  password?:   string;
}

/* ══════════════════════════════════════════════════════════════════
   FIELD ROW — shows inline error + success tick
══════════════════════════════════════════════════════════════════ */
function FieldStatus({ error, value }: { error?: string; value: string }) {
  if (error) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
        <AlertCircle size={12} color="#EF4444" />
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#EF4444" }}>
          {error}
        </Text>
      </View>
    );
  }
  if (value.length > 0) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
        <CheckCircle size={12} color="#10B981" />
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: "#10B981" }}>
          Looks good
        </Text>
      </View>
    );
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SCREEN
══════════════════════════════════════════════════════════════════ */
export default function ProviderRegisterScreen() {
  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name:  "",
    email:      "",
    phone:      "",
    password:   "",
  });
  const [errors,       setErrors]       = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [apiError,     setApiError]     = useState<string | null>(null);

  const setToken = useAuthStore((s) => s.setToken);
  const setUser  = useAuthStore((s) => s.setUser);

  /* ── field updater ── */
  const update = (field: keyof FormState) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setApiError(null);
  };

  /* ── client-side validation ── */
  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.first_name.trim() || form.first_name.trim().length < 2)
      e.first_name = "At least 2 characters required";
    if (!form.last_name.trim() || form.last_name.trim().length < 2)
      e.last_name = "At least 2 characters required";
    if (!/\S+@\S+\.\S+/.test(form.email.trim()))
      e.email = "Enter a valid email address";
    if (!/^01[0-9]{9}$/.test(form.phone.trim()))
      e.phone = "Must be 11 digits starting with 01";
    if (form.password.length < 6)
      e.password = "Minimum 6 characters";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── map API field errors back onto the form ── */
  const applyApiErrors = (data: any): boolean => {
    const e: FormErrors = {};
    let hasFieldError = false;

    const pick = (val: any) =>
      Array.isArray(val) ? val[0] : String(val);

    if (data?.first_name) { e.first_name = pick(data.first_name); hasFieldError = true; }
    if (data?.last_name)  { e.last_name  = pick(data.last_name);  hasFieldError = true; }
    if (data?.email)      { e.email      = pick(data.email);      hasFieldError = true; }
    if (data?.phone)      { e.phone      = pick(data.phone);      hasFieldError = true; }
    if (data?.password)   { e.password   = pick(data.password);   hasFieldError = true; }

    if (hasFieldError) {
      setErrors(e);
      return true;
    }
    return false;
  };

  /* ── submit → POST /api/v1/providers/register/ ── */
  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setApiError(null);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name:  form.last_name.trim(),
        email:      form.email.trim().toLowerCase(),
        phone:      form.phone.trim(),
        password:   form.password,
      };

      const { token, user } = await providerRegister(payload);

      // Store token + user
      setToken(token);
      setUser({
        ...(user ?? {}),
        first_name: payload.first_name,
        last_name:  payload.last_name,
        email:      payload.email,
        phone:      payload.phone,
        role:       "provider",
      });

      // Navigate to pending/verification screen
      router.replace("/(auth)/provider/pending");

    } catch (err: any) {
      const data = err?.data ?? err?.response?.data;

      // Try to put errors on specific fields first
      if (data && applyApiErrors(data)) {
        // field errors shown inline — no alert needed
      } else {
        // Fall back to a banner message
        let msg = "Registration failed. Please try again.";
        if (data?.non_field_errors?.[0])  msg = data.non_field_errors[0];
        else if (data?.detail)            msg = data.detail;
        else if (err?.message)            msg = err.message;
        setApiError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* ── Gradient Header ── */}
      <LinearGradient
        colors={["#1E3A8A", "#2563EB"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          paddingTop:    Platform.OS === "android" ? 48 : 60,
          paddingBottom: 32,
          paddingHorizontal: 20,
          overflow: "hidden",
        }}
      >
        {/* decorative circles */}
        <View style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.05)" }} />
        <View style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(6,182,212,0.1)" }} />

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 24 }}
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
        >
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4, letterSpacing: 0.6 }}>
            PROVIDER REGISTRATION
          </Text>
          <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 28, color: "#fff", lineHeight: 34 }}>
            Join as a{"\n"}
            <Text style={{ color: "#06B6D4" }}>Professional</Text>
          </Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
            Create your account and start receiving jobs
          </Text>
        </MotiView>
      </LinearGradient>

      {/* ── Form ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      >

        {/* API error banner */}
        {apiError && (
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={{
              flexDirection: "row", alignItems: "flex-start", gap: 10,
              backgroundColor: "#FEF2F2", borderRadius: 14, padding: 14,
              marginBottom: 20, borderWidth: 1, borderColor: "#FECACA",
            }}
          >
            <AlertCircle size={18} color="#EF4444" style={{ marginTop: 1 }} />
            <Text style={{ flex: 1, fontFamily: Typography.fonts.medium, fontSize: 13, color: "#EF4444", lineHeight: 20 }}>
              {apiError}
            </Text>
          </MotiView>
        )}

        {/* First Name */}
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 100, type: "timing", duration: 400 }}>
          <Text style={labelStyle}>First Name <Text style={{ color: "#EF4444" }}>*</Text></Text>
          <Input
            placeholder="e.g. Shady"
            value={form.first_name}
            onChangeText={update("first_name")}
            autoCapitalize="words"
            returnKeyType="next"
            leftIcon={<User size={18} color={Colors.text.secondary} />}
            error={errors.first_name}
          />
          <FieldStatus error={errors.first_name} value={form.first_name} />
        </MotiView>

        {/* Last Name */}
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 150, type: "timing", duration: 400 }} style={{ marginTop: 14 }}>
          <Text style={labelStyle}>Last Name <Text style={{ color: "#EF4444" }}>*</Text></Text>
          <Input
            placeholder="e.g. Abadeer"
            value={form.last_name}
            onChangeText={update("last_name")}
            autoCapitalize="words"
            returnKeyType="next"
            leftIcon={<User size={18} color={Colors.text.secondary} />}
            error={errors.last_name}
          />
          <FieldStatus error={errors.last_name} value={form.last_name} />
        </MotiView>

        {/* Email */}
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200, type: "timing", duration: 400 }} style={{ marginTop: 14 }}>
          <Text style={labelStyle}>Email Address <Text style={{ color: "#EF4444" }}>*</Text></Text>
          <Input
            placeholder="provider@example.com"
            value={form.email}
            onChangeText={update("email")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            leftIcon={<Mail size={18} color={Colors.text.secondary} />}
            error={errors.email}
          />
          <FieldStatus error={errors.email} value={form.email} />
        </MotiView>

        {/* Phone */}
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 250, type: "timing", duration: 400 }} style={{ marginTop: 14 }}>
          <Text style={labelStyle}>Phone Number <Text style={{ color: "#EF4444" }}>*</Text></Text>
          <Input
            placeholder="01xxxxxxxxx"
            value={form.phone}
            onChangeText={update("phone")}
            keyboardType="phone-pad"
            maxLength={11}
            returnKeyType="next"
            leftIcon={<Phone size={18} color={Colors.text.secondary} />}
            error={errors.phone}
          />
          <FieldStatus error={errors.phone} value={form.phone} />
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 11, color: Colors.text.secondary, marginTop: 3 }}>
            Egyptian numbers only — 11 digits starting with 01
          </Text>
        </MotiView>

        {/* Password */}
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 300, type: "timing", duration: 400 }} style={{ marginTop: 14 }}>
          <Text style={labelStyle}>Password <Text style={{ color: "#EF4444" }}>*</Text></Text>
          <Input
            placeholder="••••••••"
            value={form.password}
            onChangeText={update("password")}
            secureTextEntry={!showPassword}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
            leftIcon={<Lock size={18} color={Colors.text.secondary} />}
            error={errors.password}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {showPassword
                  ? <EyeOff size={18} color={Colors.text.secondary} />
                  : <Eye    size={18} color={Colors.text.secondary} />}
              </TouchableOpacity>
            }
          />
          <FieldStatus error={errors.password} value={form.password} />
        </MotiView>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#F1F5F9", marginVertical: 28 }} />

        {/* Submit */}
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 400, type: "timing", duration: 400 }}>
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.88}
            style={{ borderRadius: 18, overflow: "hidden", opacity: isLoading ? 0.75 : 1 }}
          >
            <LinearGradient
              colors={["#06B6D4", "#0284C7"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10 }}
            >
              {isLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 16, color: "#fff" }}>Create Account</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>

        {/* Login link */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 500, type: "timing", duration: 400 }}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 }}
        >
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: Colors.text.secondary }}>
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 14, color: "#06B6D4" }}>
              Sign In
            </Text>
          </TouchableOpacity>
        </MotiView>

      </ScrollView>
    </View>
  );
}

/* ── shared label style ── */
const labelStyle = {
  fontFamily:   Typography.fonts.medium,
  fontSize:     13,
  color:        "#475569",
  marginBottom: 6,
} as const;