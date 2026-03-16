import React from "react";
import { View, Text, StatusBar, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Typography } from "@/theme/typography";

export default function CustomerChatScreen() {
  return (
    <View style={{ flex:1, backgroundColor:"#F8FAFC" }}>
      <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" />
      <LinearGradient colors={["#1E3A8A","#1E40AF"]} start={{x:0,y:0}} end={{x:1,y:1}}
        style={{ paddingTop: Platform.OS==="android"?48:60, paddingBottom:28, paddingHorizontal:20 }}>
        <Text style={{ fontFamily: Typography.fonts.extrabold, fontSize:24, color:"#fff" }}>Messages</Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:13, color:"rgba(255,255,255,0.6)", marginTop:4 }}>Chat with your providers</Text>
      </LinearGradient>
      <View style={{ flex:1, alignItems:"center", justifyContent:"center", paddingHorizontal:32 }}>
        <Text style={{ fontSize:56, marginBottom:16 }}>💬</Text>
        <Text style={{ fontFamily: Typography.fonts.bold, fontSize:18, color:"#0F172A", marginBottom:8, textAlign:"center" }}>
          Chat Coming Soon
        </Text>
        <Text style={{ fontFamily: Typography.fonts.regular, fontSize:14, color:"#94A3B8", textAlign:"center", lineHeight:22 }}>
          Real-time messaging with your providers will be available in the next update.
        </Text>
      </View>
    </View>
  );
}