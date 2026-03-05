import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { router }              from "expo-router";
import { MotiView }            from "moti";
import { CheckCircle }         from "lucide-react-native";
import { ScreenWrapper }       from "@/components/shared/ScreenWrapper";
import { Button }              from "@/components/ui/Button";
import { useAuthStore }        from "@/store/authStore";
import { Colors }              from "@/theme/colors";
import { Typography }          from "@/theme/typography";
import { Shadows }             from "@/theme/shadows";
import type { UserRole }       from "@/types";

const { width } = Dimensions.get("window");

interface RoleCardProps {
  title:       string;
  subtitle:    string;
  description: string;
  emoji:       string;
  role:        UserRole;
  isSelected:  boolean;
  onSelect:    () => void;
  features:    string[];
  delay:       number;
}

const RoleCard: React.FC<RoleCardProps> = ({
  title, subtitle, description, emoji,
  role, isSelected, onSelect, features, delay,
}) => {
  const isCustomer = role === "customer";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 40 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 15, delay }}
    >
      <TouchableOpacity
        onPress={onSelect}
        activeOpacity={0.9}
        style={{
          borderRadius:    24,
          borderWidth:     2,
          borderColor:     isSelected
            ? (isCustomer ? Colors.primary.DEFAULT : Colors.accent.DEFAULT)
            : Colors.border,
          backgroundColor: isSelected
            ? (isCustomer ? Colors.primary[50] : Colors.accent.light)
            : Colors.surface,
          padding:         24,
          marginBottom:    16,
          ...Shadows.md,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* Icon + Title */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width:           56,
                height:          56,
                borderRadius:    18,
                backgroundColor: isCustomer
                  ? Colors.primary[100]
                  : Colors.accent.light,
                alignItems:      "center",
                justifyContent:  "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
            </View>
            <View>
              <Text
                style={{
                  fontFamily: Typography.fonts.bold,
                  fontSize:   Typography.sizes.lg,
                  color:      Colors.text.primary,
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  fontFamily: Typography.fonts.regular,
                  fontSize:   Typography.sizes.xs,
                  color:      isCustomer
                    ? Colors.primary.DEFAULT
                    : Colors.accent.DEFAULT,
                }}
              >
                {subtitle}
              </Text>
            </View>
          </View>

          {/* Selection Indicator */}
          <View
            style={{
              width:        28,
              height:       28,
              borderRadius: 14,
              borderWidth:  2,
              borderColor:  isSelected
                ? (isCustomer ? Colors.primary.DEFAULT : Colors.accent.DEFAULT)
                : Colors.border,
              alignItems:   "center",
              justifyContent: "center",
              backgroundColor: isSelected
                ? (isCustomer ? Colors.primary.DEFAULT : Colors.accent.DEFAULT)
                : "transparent",
            }}
          >
            {isSelected && (
              <CheckCircle size={16} color={Colors.text.inverse} fill={Colors.text.inverse} />
            )}
          </View>
        </View>

        {/* Description */}
        <Text
          style={{
            fontFamily:  Typography.fonts.regular,
            fontSize:    Typography.sizes.sm,
            color:       Colors.text.secondary,
            marginTop:   12,
            lineHeight:  20,
          }}
        >
          {description}
        </Text>

        {/* Features */}
        {isSelected && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ type: "timing", duration: 300 }}
            style={{ marginTop: 16 }}
          >
            {features.map((f, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems:    "center",
                  gap:           8,
                  marginBottom:  6,
                }}
              >
                <View
                  style={{
                    width:           6,
                    height:          6,
                    borderRadius:    3,
                    backgroundColor: isCustomer
                      ? Colors.primary.DEFAULT
                      : Colors.accent.DEFAULT,
                  }}
                />
                <Text
                  style={{
                    fontFamily: Typography.fonts.regular,
                    fontSize:   Typography.sizes.sm,
                    color:      Colors.text.secondary,
                  }}
                >
                  {f}
                </Text>
              </View>
            ))}
          </MotiView>
        )}
      </TouchableOpacity>
    </MotiView>
  );
};

/* ══════════════════════════════════════════════════════════════════ */

export default function RoleSelectScreen() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const setRole = useAuthStore((s) => s.setRole);

  const handleContinue = () => {
    if (!selectedRole) return;
    setRole(selectedRole);
    router.push("/(auth)/login");
  };

  return (
    <ScreenWrapper scrollable>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
        style={{ paddingTop: 32, paddingBottom: 32 }}
      >
        <Text
          style={{
            fontFamily:   Typography.fonts.extrabold,
            fontSize:     Typography.sizes["3xl"],
            color:        Colors.text.primary,
            marginBottom: 8,
          }}
        >
          How will you use{"\n"}
          <Text style={{ color: Colors.primary.DEFAULT }}>SnapFix?</Text>
        </Text>
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.base,
            color:      Colors.text.secondary,
            lineHeight: 22,
          }}
        >
          Choose your role to get a personalized experience.
        </Text>
      </MotiView>

      {/* Role Cards */}
      <RoleCard
        role="customer"
        title="I'm a Customer"
        subtitle="Book home services"
        description="Find trusted professionals for plumbing, electrical, AC repair, cleaning, and more — right at your doorstep."
        emoji="🏠"
        isSelected={selectedRole === "customer"}
        onSelect={() => setSelectedRole("customer")}
        features={[
          "Browse 50+ service categories",
          "Book same-day appointments",
          "Live GPS tracking",
          "Secure EGP payments",
        ]}
        delay={200}
      />

      <RoleCard
        role="provider"
        title="I'm a Provider"
        subtitle="Offer your expertise"
        description="Join our network of verified professionals. Set your schedule, receive job requests, and grow your income."
        emoji="🔧"
        isSelected={selectedRole === "provider"}
        onSelect={() => setSelectedRole("provider")}
        features={[
          "Receive real-time job requests",
          "Set your own working hours",
          "Fast EGP withdrawals",
          "Build your reputation",
        ]}
        delay={350}
      />

      {/* CTA */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500, type: "timing", duration: 500 }}
        style={{ marginTop: 8, marginBottom: 32 }}
      >
        <Button
          label="Continue"
          variant="primary"
          size="lg"
          disabled={!selectedRole}
          onPress={handleContinue}
        />
      </MotiView>
    </ScreenWrapper>
  );
}