import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Platform, useWindowDimensions, Alert, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft, Mail, Phone, ChevronRight,
  LogOut, Shield, Bell, HelpCircle, Star,
  FileText, Lock, Trash2, User,
} from "lucide-react-native";
import { useAuthStore } from "@/store/authStore";

function useR() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 1024;
  return { isWeb, px: isWeb ? 40 : 20, maxW: isWeb ? 720 : 9999, fs: (n: number) => (isWeb ? n * 1.05 : n) };
}

const MENU = [
  {
    title: "Account",
    items: [
      { icon: User,       label: "Edit Profile",        subtitle: "Name, phone, photo"        },
      { icon: Lock,       label: "Change Password",     subtitle: "Update your password"      },
      { icon: Mail,       label: "Email Preferences",   subtitle: "Notifications & marketing" },
    ],
  },
  {
    title: "App",
    items: [
      { icon: Bell,       label: "Notifications",       subtitle: "Manage alerts"             },
      { icon: Shield,     label: "Privacy & Security",  subtitle: "Data and permissions"      },
    ],
  },
  {
    title: "Support",
    items: [
      { icon: HelpCircle, label: "Help Center",         subtitle: "FAQs and guides"           },
      { icon: Star,       label: "Rate SnapFix",        subtitle: "Leave us a review"         },
      { icon: FileText,   label: "Terms & Privacy",     subtitle: "Legal documents"           },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function ProfileScreen() {
  const r             = useR();
  const [loggingOut, setLoggingOut] = useState(false);

  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const firstName = user?.first_name ?? "—";
  const lastName  = user?.last_name  ?? "";
  const email     = user?.email      ?? "—";
  const phone     = (user as any)?.phone ?? "—";
  const initials  = `${firstName[0] ?? "?"}${lastName[0] ?? ""}`.toUpperCase();

  const centerWrap: any = r.isWeb
    ? { maxWidth: r.maxW, width: "100%", alignSelf: "center" }
    : {};

  /* ── Calls POST /api/v1/customers/logout/ via authStore ── */
  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text:  "Sign Out",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();           // hits server + clears store + AsyncStorage
              router.replace("/");      // back to login / landing
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ══ HERO ══ */}
        <LinearGradient
          colors={["#1E3A8A", "#2563EB"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            paddingTop:              Platform.OS === "web" ? 24 : 52,
            paddingBottom:           40,
            paddingHorizontal:       r.px,
            borderBottomLeftRadius:  r.isWeb ? 0 : 32,
            borderBottomRightRadius: r.isWeb ? 0 : 32,
            overflow:                "hidden",
          }}
        >
          <View style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.05)" }} />
          <View style={{ position: "absolute", bottom: -20, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(6,182,212,0.1)" }} />

          <View style={centerWrap}>
            <TouchableOpacity onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>

            <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 500 }}>
              <View style={{ alignItems: "center" }}>
                <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 14, borderWidth: 2.5, borderColor: "rgba(255,255,255,0.3)" }}>
                  <Text style={{ fontFamily: "Poppins_800ExtraBold", fontSize: 28, color: "#fff" }}>{initials}</Text>
                </View>
                <Text style={{ fontFamily: "Poppins_800ExtraBold", fontSize: r.fs(22), color: "#fff", marginBottom: 8 }}>
                  {firstName} {lastName}
                </Text>
                <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
                    <Mail size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "rgba(255,255,255,0.85)" }}>{email}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 }}>
                    <Phone size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "rgba(255,255,255,0.85)" }}>{phone}</Text>
                  </View>
                </View>
              </View>
            </MotiView>
          </View>
        </LinearGradient>

        {/* ══ MENU ══ */}
        <View style={[{ paddingHorizontal: r.px, paddingTop: 28 }, centerWrap]}>
          {MENU.map((section, si) => (
            <MotiView key={section.title}
              from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: si * 80, type: "timing", duration: 400 }}>
              <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(11), color: "#94A3B8", letterSpacing: 0.8, marginBottom: 10, marginTop: si === 0 ? 0 : 8 }}>
                {section.title.toUpperCase()}
              </Text>
              <View style={{ backgroundColor: "#fff", borderRadius: 20, marginBottom: 16, shadowColor: "#1E3A8A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: "#F1F5F9", overflow: "hidden" }}>
                {section.items.map((item, ii) => (
                  <TouchableOpacity key={item.label} activeOpacity={0.75}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: ii < section.items.length - 1 ? 1 : 0, borderBottomColor: "#F8FAFC" }}>
                    <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <item.icon size={18} color="#64748B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: r.fs(14), color: "#0F172A" }}>{item.label}</Text>
                      <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#94A3B8" }}>{item.subtitle}</Text>
                    </View>
                    <ChevronRight size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                ))}
              </View>
            </MotiView>
          ))}

          {/* ── SIGN OUT ── */}
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: 320, type: "timing", duration: 400 }}>
            <TouchableOpacity
              onPress={handleLogout}
              disabled={loggingOut}
              activeOpacity={0.85}
              style={{ backgroundColor: "#FEF2F2", borderRadius: 18, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1.5, borderColor: "#FEE2E2", marginBottom: 12 }}
            >
              {loggingOut
                ? <ActivityIndicator size="small" color="#EF4444" />
                : <LogOut size={18} color="#EF4444" />
              }
              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: r.fs(15), color: "#EF4444" }}>
                {loggingOut ? "Signing out…" : "Sign Out"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10 }}>
              <Trash2 size={14} color="#CBD5E1" />
              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(12), color: "#CBD5E1" }}>Delete account</Text>
            </TouchableOpacity>
          </MotiView>

          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: r.fs(11), color: "#E2E8F0", textAlign: "center", marginTop: 8 }}>
            SnapFix v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}