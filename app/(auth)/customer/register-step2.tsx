import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react-native";
import { ScreenWrapper } from "@/components/shared/ScreenWrapper";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/store/authStore";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { Shadows } from "@/theme/shadows";
import { customerRegister } from "@/services/authService";

/* ─── Step Progress Bar ─── */
const StepProgress: React.FC<{ current: number; total: number; color: string }> = ({
  current, total, color,
}) => (
  <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
    {Array.from({ length: total }).map((_, i) => (
      <MotiView
        key={i}
        animate={{
          flex: i < current ? 1.5 : 1,
          backgroundColor: i < current ? color : Colors.border,
          opacity: i < current ? 1 : 0.5,
        }}
        transition={{ type: "spring", damping: 15 }}
        style={{ height: 4, borderRadius: 2 }}
      />
    ))}
  </View>
);

/* ══════════════════════════════════════════════════════════════════ */

export default function CustomerRegisterStep2() {
  const params = useLocalSearchParams<{
    first_name: string;
    last_name:  string;
    email:      string;
  }>();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const setToken   = useAuthStore((s) => s.setToken);
  const setUser    = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  /* ─── Validation ─── */
  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ─── Submit ─── */
  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setLoading(true);

    try {
      // 1. Register → get token
      const { token } = await customerRegister({
        first_name: params.first_name,
        last_name:  params.last_name,
        email:      params.email,
        password,
      });
      
      // Don't set token or user - we want them to login manually
      // setToken(token);
      // const profile = await getCustomerProfile(token);
      // setUser({ ...profile, role: "customer" });

      // 2. Success state → show success message then go to login
      setIsSuccess(true);
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1500);

    } catch (err: any) {
      // Parse Django field errors (e.g. { email: ["already exists"] })
      const data = err?.data ?? {};
      const firstError =
        Object.values(data as Record<string, string[]>)
          .flat()
          .find(Boolean) ??
        err?.message ??
        "Registration failed. Please try again.";

      Alert.alert("Registration Failed", firstError);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable>
      {/* Back */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          marginTop: 16, width: 44, height: 44, borderRadius: 14,
          backgroundColor: Colors.surface, alignItems: "center",
          justifyContent: "center", borderWidth: 1, borderColor: Colors.border,
        }}
      >
        <ArrowLeft size={20} color={Colors.text.primary} />
      </TouchableOpacity>

      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
        style={{ paddingTop: 24 }}
      >
        <StepProgress current={2} total={2} color={Colors.primary.DEFAULT} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <View style={{
            paddingHorizontal: 12, paddingVertical: 4,
            borderRadius: 20, backgroundColor: Colors.primary[100],
          }}>
            <Text style={{
              fontFamily: Typography.fonts.semibold, fontSize: Typography.sizes.xs,
              color: Colors.primary.DEFAULT, letterSpacing: 1,
            }}>
              STEP 2 OF 2
            </Text>
          </View>
        </View>

        <Text style={{
          fontFamily: Typography.fonts.extrabold, fontSize: Typography.sizes["3xl"],
          color: Colors.text.primary, marginBottom: 8, lineHeight: 36,
        }}>
          Secure Your{"\n"}
          <Text style={{ color: Colors.primary.DEFAULT }}>Account</Text>
        </Text>

        <Text style={{
          fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.base,
          color: Colors.text.secondary, lineHeight: 22, marginBottom: 32,
        }}>
          Create a strong password to protect{"\n"}your SnapFix account.
        </Text>
      </MotiView>

      {/* Summary Card */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 150, type: "timing", duration: 600 }}
        style={{
          backgroundColor: Colors.surface, borderRadius: 20, padding: 16,
          marginBottom: 24, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm,
        }}
      >
        <Text style={{
          fontFamily: Typography.fonts.semibold, fontSize: Typography.sizes.sm,
          color: Colors.text.secondary, marginBottom: 12, letterSpacing: 0.5,
        }}>
          ACCOUNT SUMMARY
        </Text>
        {[
          { label: "First", value: params.first_name, emoji: "👤" },
          { label: "Last",  value: params.last_name,  emoji: "👤" },
          { label: "Email", value: params.email,      emoji: "📧" },
        ].map((item) => (
          <View key={item.label} style={{
            flexDirection: "row", alignItems: "center",
            gap: 10, paddingVertical: 6,
          }}>
            <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
            <Text style={{
              fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm,
              color: Colors.text.secondary, width: 44,
            }}>
              {item.label}
            </Text>
            <Text style={{
              fontFamily: Typography.fonts.medium, fontSize: Typography.sizes.sm,
              color: Colors.text.primary, flex: 1,
            }}>
              {item.value}
            </Text>
          </View>
        ))}
      </MotiView>

      {/* Password Form */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 250, type: "timing", duration: 600 }}
      >
        <Input
          label="Password"
          isRequired
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setErrors((e) => ({ ...e, password: undefined }));
          }}
          error={errors.password}
          leftIcon={<Lock size={18} color={Colors.text.secondary} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
              {showPassword
                ? <EyeOff size={18} color={Colors.text.secondary} />
                : <Eye    size={18} color={Colors.text.secondary} />}
            </TouchableOpacity>
          }
          hint="Minimum 8 characters"
        />

        <Input
          label="Confirm Password"
          isRequired
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          value={confirmPassword}
          onChangeText={(v) => {
            setConfirmPassword(v);
            setErrors((e) => ({ ...e, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
          leftIcon={<Lock size={18} color={Colors.text.secondary} />}
        />
      </MotiView>

      {/* Terms */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 400, type: "timing", duration: 600 }}
        style={{ marginBottom: 24 }}
      >
        <Text style={{
          fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.sm,
          color: Colors.text.secondary, textAlign: "center", lineHeight: 20,
        }}>
          By creating an account, you agree to our{" "}
          <Text style={{ fontFamily: Typography.fonts.semibold, color: Colors.primary.DEFAULT }}>
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text style={{ fontFamily: Typography.fonts.semibold, color: Colors.primary.DEFAULT }}>
            Privacy Policy
          </Text>.
        </Text>
      </MotiView>

      {/* Submit */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500, type: "timing", duration: 500 }}
        style={{ marginBottom: 32 }}
      >
        {isSuccess ? (
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12 }}
            style={{
              height: 56, borderRadius: 24, backgroundColor: Colors.success,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <CheckCircle size={22} color={Colors.text.inverse} fill={Colors.text.inverse} />
            <Text style={{
              fontFamily: Typography.fonts.semibold,
              fontSize: Typography.sizes.md, color: Colors.text.inverse,
            }}>
              Account Created! Redirecting to Login...
            </Text>
          </MotiView>
        ) : (
          <Button
            label={isLoading ? "Creating Account..." : "Create My Account"}
            variant="primary"
            size="lg"
            isLoading={isLoading}
            onPress={handleRegister}
          />
        )}
      </MotiView>

      {/* Login Link */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 600, type: "timing", duration: 600 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize: Typography.sizes.base,
            color: Colors.text.secondary,
          }}
        >
          Already have an account?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              fontSize: Typography.sizes.base,
              color: Colors.primary.DEFAULT,
            }}
          >
            Sign In
          </Text>
        </TouchableOpacity>
      </MotiView>
    </ScreenWrapper>
  );
}