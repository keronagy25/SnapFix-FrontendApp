import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";
import { ArrowLeft } from "lucide-react-native";
import { ScreenWrapper }  from "@/components/shared/ScreenWrapper";
import { Button }         from "@/components/ui/Button";
import { useAuthStore }   from "@/store/authStore";
import { Colors }         from "@/theme/colors";
import { Typography }     from "@/theme/typography";

const OTP_LENGTH = 6;

export default function OTPVerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp]         = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [error, setError]     = useState("");
  const inputRefs = useRef<TextInput[]>([]);
  const role = useAuthStore((s) => s.role);
  const isProvider = role === "provider";

  /* Countdown timer */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() =>
      setResendTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    // Auto-advance
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== "") && index === OTP_LENGTH - 1) {
      handleVerify(newOtp.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code || otp.join("");
    if (finalCode.length !== OTP_LENGTH) {
      setError("Please enter the full 6-digit code");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);

    // Mock: code "123456" = existing user, else = new user
    const isExistingUser = finalCode === "123456";

    if (isExistingUser) {
      router.replace(isProvider ? "/(provider)/dashboard" : "/(customer)/home");
    } else {
      router.push(
        isProvider
          ? "/(auth)/provider/register-step1"
          : "/(auth)/customer/register-step1"
      );
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
    setResendTimer(30);
    inputRefs.current[0]?.focus();
  };

  return (
    <ScreenWrapper>
      {/* Back */}
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
        <Text style={{ fontSize: 48, marginBottom: 20 }}>📨</Text>
        <Text
          style={{
            fontFamily:   Typography.fonts.extrabold,
            fontSize:     Typography.sizes["3xl"],
            color:        Colors.text.primary,
            marginBottom: 8,
          }}
        >
          Verify Your{"\n"}Phone
        </Text>
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.base,
            color:      Colors.text.secondary,
            lineHeight: 22,
          }}
        >
          We sent a 6-digit code to{"\n"}
          <Text
            style={{
              fontFamily: Typography.fonts.semibold,
              color:      Colors.text.primary,
            }}
          >
            {phone}
          </Text>
        </Text>
      </MotiView>

      {/* OTP Inputs */}
      <MotiView
        from={{ opacity: 0, translateY: 30 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 200, type: "timing", duration: 600 }}
      >
        <View
          style={{
            flexDirection:  "row",
            justifyContent: "space-between",
            gap:            8,
            marginBottom:   8,
          }}
        >
          {otp.map((digit, i) => (
            <MotiView
              key={i}
              animate={{
                borderColor: digit
                  ? (isProvider ? Colors.accent.DEFAULT : Colors.primary.DEFAULT)
                  : Colors.border,
                scale: digit ? 1.05 : 1,
              }}
              transition={{ type: "spring", damping: 15 }}
              style={{
                flex:            1,
                height:          60,
                borderRadius:    16,
                borderWidth:     2,
                backgroundColor: digit ? Colors.primary[50] : Colors.surface,
                alignItems:      "center",
                justifyContent:  "center",
              }}
            >
              <TextInput
                ref={(ref) => {
                  if (ref) inputRefs.current[i] = ref;
                }}
                value={digit}
                onChangeText={(v) => handleOtpChange(v, i)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, i)
                }
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                style={{
                  fontFamily: Typography.fonts.bold,
                  fontSize:   Typography.sizes["2xl"],
                  color:      isProvider
                    ? Colors.accent.DEFAULT
                    : Colors.primary.DEFAULT,
                  width:      "100%",
                  height:     "100%",
                }}
                autoFocus={i === 0}
              />
            </MotiView>
          ))}
        </View>

        {/* Error */}
        {error && (
          <Text
            style={{
              fontFamily:  Typography.fonts.regular,
              fontSize:    Typography.sizes.sm,
              color:       Colors.error,
              marginBottom: 8,
              textAlign:   "center",
            }}
          >
            {error}
          </Text>
        )}

        {/* Verify Button */}
        <View style={{ marginTop: 16 }}>
          <Button
            label="Verify Code"
            variant={isProvider ? "secondary" : "primary"}
            size="lg"
            isLoading={loading}
            onPress={() => handleVerify()}
            disabled={otp.some((d) => !d)}
          />
        </View>

        {/* Resend */}
        <View
          style={{
            flexDirection:  "row",
            justifyContent: "center",
            alignItems:     "center",
            marginTop:      24,
          }}
        >
          <Text
            style={{
              fontFamily: Typography.fonts.regular,
              fontSize:   Typography.sizes.base,
              color:      Colors.text.secondary,
            }}
          >
            Didn't receive the code?{" "}
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0}
          >
            <Text
              style={{
                fontFamily: Typography.fonts.semibold,
                fontSize:   Typography.sizes.base,
                color:      resendTimer > 0
                  ? Colors.text.muted
                  : (isProvider
                      ? Colors.accent.DEFAULT
                      : Colors.primary.DEFAULT),
              }}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dev hint */}
        <Text
          style={{
            fontFamily: Typography.fonts.regular,
            fontSize:   Typography.sizes.xs,
            color:      Colors.text.muted,
            textAlign:  "center",
            marginTop:  24,
          }}
        >
          Dev: Use 123456 for existing user
        </Text>
      </MotiView>
    </ScreenWrapper>
  );
}