import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { router }        from "expo-router";
import { MotiView }      from "moti";
import { Mail, Lock, ArrowLeft } from "lucide-react-native";
import { ScreenWrapper } from "@/components/shared/ScreenWrapper";
import { Button }        from "@/components/ui/Button";
import { Input }         from "@/components/ui/Input";
import { useAuthStore }  from "@/store/authStore";
import { Colors }        from "@/theme/colors";
import { Typography }    from "@/theme/typography";
import { providerLogin } from "@/services/authService";
import { getProviderProfile } from "@/services/providerService";

export default function ProviderLoginScreen() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({});

  const setToken   = useAuthStore((s) => s.setToken);
  const setUser    = useAuthStore((s) => s.setUser);
  const isLoading  = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);

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
      // POST /api/v1/providers/login/
      const { token } = await providerLogin({ email, password });
      setToken(token);

      // Fetch provider profile
      try {
        const profile = await getProviderProfile(token);
        setUser({
          ...profile,
          role:       "provider",
          profession: profile.profession ?? undefined,
          bio:        profile.bio        ?? undefined,
        } as any);
      } catch {
        setUser({ role: "provider" } as any);
      }

      router.replace("/(provider)/dashboard");

    } catch (err: any) {
      const data = err?.data;
      const nonFieldError = data?.non_field_errors?.[0] ?? "";

      // ── Not verified yet → go to pending screen ──
      if (nonFieldError.toLowerCase().includes("not verified")) {
        router.replace("/(auth)/provider/pending");
        return;
      }

      let msg = "Login failed. Please check your credentials.";
      if (nonFieldError)       msg = nonFieldError;
      else if (data?.detail)   msg = data.detail;
      else if (data?.email)    msg = Array.isArray(data.email) ? data.email[0] : data.email;
      else if (err?.message)   msg = err.message;

      Alert.alert("Login Failed", msg);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <TouchableOpacity onPress={() => router.back()}
        style={{ marginTop: 16, width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border }}
      >
        <ArrowLeft size={20} color={Colors.text.primary} />
      </TouchableOpacity>

      <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 600 }} style={{ paddingTop: 32, paddingBottom: 40 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.accent.light, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <Text style={{ fontSize: 32 }}>🔧</Text>
        </View>
        <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: Typography.sizes["3xl"], color: Colors.text.primary, marginBottom: 8 }}>
          Provider Login
        </Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.base, color: Colors.text.secondary, lineHeight: 22 }}>
          Sign in to your provider account
        </Text>
      </MotiView>

      <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200, type: "timing", duration: 600 }}>
        <Input
          label="Email" isRequired placeholder="you@example.com"
          keyboardType="email-address" autoCapitalize="none"
          value={email} error={errors.email}
          onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
          leftIcon={<Mail size={18} color={Colors.text.secondary} />}
        />
        <View style={{ marginTop: 12 }}>
          <Input
            label="Password" isRequired placeholder="••••••••" secureTextEntry
            value={password} error={errors.password}
            onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
            leftIcon={<Lock size={18} color={Colors.text.secondary} />}
          />
        </View>
        <View style={{ marginTop: 20 }}>
          <Button label="Sign In" variant="secondary" size="lg" isLoading={isLoading} onPress={handleLogin} />
        </View>
      </MotiView>

      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 500, type: "timing", duration: 600 }}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 32 }}
      >
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.base, color: Colors.text.secondary }}>
          New to SnapFix?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/provider/register")}>
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: Typography.sizes.base, color: Colors.accent.DEFAULT }}>
            Create Account
          </Text>
        </TouchableOpacity>
      </MotiView>
    </ScreenWrapper>
  );
}