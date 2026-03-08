import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { User, Mail, Phone, ArrowLeft } from "lucide-react-native";
import { ScreenWrapper } from "@/components/shared/ScreenWrapper";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";

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

/* ─── Validation helpers ─── */
const isValidName  = (v: string) => v.trim().length >= 2;
const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
const isValidPhone = (v: string) => /^[+]?[\d\s\-()]{7,15}$/.test(v.trim());

/* ══════════════════════════════════════════════════════════════════ */

export default function CustomerRegisterStep1() {
  const [form, setForm] = useState({
    first_name: "",
    last_name:  "",
    email:      "",
    phone:      "",
  });

  const [errors, setErrors] = useState<{
    first_name?: string;
    last_name?:  string;
    email?:      string;
    phone?:      string;
  }>({});

  const update = (field: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!isValidName(form.first_name))
      newErrors.first_name = "First name must be at least 2 characters";
    if (!isValidName(form.last_name))
      newErrors.last_name = "Last name must be at least 2 characters";
    if (!isValidEmail(form.email))
      newErrors.email = "Please enter a valid email address";
    if (!isValidPhone(form.phone))
      newErrors.phone = "Please enter a valid phone number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    router.push({
      pathname: "/(auth)/customer/register-step2",
      params: { ...form },
    });
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
        <StepProgress current={1} total={2} color={Colors.primary.DEFAULT} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <View style={{
            paddingHorizontal: 12, paddingVertical: 4,
            borderRadius: 20, backgroundColor: Colors.primary[100],
          }}>
            <Text style={{
              fontFamily: Typography.fonts.semibold, fontSize: Typography.sizes.xs,
              color: Colors.primary.DEFAULT, letterSpacing: 1,
            }}>
              STEP 1 OF 2
            </Text>
          </View>
        </View>

        <Text style={{
          fontFamily: Typography.fonts.extrabold, fontSize: Typography.sizes["3xl"],
          color: Colors.text.primary, marginBottom: 8, lineHeight: 36,
        }}>
          Personal{"\n"}
          <Text style={{ color: Colors.primary.DEFAULT }}>Information</Text>
        </Text>

        <Text style={{
          fontFamily: Typography.fonts.regular, fontSize: Typography.sizes.base,
          color: Colors.text.secondary, lineHeight: 22, marginBottom: 32,
        }}>
          Tell us a bit about yourself so we can{"\n"}set up your SnapFix account.
        </Text>
      </MotiView>

      {/* Form */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: "timing", duration: 600 }}
      >
        <Input
          label="First Name"
          isRequired
          placeholder="e.g. Ahmed"
          value={form.first_name}
          onChangeText={update("first_name")}
          error={errors.first_name}
          autoCapitalize="words"
          returnKeyType="next"
          leftIcon={<User size={18} color={Colors.text.secondary} />}
        />

        <Input
          label="Last Name"
          isRequired
          placeholder="e.g. Mohamed"
          value={form.last_name}
          onChangeText={update("last_name")}
          error={errors.last_name}
          autoCapitalize="words"
          returnKeyType="next"
          leftIcon={<User size={18} color={Colors.text.secondary} />}
        />

        <Input
          label="Email Address"
          isRequired
          placeholder="ahmed@example.com"
          value={form.email}
          onChangeText={update("email")}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          leftIcon={<Mail size={18} color={Colors.text.secondary} />}
        />

        <Input
          label="Phone Number"
          isRequired
          placeholder="+20 100 000 0000"
          value={form.phone}
          onChangeText={update("phone")}
          error={errors.phone}
          keyboardType="phone-pad"
          returnKeyType="done"
          leftIcon={<Phone size={18} color={Colors.text.secondary} />}
        />
      </MotiView>

      {/* Info Card */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 400, type: "timing", duration: 600 }}
        style={{
          flexDirection: "row", alignItems: "flex-start", gap: 12,
          backgroundColor: Colors.primary[50], borderRadius: 16,
          padding: 16, marginBottom: 24,
          borderWidth: 1, borderColor: Colors.primary[100],
        }}
      >
        <Text style={{ fontSize: 20 }}>🔒</Text>
        <Text style={{
          flex: 1, fontFamily: Typography.fonts.regular,
          fontSize: Typography.sizes.sm, color: Colors.text.secondary, lineHeight: 20,
        }}>
          Your personal information is encrypted and{" "}
          <Text style={{ fontFamily: Typography.fonts.semibold, color: Colors.primary.DEFAULT }}>
            never shared
          </Text>{" "}
          with third parties.
        </Text>
      </MotiView>

      {/* Next Button */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500, type: "timing", duration: 500 }}
        style={{ marginBottom: 32 }}
      >
        <Button
          label="Continue"
          variant="primary"
          size="lg"
          onPress={handleNext}
          rightIcon={<Text style={{ color: "#fff", fontSize: 18 }}>→</Text>}
        />
      </MotiView>
    </ScreenWrapper>
  );
}