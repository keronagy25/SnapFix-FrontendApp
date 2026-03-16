import { useEffect } from "react";
import { View, Text, Platform } from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/onboarding" as any);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center" }}>
      {/* Decorative circles */}
      <View style={{ position:"absolute", width:400, height:400, borderRadius:200, backgroundColor:"#06B6D4", opacity:0.07, top:-100, right:-80 }} />
      <View style={{ position:"absolute", width:280, height:280, borderRadius:140, backgroundColor:"#06B6D4", opacity:0.05, bottom:-60, left:-60 }} />

      {/* Logo */}
      <View style={{ width:90, height:90, borderRadius:28, backgroundColor:"rgba(255,255,255,0.15)", alignItems:"center", justifyContent:"center", marginBottom:24, borderWidth:1.5, borderColor:"rgba(255,255,255,0.25)" }}>
        <Text style={{ fontSize:44 }}>⚡</Text>
      </View>

      <Text style={{ fontSize:36, fontWeight:"800", color:"#fff", letterSpacing:1 }}>
        Snap<Text style={{ color:"#06B6D4" }}>Fix</Text>
      </Text>

      <Text style={{ fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:10, letterSpacing:3 }}>
        HOME SERVICES, FAST.
      </Text>

      {/* Static dots */}
      <View style={{ position:"absolute", bottom:60, flexDirection:"row", gap:8 }}>
        <View style={{ width:8, height:8, borderRadius:4, backgroundColor:"#06B6D4", opacity:0.5 }} />
        <View style={{ width:8, height:8, borderRadius:4, backgroundColor:"#06B6D4", opacity:0.75 }} />
        <View style={{ width:8, height:8, borderRadius:4, backgroundColor:"#06B6D4", opacity:1 }} />
      </View>
    </View>
  );
}