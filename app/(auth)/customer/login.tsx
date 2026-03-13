import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { router }          from "expo-router";
import { MotiView }        from "moti";
import { Mail, Lock, ArrowLeft } from "lucide-react-native";
import { ScreenWrapper }   from "@/components/shared/ScreenWrapper";
import { Button }          from "@/components/ui/Button";
import { Input }           from "@/components/ui/Input";
import { useAuthStore }    from "@/store/authStore";
import { Colors }          from "@/theme/colors";
import { Typography }      from "@/theme/typography";
import { customerLogin }   from "@/services/authService";
import { getCustomerProfile } from "@/services/customerService";

export default function CustomerLoginScreen() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<{ email?: string; password?: string }>({});

  const setToken   = useAuthStore((s) => s.setToken);
  const setUser    = useAuthStore((s) => s.setUser);
  const isLoading  = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim())               e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password)                   e.password = "Password is required";
    else if (password.length < 6)    e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      // POST /api/v1/customers/login/
      const { token } = await customerLogin({ email, password });
      setToken(token);

      const profile = await getCustomerProfile(token);
      setUser({ ...profile, role: "customer" });

      router.replace("/(customer)/home");

    } catch (err: any) {
      let msg = "Login failed. Please check your credentials.";
      const data = err?.data;

      if (data?.non_field_errors?.[0]) msg = data.non_field_errors[0];
      else if (data?.detail)           msg = data.detail;
      else if (data?.email)            msg = Array.isArray(data.email) ? data.email[0] : data.email;
      else if (err?.message)           msg = err.message;

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
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: Colors.primary[100], alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <Text style={{ fontSize: 32 }}>👋</Text>
        </View>
        <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: Typography.sizes["3xl"], color: Colors.text.primary, marginBottom: 8 }}>
          Welcome Back
        </Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.base, color: Colors.text.secondary, lineHeight: 22 }}>
          Sign in to your customer account
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
          <Button label="Sign In" variant="primary" size="lg" isLoading={isLoading} onPress={handleLogin} />
        </View>
      </MotiView>

      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 500, type: "timing", duration: 600 }}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 32 }}
      >
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.base, color: Colors.text.secondary }}>
          New to SnapFix?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/customer/register-step1")}>
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: Typography.sizes.base, color: Colors.primary.DEFAULT }}>
            Create Account
          </Text>
        </TouchableOpacity>
      </MotiView>
    </ScreenWrapper>
  );
}