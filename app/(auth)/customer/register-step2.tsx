import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MotiView }      from "moti";
import { MapPin, ArrowLeft, CheckCircle } from "lucide-react-native";
import { ScreenWrapper } from "@/components/shared/ScreenWrapper";
import { Button }        from "@/components/ui/Button";
import { Input }         from "@/components/ui/Input";
import { useAuthStore }  from "@/store/authStore";
import { Colors }        from "@/theme/colors";
import { Typography }    from "@/theme/typography";
import { Shadows }       from "@/theme/shadows";

/* ─── Step Progress Bar (reused) ─── */
const StepProgress: React.FC<{
  current: number;
  total:   number;
  color:   string;
}> = ({ current, total, color }) => (
  <View style={{ flexDirection: "row", gap: 8, marginBottom: 32 }}>
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

/* ─── Quick Address Options ─── */
const QUICK_ADDRESSES = [
  { label: "Cairo",       emoji: "🏙️" },
  { label: "Giza",        emoji: "🏛️" },
  { label: "Alexandria",  emoji: "🌊" },
  { label: "6th October", emoji: "🏘️" },
  { label: "New Cairo",   emoji: "🌆" },
  { label: "Maadi",       emoji: "🌳" },
];

/* ══════════════════════════════════════════════════════════════════ */

export default function CustomerRegisterStep2() {
  /* Get data passed from Step 1 */
  const params = useLocalSearchParams<{
    fullName: string;
    email:    string;
    phone:    string;
  }>();

  const [address,    setAddress]    = useState("");
  const [addressErr, setAddressErr] = useState("");
  const [isLoading,  setIsLoading]  = useState(false);
  const [isSuccess,  setIsSuccess]  = useState(false);

  const setUser = useAuthStore((s) => s.setUser);

  /* ─── Validation ─── */
  const validate = (): boolean => {
    if (!address.trim() || address.trim().length < 10) {
      setAddressErr(
        "Please enter your full home address (at least 10 characters)"
      );
      return false;
    }
    setAddressErr("");
    return true;
  };

  /* ─── Submit Registration ─── */
  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 2000));

    // Mock: create the user in store
    setUser({
      id:            Math.random().toString(36).slice(2),
      fullName:      params.fullName,
      email:         params.email,
      phone:         params.phone,
      role:          "customer",
      homeAddress:   address,
      walletBalance: 0,
      createdAt:     new Date().toISOString(),
    });

    setIsLoading(false);
    setIsSuccess(true);

    // Navigate to customer home after brief success state
    setTimeout(() => {
      router.replace("/(customer)/home");
    }, 1200);
  };

  /* ─── Quick Address Select ─── */
  const handleQuickAddress = (city: string) => {
    setAddress((prev) =>
      prev
        ? prev.includes(city)
          ? prev
          : `${prev}, ${city}`
        : city
    );
    setAddressErr("");
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
        <StepProgress
          current={2}
          total={2}
          color={Colors.primary.DEFAULT}
        />

        {/* Step Label */}
        <View
          style={{
            flexDirection: "row",
            alignItems:    "center",
            gap:           8,
            marginBottom:  8,
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
                fontFamily:   Typography.fonts.semibold,
                fontSize:     Typography.sizes.xs,
                color:        Colors.primary.DEFAULT,
                letterSpacing: 1,
              }}
            >
              STEP 2 OF 2
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
          Your{"\n"}
          <Text style={{ color: Colors.primary.DEFAULT }}>
            Home Address
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
          This helps us find the nearest service{"\n"}
          providers in your area.
        </Text>
      </MotiView>

      {/* ── Summary Card (data from Step 1) ── */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 150, type: "timing", duration: 600 }}
        style={{
          backgroundColor: Colors.surface,
          borderRadius:    20,
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
            color:        Colors.text.secondary,
            marginBottom: 12,
            letterSpacing: 0.5,
          }}
        >
          ACCOUNT SUMMARY
        </Text>
        {[
          { label: "Name",  value: params.fullName, emoji: "👤" },
          { label: "Email", value: params.email,    emoji: "📧" },
          { label: "Phone", value: params.phone,    emoji: "📱" },
        ].map((item) => (
          <View
            key={item.label}
            style={{
              flexDirection:  "row",
              alignItems:     "center",
              gap:            10,
              paddingVertical: 6,
            }}
          >
            <Text style={{ fontSize: 16 }}>{item.emoji}</Text>
            <Text
              style={{
                fontFamily: Typography.fonts.regular,
                fontSize:   Typography.sizes.sm,
                color:      Colors.text.secondary,
                width:      44,
              }}
            >
              {item.label}
            </Text>
            <Text
              style={{
                fontFamily: Typography.fonts.medium,
                fontSize:   Typography.sizes.sm,
                color:      Colors.text.primary,
                flex:       1,
              }}
            >
              {item.value}
            </Text>
          </View>
        ))}
      </MotiView>

      {/* ── Address Form ── */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 250, type: "timing", duration: 600 }}
      >
        <Input
          label="Home Address"
          isRequired
          placeholder="e.g. 15 El-Tahrir St., Dokki, Giza"
          value={address}
          onChangeText={(v) => {
            setAddress(v);
            if (addressErr) setAddressErr("");
          }}
          error={addressErr}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ height: 80, paddingTop: 12 }}
          leftIcon={
            <MapPin size={18} color={Colors.text.secondary} />
          }
        />

        {/* Quick City Chips */}
        <Text
          style={{
            fontFamily:   Typography.fonts.medium,
            fontSize:     Typography.sizes.sm,
            color:        Colors.text.secondary,
            marginBottom: 12,
          }}
        >
          Quick Select City:
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap:      "wrap",
            gap:           8,
            marginBottom:  24,
          }}
        >
          {QUICK_ADDRESSES.map((city) => {
            const isSelected = address.includes(city.label);
            return (
              <TouchableOpacity
                key={city.label}
                onPress={() => handleQuickAddress(city.label)}
                style={{
                  flexDirection:   "row",
                  alignItems:      "center",
                  gap:             6,
                  paddingHorizontal: 14,
                  paddingVertical:   8,
                  borderRadius:    20,
                  borderWidth:     1.5,
                  borderColor:     isSelected
                    ? Colors.primary.DEFAULT
                    : Colors.border,
                  backgroundColor: isSelected
                    ? Colors.primary[50]
                    : Colors.surface,
                }}
              >
                <Text style={{ fontSize: 14 }}>{city.emoji}</Text>
                <Text
                  style={{
                    fontFamily: Typography.fonts.medium,
                    fontSize:   Typography.sizes.sm,
                    color:      isSelected
                      ? Colors.primary.DEFAULT
                      : Colors.text.secondary,
                  }}
                >
                  {city.label}
                </Text>
                {isSelected && (
                  <CheckCircle
                    size={14}
                    color={Colors.primary.DEFAULT}
                    fill={Colors.primary.DEFAULT}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </MotiView>

      {/* ── Terms Note ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 400, type: "timing", duration: 600 }}
        style={{ marginBottom: 24 }}
      >
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.sm,
            color:      Colors.text.secondary,
            textAlign:  "center",
            lineHeight: 20,
          }}
        >
          By creating an account, you agree to our{" "}
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              color:      Colors.primary.DEFAULT,
            }}
          >
            Terms of Service
          </Text>{" "}
          and{" "}
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              color:      Colors.primary.DEFAULT,
            }}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </MotiView>

      {/* ── Register Button ── */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500, type: "timing", duration: 500 }}
        style={{ marginBottom: 32 }}
      >
        {isSuccess ? (
          /* Success State */
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12 }}
            style={{
              height:          56,
              borderRadius:    24,
              backgroundColor: Colors.success,
              flexDirection:   "row",
              alignItems:      "center",
              justifyContent:  "center",
              gap:             8,
            }}
          >
            <CheckCircle
              size={22}
              color={Colors.text.inverse}
              fill={Colors.text.inverse}
            />
            <Text
              style={{
                fontFamily: Typography.fonts.semibold,
                fontSize:   Typography.sizes.md,
                color:      Colors.text.inverse,
              }}
            >
              Account Created!
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

    </ScreenWrapper>
  );
}