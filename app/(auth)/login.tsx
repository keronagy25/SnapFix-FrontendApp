import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { router }        from "expo-router";
import { MotiView }      from "moti";
import { Phone, ArrowLeft } from "lucide-react-native";
import { ScreenWrapper } from "@/components/shared/ScreenWrapper";
import { Button }        from "@/components/ui/Button";
import { Input }         from "@/components/ui/Input";
import { useAuthStore }  from "@/store/authStore";
import { Validators }    from "@/utils/validators";
import { Colors }        from "@/theme/colors";
import { Typography }    from "@/theme/typography";

export default function LoginScreen() {
  const [phone, setPhone]   = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const role = useAuthStore((s) => s.role);

  const isProvider = role === "provider";

  const handleSendOTP = async () => {
    if (!Validators.isValidPhone(phone)) {
      setError("Please enter a valid Egyptian phone number (e.g. 01012345678)");
      return;
    }
    setError("");
    setLoading(true);

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);

    router.push({
      pathname: "/(auth)/otp-verify",
      params:   { phone },
    });
  };

  return (
    <ScreenWrapper>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          marginTop:    16,
          width:        44,
          height:       44,
          borderRadius: 14,
          backgroundColor: Colors.surface,
          alignItems:   "center",
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
            width:           64,
            height:          64,
            borderRadius:    20,
            backgroundColor: isProvider
              ? Colors.accent.light
              : Colors.primary[100],
            alignItems:      "center",
            justifyContent:  "center",
            marginBottom:    24,
          }}
        >
          <Text style={{ fontSize: 32 }}>
            {isProvider ? "🔧" : "📱"}
          </Text>
        </View>

        <Text
          style={{
            fontFamily:   Typography.fonts.extrabold,
            fontSize:     Typography.sizes["3xl"],
            color:        Colors.text.primary,
            marginBottom: 8,
          }}
        >
          {isProvider ? "Provider Login" : "Welcome Back"}
        </Text>

        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.base,
            color:      Colors.text.secondary,
            lineHeight: 22,
          }}
        >
          Enter your phone number to receive a{"\n"}
          6-digit verification code.
        </Text>
      </MotiView>

      {/* Form */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: "timing", duration: 600 }}
      >
        <Input
          label="Phone Number"
          isRequired
          placeholder="01x-xxxxxxxx"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            if (error) setError("");
          }}
          maxLength={11}
          error={error}
          leftIcon={<Phone size={18} color={Colors.text.secondary} />}
          hint="Egyptian phone numbers only (01x-xxxxxxxx)"
        />

        <View style={{ marginTop: 8 }}>
          <Button
            label={loading ? "Sending..." : "Send OTP Code"}
            variant={isProvider ? "secondary" : "primary"}
            size="lg"
            isLoading={loading}
            onPress={handleSendOTP}
          />
        </View>
      </MotiView>

      {/* New user? Register */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 500, type: "timing", duration: 600 }}
        style={{
          flexDirection:  "row",
          alignItems:     "center",
          justifyContent: "center",
          marginTop:      32,
        }}
      >
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.base,
            color:      Colors.text.secondary,
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
              fontSize:   Typography.sizes.base,
              color:      isProvider
                ? Colors.accent.DEFAULT
                : Colors.primary.DEFAULT,
            }}
          >
            Create Account
          </Text>
        </TouchableOpacity>
      </MotiView>
    </ScreenWrapper>
  );
}