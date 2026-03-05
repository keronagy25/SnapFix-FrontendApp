import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { router }          from "expo-router";
import { MotiView }        from "moti";
import { User, Mail, Phone, ArrowLeft, Shield } from "lucide-react-native";
import { ScreenWrapper }   from "@/components/shared/ScreenWrapper";
import { StepProgress }    from "@/components/shared/StepProgress";
import { Button }          from "@/components/ui/Button";
import { Input }           from "@/components/ui/Input";
import { Colors }          from "@/theme/colors";
import { Typography }      from "@/theme/typography";
import { Shadows }         from "@/theme/shadows";
import { Validators }      from "@/utils/validators";
import type { ProviderRegisterErrors } from "@/types";

/* ─── Step Label Badge ─── */
const StepBadge: React.FC<{
  step:  number;
  total: number;
  color: string;
}> = ({ step, total, color }) => (
  <View
    style={{
      flexDirection:   "row",
      alignItems:      "center",
      gap:             8,
      marginBottom:    12,
    }}
  >
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical:   4,
        borderRadius:      20,
        backgroundColor:   `${color}20`,
      }}
    >
      <Text
        style={{
          fontFamily:   Typography.fonts.semibold,
          fontSize:     Typography.sizes.xs,
          color,
          letterSpacing: 1,
        }}
      >
        STEP {step} OF {total}
      </Text>
    </View>
  </View>
);

/* ══════════════════════════════════════════════════════════════════ */

export default function ProviderRegisterStep1() {
  const [form, setForm] = useState({
    fullName: "",
    email:    "",
    phone:    "",
  });
  const [errors, setErrors] = useState<
    Pick<ProviderRegisterErrors, "fullName" | "email" | "phone">
  >({});

  const update = (field: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!Validators.isValidName(form.fullName))
      newErrors.fullName = "Full name must be at least 3 characters";
    if (!Validators.isValidEmail(form.email))
      newErrors.email = "Please enter a valid email address";
    if (!Validators.isValidPhone(form.phone))
      newErrors.phone = "Please enter a valid Egyptian phone number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    router.push({
      pathname: "/(auth)/provider/register-step2",
      params:   { ...form },
    });
  };

  return (
    <ScreenWrapper scrollable>

      {/* ── Back ── */}
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
        <StepProgress
          current={1}
          total={3}
          color={Colors.accent.DEFAULT}
        />

        <StepBadge
          step={1}
          total={3}
          color={Colors.accent.DEFAULT}
        />

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
          <Text style={{ color: Colors.accent.DEFAULT }}>
            Information
          </Text>
        </Text>

        <Text
          style={{
            fontFamily:   Typography.fonts.regular,
            fontSize:     Typography.sizes.base,
            color:        Colors.text.secondary,
            lineHeight:   22,
            marginBottom: 32,
          }}
        >
          Start your journey as a verified SnapFix{"\n"}
          professional. Let's set up your profile.
        </Text>
      </MotiView>

      {/* ── Provider Badge ── */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 150, type: "spring", damping: 15 }}
        style={{
          flexDirection:   "row",
          alignItems:      "center",
          gap:             12,
          backgroundColor: `${Colors.accent.DEFAULT}15`,
          borderRadius:    16,
          padding:         14,
          marginBottom:    24,
          borderWidth:     1,
          borderColor:     `${Colors.accent.DEFAULT}30`,
        }}
      >
        <View
          style={{
            width:           40,
            height:          40,
            borderRadius:    12,
            backgroundColor: Colors.accent.DEFAULT,
            alignItems:      "center",
            justifyContent:  "center",
          }}
        >
          <Shield size={20} color={Colors.text.inverse} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              fontSize:   Typography.sizes.sm,
              color:      Colors.text.primary,
              marginBottom: 2,
            }}
          >
            Professional Account
          </Text>
          <Text
            style={{
              fontFamily: Typography.fonts.regular,
              fontSize:   Typography.sizes.xs,
              color:      Colors.text.secondary,
            }}
          >
            You'll be verified before accepting jobs
          </Text>
        </View>
      </MotiView>

      {/* ── Form ── */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: "timing", duration: 600 }}
      >
        <Input
          label="Full Name"
          isRequired
          placeholder="e.g. Mohamed Hassan"
          value={form.fullName}
          onChangeText={update("fullName")}
          error={errors.fullName}
          autoCapitalize="words"
          returnKeyType="next"
          leftIcon={<User size={18} color={Colors.text.secondary} />}
        />

        <Input
          label="Email Address"
          isRequired
          placeholder="mohamed@example.com"
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
          placeholder="01xxxxxxxxx"
          value={form.phone}
          onChangeText={update("phone")}
          error={errors.phone}
          keyboardType="phone-pad"
          maxLength={11}
          returnKeyType="done"
          leftIcon={<Phone size={18} color={Colors.text.secondary} />}
          hint="Egyptian numbers only — 01x-xxxxxxxx"
        />
      </MotiView>

      {/* ── What Happens Next Card ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 400, type: "timing", duration: 600 }}
        style={{
          backgroundColor: Colors.surface,
          borderRadius:    16,
          padding:         16,
          marginBottom:    24,
          borderWidth:     1,
          borderColor:     Colors.border,
          ...Shadows.sm,
        }}
      >
        <Text
          style={{
            fontFamily:   Typography.fonts.semibold,
            fontSize:     Typography.sizes.sm,
            color:        Colors.text.primary,
            marginBottom: 12,
          }}
        >
          📋 What Happens Next?
        </Text>
        {[
          "Fill in your professional details",
          "Upload your National ID & certificate",
          "Wait for admin verification (24–48 hrs)",
          "Start receiving job requests!",
        ].map((step, i) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              alignItems:    "center",
              gap:           10,
              marginBottom:  8,
            }}
          >
            <View
              style={{
                width:           22,
                height:          22,
                borderRadius:    11,
                backgroundColor: Colors.accent.DEFAULT,
                alignItems:      "center",
                justifyContent:  "center",
              }}
            >
              <Text
                style={{
                  fontFamily: Typography.fonts.bold,
                  fontSize:   Typography.sizes.xs,
                  color:      Colors.text.inverse,
                }}
              >
                {i + 1}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: Typography.fonts.regular,
                fontSize:   Typography.sizes.sm,
                color:      Colors.text.secondary,
                flex:       1,
              }}
            >
              {step}
            </Text>
          </View>
        ))}
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
          variant="secondary"
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