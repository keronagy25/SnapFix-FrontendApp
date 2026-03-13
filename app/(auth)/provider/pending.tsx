import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity,
  Platform, StatusBar, Animated, Easing,
} from "react-native";
import { router }         from "expo-router";
import { MotiView }       from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  Clock, Shield, CheckCircle,
  ArrowLeft, RefreshCw, Mail,
} from "lucide-react-native";
import { Colors }     from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { useAuthStore } from "@/store/authStore";

/* ── Animated spinning clock ── */
function SpinningClock() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rot, {
        toValue:         1,
        duration:        8000,
        easing:          Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Clock size={48} color="#06B6D4" />
    </Animated.View>
  );
}

/* ── Step row ── */
function Step({
  icon, title, subtitle, done, delay,
}: {
  icon: any; title: string; subtitle: string; done: boolean; delay: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay, type: "timing", duration: 500 }}
      style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 20 }}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: done ? "#ECFDF5" : "#EFF6FF",
        alignItems: "center", justifyContent: "center",
        borderWidth: 1.5,
        borderColor: done ? "#A7F3D0" : "#BFDBFE",
      }}>
        {done
          ? <CheckCircle size={20} color="#10B981" fill="#10B981" />
          : React.createElement(icon, { size: 20, color: "#3B82F6" })}
      </View>
      <View style={{ flex: 1, paddingTop: 2 }}>
        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 15, color: Colors.text.primary, marginBottom: 2 }}>
          {title}
        </Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 13, color: Colors.text.secondary, lineHeight: 18 }}>
          {subtitle}
        </Text>
      </View>
    </MotiView>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════ */
export default function ProviderPendingScreen() {
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);

  const handleTryAgain = () => router.replace("/(auth)/login");

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const firstName = user?.first_name ?? "Provider";
  const email     = (user as any)?.email ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      {/* Header */}
      <LinearGradient
        colors={["#1E3A8A", "#2563EB"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{
          paddingTop:        Platform.OS === "android" ? 48 : 60,
          paddingBottom:     36,
          paddingHorizontal: 20,
          overflow:          "hidden",
        }}
      >
        <View style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.05)" }} />
        <View style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(6,182,212,0.1)" }} />

        {/* Back */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 28 }}
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        {/* Icon + title */}
        <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", damping: 14 }}
          style={{ alignItems: "center" }}
        >
          <View style={{ width: 90, height: 90, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.2)" }}>
            <SpinningClock />
          </View>
          <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize: 26, color: "#fff", textAlign: "center", marginBottom: 8 }}>
            Under Review
          </Text>
          <View style={{ backgroundColor: "rgba(6,182,212,0.25)", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(6,182,212,0.4)" }}>
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 12, color: "#67E8F9", letterSpacing: 0.6 }}>
              ⏳  PENDING VERIFICATION
            </Text>
          </View>
        </MotiView>
      </LinearGradient>

      {/* Body */}
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 28 }}>

        {/* Greeting */}
        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 200, type: "timing", duration: 500 }}
          style={{ marginBottom: 28 }}
        >
          <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 18, color: Colors.text.primary, marginBottom: 6 }}>
            Hi {firstName}! 👋
          </Text>
          <Text style={{ fontFamily: Typography.fonts.regular, fontSize: 14, color: Colors.text.secondary, lineHeight: 22 }}>
            Your provider account has been submitted and is currently being reviewed by our team. This typically takes{" "}
            <Text style={{ fontFamily: Typography.fonts.semibold, color: Colors.text.primary }}>24–48 hours</Text>.
          </Text>
        </MotiView>

        {/* Steps */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 300, type: "timing", duration: 400 }}
          style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
        >
          <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 11, color: "#94A3B8", letterSpacing: 1, marginBottom: 18 }}>
            VERIFICATION STEPS
          </Text>
          <Step icon={CheckCircle} title="Account Created"    subtitle="Your profile has been submitted successfully"     done delay={400} />
          <Step icon={Shield}      title="Admin Review"       subtitle="Our team is verifying your documents"             done={false} delay={500} />
          <Step icon={CheckCircle} title="Account Activated"  subtitle="You'll be notified once approved"                done={false} delay={600} />
        </MotiView>

        {/* Email note */}
        {email ? (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 700, type: "timing", duration: 400 }}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#EFF6FF", borderRadius: 14, padding: 14, marginBottom: 28, borderWidth: 1, borderColor: "#BFDBFE" }}
          >
            <Mail size={16} color="#3B82F6" />
            <Text style={{ flex: 1, fontFamily: Typography.fonts.regular, fontSize: 13, color: "#1E40AF", lineHeight: 18 }}>
              We'll email you at{" "}
              <Text style={{ fontFamily: Typography.fonts.semibold }}>{email}</Text>
              {" "}once your account is approved.
            </Text>
          </MotiView>
        ) : null}

        {/* Buttons */}
        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 800, type: "timing", duration: 400 }}
          style={{ gap: 12 }}
        >
          {/* Try login again — in case admin just approved */}
          <TouchableOpacity onPress={handleTryAgain} activeOpacity={0.88} style={{ borderRadius: 18, overflow: "hidden" }}>
            <LinearGradient colors={["#06B6D4", "#0284C7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
            >
              <RefreshCw size={18} color="#fff" />
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize: 15, color: "#fff" }}>Check Again</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign out */}
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.75}
            style={{ paddingVertical: 15, alignItems: "center", borderRadius: 18, borderWidth: 1.5, borderColor: "#E2E8F0" }}
          >
            <Text style={{ fontFamily: Typography.fonts.semibold, fontSize: 15, color: Colors.text.secondary }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </MotiView>

      </View>
    </View>
  );
}