import React from "react";
import { View, Text, TouchableOpacity, StatusBar, Platform, Dimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Colors }    from "@/theme/colors";
import { Typography }from "@/theme/typography";

const { width } = Dimensions.get("window");

export default function RoleSelectScreen() {
  return (
    <View style={{ flex:1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.DEFAULT} />

      <LinearGradient colors={[Colors.primary.DEFAULT, "#2563EB"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop: Platform.OS==="android"?60:80, paddingBottom:48, paddingHorizontal:28, alignItems:"center" }}>
        <View style={{ width:72, height:72, borderRadius:22, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center", marginBottom:20, borderWidth:1.5, borderColor:"rgba(255,255,255,0.25)" }}>
          <Text style={{ fontSize:36 }}>⚡</Text>
        </View>
        <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:30, color:"#fff", letterSpacing:0.5 }}>
          Snap<Text style={{ color:"#06B6D4" }}>Fix</Text>
        </Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"rgba(255,255,255,0.65)", marginTop:8, textAlign:"center" }}>
          How will you use SnapFix?
        </Text>
      </LinearGradient>

      <View style={{ flex:1, paddingHorizontal:24, paddingTop:32, gap:16 }}>

        {/* Customer card */}
        <TouchableOpacity onPress={() => router.push("/(auth)/customer/login" as any)} activeOpacity={0.88}>
          <View style={{ backgroundColor:"#fff", borderRadius:22, padding:22, borderWidth:1.5, borderColor:"#E0ECFF", flexDirection:"row", alignItems:"center", gap:16, shadowColor:Colors.primary.DEFAULT, shadowOffset:{width:0,height:4}, shadowOpacity:0.1, shadowRadius:12, elevation:4 }}>
            <View style={{ width:56, height:56, borderRadius:18, backgroundColor:Colors.primary[50], alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:28 }}>🏠</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:17, color: Colors.text.primary, marginBottom:4 }}>I'm a Customer</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color: Colors.text.secondary, lineHeight:18 }}>Book home services and track providers in real-time</Text>
            </View>
            <View style={{ width:32, height:32, borderRadius:10, backgroundColor:Colors.primary[50], alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:16 }}>→</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Provider card */}
        <TouchableOpacity onPress={() => router.push("/(auth)/provider/login" as any)} activeOpacity={0.88}>
          <View style={{ backgroundColor:"#0F172A", borderRadius:22, padding:22, flexDirection:"row", alignItems:"center", gap:16, shadowColor:"#0F172A", shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:12, elevation:4 }}>
            <View style={{ width:56, height:56, borderRadius:18, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:28 }}>🔧</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily: Typography.fonts.bold, fontSize:17, color:"#fff", marginBottom:4 }}>I'm a Provider</Text>
              <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:18 }}>Offer your skills and earn money from home service jobs</Text>
            </View>
            <View style={{ width:32, height:32, borderRadius:10, backgroundColor:"rgba(6,182,212,0.2)", alignItems:"center", justifyContent:"center" }}>
              <Text style={{ fontSize:16, color:"#06B6D4" }}>→</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Register links */}
        <View style={{ alignItems:"center", marginTop:8, gap:12 }}>
          <TouchableOpacity onPress={() => router.push("/(auth)/customer/register-step1" as any)}>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color: Colors.text.secondary }}>
              New customer?{" "}<Text style={{ fontFamily: Typography.fonts.semibold, color: Colors.primary.DEFAULT }}>Create account</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/provider/register" as any)}>
            <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color: Colors.text.secondary }}>
              New provider?{" "}<Text style={{ fontFamily: Typography.fonts.semibold, color:"#06B6D4" }}>Join as professional</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}