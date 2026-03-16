import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Platform, Animated, Easing,
  ActivityIndicator, Alert,
} from "react-native";
import { router }         from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Shield, CheckCircle, ArrowLeft, RefreshCw, Mail, XCircle } from "lucide-react-native";
import { Typography }         from "@/theme/typography";
import { useAuthStore }       from "@/store/authStore";
import { getProviderProfile } from "@/services/providerService";

function SpinningClock() {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(rot, { toValue:1, duration:8000, easing:Easing.linear, useNativeDriver:true })).start();
  }, []);
  return (
    <Animated.View style={{ transform:[{ rotate: rot.interpolate({ inputRange:[0,1], outputRange:["0deg","360deg"] }) }] }}>
      <Clock size={44} color="#06B6D4" />
    </Animated.View>
  );
}

function Step({ icon, title, subtitle, done, delay }: { icon:any; title:string; subtitle:string; done:boolean; delay:number }) {
  return (
    <View style={{ flexDirection:"row", alignItems:"flex-start", gap:14, marginBottom:20 }}>
      <View style={{ width:44, height:44, borderRadius:14, backgroundColor: done?"#ECFDF5":"#EFF6FF", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor: done?"#A7F3D0":"#BFDBFE" }}>
        {done ? <CheckCircle size={20} color="#10B981" fill="#10B981" /> : React.createElement(icon, { size:20, color:"#3B82F6" })}
      </View>
      <View style={{ flex:1, paddingTop:2 }}>
        <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:15, color:"#0F172A", marginBottom:2 }}>{title}</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"#64748B", lineHeight:18 }}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function ProviderPendingScreen() {
  const token   = useAuthStore((s) => s.token);
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const [checking, setChecking] = useState(false);

  const isRejected = (user as any)?.verification_status === "rejected";
  const firstName  = (user as any)?.first_name ?? "Provider";
  const email      = (user as any)?.email      ?? "";

  const handleCheckAgain = async () => {
    if (!token) { router.replace("/(auth)/provider/login" as any); return; }
    setChecking(true);
    try {
      const profile = await getProviderProfile(token);
      setUser({ ...profile, role: "provider" } as any);

      const status = profile?.verification_status ?? "pending";
      if (status === "verified") {
        Alert.alert("✓ Verified!", "Your account is now verified.", [
          { text: "Go to Dashboard", onPress: () => router.replace("/(provider)/dashboard" as any) },
        ]);
      } else if (status === "rejected") {
        Alert.alert("Account Rejected", "Your account was not approved. Please contact support@snapfix.eg.");
      } else {
        Alert.alert("Still Pending", "Your account is still under review. We'll notify you by email once approved.");
      }
    } catch (err: any) {
      const msg = err?.data?.detail ?? err?.message ?? "Could not check status. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/provider/login" as any);
  };

  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />

      <ScrollView contentContainerStyle={{ flexGrow:1 }} showsVerticalScrollIndicator={false}>

        <LinearGradient colors={["#1E3A8A","#2563EB"]} start={{x:0,y:0}} end={{x:1,y:1}}
          style={{ paddingTop: Platform.OS==="android"?48:60, paddingBottom:36, paddingHorizontal:20, overflow:"hidden" }}>
          <View style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:90, backgroundColor:"rgba(255,255,255,0.05)" }} />
          <View style={{ position:"absolute", bottom:-20, left:-20, width:120, height:120, borderRadius:60, backgroundColor:"rgba(6,182,212,0.1)" }} />

          <TouchableOpacity onPress={handleLogout}
            style={{ width:42, height:42, borderRadius:14, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center", marginBottom:28 }}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          <View style={{ alignItems:"center" }}>
            <View style={{ width:90, height:90, borderRadius:28, backgroundColor:"rgba(255,255,255,0.12)", alignItems:"center", justifyContent:"center", marginBottom:20, borderWidth:2, borderColor:"rgba(255,255,255,0.2)" }}>
              {isRejected ? <XCircle size={44} color="#EF4444" /> : <SpinningClock />}
            </View>
            <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:26, color:"#fff", textAlign:"center", marginBottom:8 }}>
              {isRejected ? "Account Rejected" : "Under Review"}
            </Text>
            <View style={{ backgroundColor: isRejected?"rgba(239,68,68,0.2)":"rgba(6,182,212,0.25)", paddingHorizontal:16, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor: isRejected?"rgba(239,68,68,0.4)":"rgba(6,182,212,0.4)" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:12, color: isRejected?"#FCA5A5":"#67E8F9", letterSpacing:0.6 }}>
                {isRejected ? "⛔ NOT APPROVED" : "⏳ PENDING VERIFICATION"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ flex:1, paddingHorizontal:20, paddingTop:28 }}>

          <View style={{ marginBottom:24 }}>
            <Text style={{ fontFamily: Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:6 }}>
              {isRejected ? "We're sorry 😔" : `Hi ${firstName}! 👋`}
            </Text>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#64748B", lineHeight:22 }}>
              {isRejected
                ? "Your account was not approved. Please contact support@snapfix.eg for assistance."
                : `Your provider account has been submitted and is being reviewed. This typically takes 24–48 hours.`
              }
            </Text>
          </View>

          {!isRejected && (
            <View style={{ backgroundColor:"#fff", borderRadius:20, padding:20, marginBottom:20, borderWidth:1, borderColor:"#F1F5F9", shadowColor:"#1E3A8A", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:2 }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:11, color:"#94A3B8", letterSpacing:1, marginBottom:18 }}>VERIFICATION STEPS</Text>
              <Step icon={CheckCircle} title="Account Created"   subtitle="Your profile was submitted successfully" done    delay={400} />
              <Step icon={Shield}      title="Admin Review"      subtitle="Our team is verifying your information"  done={false} delay={500} />
              <Step icon={CheckCircle} title="Account Activated" subtitle="You'll be notified once approved"        done={false} delay={600} />
            </View>
          )}

          {email && !isRejected && (
            <View style={{ flexDirection:"row", alignItems:"center", gap:10, backgroundColor:"#EFF6FF", borderRadius:14, padding:14, marginBottom:28, borderWidth:1, borderColor:"#BFDBFE" }}>
              <Mail size={16} color="#3B82F6" />
              <Text style={{ flex:1, fontFamily: Typography.fonts.regular, fontSize:13, color:"#1E40AF", lineHeight:18 }}>
                We'll email you at <Text style={{ fontFamily: Typography.fonts.semibold }}>{email}</Text> once approved.
              </Text>
            </View>
          )}

          <View style={{ gap:12 }}>

            {!isRejected && (
              <TouchableOpacity onPress={handleCheckAgain} disabled={checking} activeOpacity={0.88}
                style={{ borderRadius:18, overflow:"hidden", opacity: checking?0.75:1 }}>
                <LinearGradient colors={["#06B6D4","#0284C7"]} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={{ height:54, alignItems:"center", flexDirection:"row", justifyContent:"center", gap:8 }}>
                  {checking
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><RefreshCw size={18} color="#fff" /><Text style={{ fontFamily: Typography.fonts.bold, fontSize:15, color:"#fff" }}>Check Verification Status</Text></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleLogout} activeOpacity={0.75}
              style={{ height:54, alignItems:"center", justifyContent:"center", borderRadius:18, borderWidth:1.5, borderColor:"#E2E8F0" }}>
              <Text style={{ fontFamily: Typography.fonts.semibold, fontSize:15, color:"#64748B" }}>Sign Out</Text>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </View>
  );
}