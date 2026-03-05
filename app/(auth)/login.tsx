import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { Mail, Lock, ArrowLeft } from "lucide-react-native";
import { ScreenWrapper } from "@/components/shared/ScreenWrapper";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { customerLogin, providerLogin } from "@/services/authService";
import { getCustomerProfile } from "@/services/customerService";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const role = useAuthStore((s) => s.role);
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);

  const isProvider = role === "provider";

  // ─── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    // Clear any previous errors
    setErrors({});
    
    try {
      // 1. Login → get token
      const loginFn = isProvider ? providerLogin : customerLogin;
      const { token } = await loginFn({ email, password });
      setToken(token);

      // 2. Fetch profile with token
      if (!isProvider) {
        const profile = await getCustomerProfile(token);
        setUser({ ...profile, role: "customer" });
        router.replace("/(customer)/home");
      } else {
        // Provider: store token, navigate to provider dashboard
        // setUser({ ...providerProfile, role: "provider" });  ← add when provider profile endpoint exists
        router.replace("/(provider)/dashboard");
      }
    } catch (err: any) {
      // Better error message handling
      let errorMessage = "Login failed. Please check your credentials.";
      
      // Check for specific error types
      if (err?.response?.status === 401) {
        errorMessage = "Invalid email or password. Please try again.";
      } 
      // Handle DRF non-field errors
      else if (err?.data?.non_field_errors?.[0]) {
        const error = err.data.non_field_errors[0].toLowerCase();
        if (error.includes("email") || error.includes("password") || error.includes("credentials")) {
          errorMessage = "Invalid email or password. Please try again.";
        } else {
          errorMessage = err.data.non_field_errors[0];
        }
      }
      // Handle field-specific errors
      else if (err?.data) {
        // Check for email field errors
        if (err.data.email) {
          const emailError = Array.isArray(err.data.email) ? err.data.email[0] : err.data.email;
          if (emailError.toLowerCase().includes("exist") || emailError.toLowerCase().includes("found")) {
            errorMessage = "Email not found. Please check your email or sign up.";
          } else {
            setErrors(prev => ({ ...prev, email: emailError }));
          }
        }
        
        // Check for password field errors
        if (err.data.password) {
          const passwordError = Array.isArray(err.data.password) ? err.data.password[0] : err.data.password;
          setErrors(prev => ({ ...prev, password: passwordError }));
        }
        
        // Handle detail errors
        if (err.data.detail) {
          const detail = err.data.detail.toLowerCase();
          if (detail.includes("email") || detail.includes("password") || detail.includes("credentials")) {
            errorMessage = "Invalid email or password. Please try again.";
          } else {
            errorMessage = err.data.detail;
          }
        }
      }
      // Handle network errors
      else if (err?.message?.includes("Network Error")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      // Show alert only if there's a general error message (not field-specific)
      if (errorMessage !== "Login failed. Please check your credentials." || 
          (!errors.email && !errors.password)) {
        Alert.alert("Login Failed", errorMessage);
      }
      
      // Clear password field for security
      setPassword("");
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          marginTop: 16,
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: Colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ArrowLeft size={20} color={Colors.text.primary} />
      </TouchableOpacity>

      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
        style={{ paddingTop: 32, paddingBottom: 40 }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: isProvider ? Colors.accent.light : Colors.primary[100],
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 32 }}>{isProvider ? "🔧" : "👋"}</Text>
        </View>

        <Text
          style={{
            fontFamily: Typography.fonts.extrabold,
            fontSize: Typography.sizes["3xl"],
            color: Colors.text.primary,
            marginBottom: 8,
          }}
        >
          {isProvider ? "Provider Login" : "Welcome Back"}
        </Text>

        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize: Typography.sizes.base,
            color: Colors.text.secondary,
            lineHeight: 22,
          }}
        >
          Sign in to your {isProvider ? "provider" : ""} account
        </Text>
      </MotiView>

      {/* Form */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: "timing", duration: 600 }}
      >
        <Input
          label="Email"
          isRequired
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
          }}
          error={errors.email}
          leftIcon={<Mail size={18} color={Colors.text.secondary} />}
        />

        <View style={{ marginTop: 12 }}>
          <Input
            label="Password"
            isRequired
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            leftIcon={<Lock size={18} color={Colors.text.secondary} />}
          />
        </View>

        <View style={{ marginTop: 20 }}>
          <Button
            label="Sign In"
            variant={isProvider ? "secondary" : "primary"}
            size="lg"
            isLoading={isLoading}
            onPress={handleLogin}
          />
        </View>
      </MotiView>

      {/* Register link */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 500, type: "timing", duration: 600 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 32,
        }}
      >
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize: Typography.sizes.base,
            color: Colors.text.secondary,
          }}
        >
          New to SnapFix?{" "}
        </Text>
        <TouchableOpacity
          onPress={() =>
            router.push(
              isProvider
                ? "/(auth)/provider/register-step1"
                : "/(auth)/customer/register-step1"
            )
          }
        >
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              fontSize: Typography.sizes.base,
              color: isProvider ? Colors.accent.DEFAULT : Colors.primary.DEFAULT,
            }}
          >
            Create Account
          </Text>
        </TouchableOpacity>
      </MotiView>
    </ScreenWrapper>
  );
}