import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { router }        from "expo-router";
import { MotiView }      from "moti";
import { User, Mail, Phone, ArrowLeft } from "lucide-react-native";
import { ScreenWrapper } from "@/components/shared/ScreenWrapper";
import { Button }        from "@/components/ui/Button";
import { Input }         from "@/components/ui/Input";
import { Colors }        from "@/theme/colors";
import { Typography }    from "@/theme/typography";
import { Validators }    from "@/utils/validators";
import type {
  CustomerRegisterPayload,
  CustomerRegisterErrors,
} from "@/types";

/* ─── Step Progress Bar ─── */
const StepProgress: React.FC<{
  current: number;
  total:   number;
  color:   string;
}> = ({ current, total, color }) => (
  <View
    style={{
      flexDirection: "row",
      gap:           8,
      marginBottom:  32,
    }}
  >
    {Array.from({ length: total }).map((_, i) => (
      <MotiView
        key={i}
        animate={{
          flex:            i < current ? 1.5 : 1,
          backgroundColor: i < current ? color : Colors.border,
          opacity:         i < current ? 1 : 0.5,
        }}
        transition={{ type: "spring", damping: 15 }}
        style={{ height: 4, borderRadius: 2 }}
      />
    ))}
  </View>
);

/* ══════════════════════════════════════════════════════════════════ */

export default function CustomerRegisterStep1() {
  const [form, setForm] = useState<
    Pick<CustomerRegisterPayload, "fullName" | "email" | "phone">
  >({
    fullName: "",
    email:    "",
    phone:    "",
  });

  const [errors, setErrors] = useState<CustomerRegisterErrors>({});

  /* ─── Helpers ─── */
  const update = (field: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: CustomerRegisterErrors = {};

    if (!Validators.isValidName(form.fullName))
      newErrors.fullName = "Full name must be at least 3 characters";

    if (!Validators.isValidEmail(form.email))
      newErrors.email = "Please enter a valid email address";

    if (!Validators.isValidPhone(form.phone))
      newErrors.phone =
        "Please enter a valid Egyptian phone number (e.g. 01012345678)";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    router.push({
      pathname: "/(auth)/customer/register-step2",
      params:   { ...form },
    });
  };

  /* ─── UI ─── */
  return (
    <ScreenWrapper scrollable>

      {/* ── Back Button ── */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          marginTop:       16,
          width:           44,
          height:          44,
          borderRadius:    14,
          backgroundColor: Colors.surface,
          alignItems:      "center",
          justifyContent:  "center",
          borderWidth:     1,
          borderColor:     Colors.border,
        }}
      >
        <ArrowLeft size={20} color={Colors.text.primary} />
      </TouchableOpacity>

      {/* ── Header ── */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
        style={{ paddingTop: 24 }}
      >
        {/* Progress */}
        <StepProgress
          current={1}
          total={2}
          color={Colors.primary.DEFAULT}
        />

        {/* Step Label */}
        <View
          style={{
            flexDirection:   "row",
            alignItems:      "center",
            gap:             8,
            marginBottom:    8,
          }}
        >
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical:   4,
              borderRadius:      20,
              backgroundColor:   Colors.primary[100],
            }}
          >
            <Text
              style={{
                fontFamily: Typography.fonts.semibold,
                fontSize:   Typography.sizes.xs,
                color:      Colors.primary.DEFAULT,
                letterSpacing: 1,
              }}
            >
              STEP 1 OF 2
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text
          style={{
            fontFamily:   Typography.fonts.extrabold,
            fontSize:     Typography.sizes["3xl"],
            color:        Colors.text.primary,
            marginBottom: 8,
            lineHeight:   36,
          }}
        >
          Personal{"\n"}
          <Text style={{ color: Colors.primary.DEFAULT }}>
            Information
          </Text>
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontFamily:   Typography.fonts.regular,
            fontSize:     Typography.sizes.base,
            color:        Colors.text.secondary,
            lineHeight:   22,
            marginBottom: 32,
          }}
        >
          Tell us a bit about yourself so we can{"\n"}
          set up your SnapFix account.
        </Text>
      </MotiView>

      {/* ── Form ── */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: "timing", duration: 600 }}
      >
        {/* Full Name */}
        <Input
          label="Full Name"
          isRequired
          placeholder="e.g. Ahmed Mohamed"
          value={form.fullName}
          onChangeText={update("fullName")}
          error={errors.fullName}
          autoCapitalize="words"
          returnKeyType="next"
          leftIcon={
            <User size={18} color={Colors.text.secondary} />
          }
        />

        {/* Email */}
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
          leftIcon={
            <Mail size={18} color={Colors.text.secondary} />
          }
        />

        {/* Phone */}
        <Input
          label="Phone Number"
          isRequired
          placeholder="01xxxxxxxxx"
          value={form.phone}
          onChangeText={update("phone")}
          error={errors.phone}
          keyboardType="phone-pad"
          maxLength={11}
          returnKeyType="done"
          leftIcon={
            <Phone size={18} color={Colors.text.secondary} />
          }
          hint="Egyptian numbers only — 01x-xxxxxxxx"
        />
      </MotiView>

      {/* ── Info Card ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 400, type: "timing", duration: 600 }}
        style={{
          flexDirection:   "row",
          alignItems:      "flex-start",
          gap:             12,
          backgroundColor: Colors.primary[50],
          borderRadius:    16,
          padding:         16,
          marginBottom:    24,
          borderWidth:     1,
          borderColor:     Colors.primary[100],
        }}
      >
        <Text style={{ fontSize: 20 }}>🔒</Text>
        <Text
          style={{
            flex:       1,
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.sm,
            color:      Colors.text.secondary,
            lineHeight: 20,
          }}
        >
          Your personal information is encrypted and{" "}
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              color:      Colors.primary.DEFAULT,
            }}
          >
            never shared
          </Text>{" "}
          with third parties.
        </Text>
      </MotiView>

      {/* ── Next Button ── */}
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
          rightIcon={
            <Text style={{ color: "#fff", fontSize: 18 }}>→</Text>
          }
        />
      </MotiView>

    </ScreenWrapper>
  );
}