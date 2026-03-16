import React, { useRef, useState } from "react";
import {
  View, Text, Dimensions, TouchableOpacity,
  FlatList, Animated, StatusBar,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1", emoji: "🔍", title: "Find Trusted\nExperts",
    description: "Browse hundreds of verified professionals for any home service — plumbing, electrical, AC, and more.",
    bgColor: "#EFF6FF", accentColor: "#1E3A8A",
  },
  {
    id: "2", emoji: "⚡", title: "Fast &\nReliable Service",
    description: "Book same-day appointments. Track your provider in real-time as they head to your home.",
    bgColor: "#ECFEFF", accentColor: "#06B6D4",
  },
  {
    id: "3", emoji: "🔒", title: "Secure\nPayments",
    description: "Pay safely in EGP via Cash, Card, Wallet, or Fawry. Your money is protected until the job is done.",
    bgColor: "#ECFDF5", accentColor: "#10B981",
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim    = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        flatListRef.current?.scrollToIndex({ index: next, animated: false });
        setActiveIndex(next);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    } else {
      router.replace("/(auth)/role-select" as any);
    }
  };

  const slide = SLIDES[activeIndex];

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <StatusBar barStyle="dark-content" />

      {/* Skip */}
      <TouchableOpacity onPress={() => router.replace("/(auth)/role-select" as any)}
        style={{ position: "absolute", top: height * 0.07, right: 24, zIndex: 10, padding: 8 }}>
        <Text style={{ fontSize: 14, color: "#64748B" }}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal pagingEnabled scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <Animated.View style={{
            width, flex: 1, alignItems: "center", justifyContent: "center",
            paddingHorizontal: 32, paddingTop: height * 0.1,
            opacity: fadeAnim,
          }}>
            {/* Emoji circle */}
            <View style={{
              width: width * 0.38, height: width * 0.38, borderRadius: width * 0.13,
              backgroundColor: item.bgColor, alignItems: "center", justifyContent: "center",
              marginBottom: height * 0.06,
            }}>
              <Text style={{ fontSize: width * 0.18 }}>{item.emoji}</Text>
            </View>

            <Text style={{
              fontSize: width * 0.075, fontWeight: "800", color: "#0F172A",
              textAlign: "center", marginBottom: height * 0.02, lineHeight: width * 0.1,
            }}>
              {item.title}
            </Text>
            <Text style={{
              fontSize: width * 0.036, color: "#64748B",
              textAlign: "center", lineHeight: width * 0.058,
            }}>
              {item.description}
            </Text>
          </Animated.View>
        )}
      />

      {/* Bottom controls */}
      <View style={{ paddingHorizontal: 24, paddingBottom: height * 0.06, gap: 20 }}>

        {/* Dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
          {SLIDES.map((s, i) => (
            <View key={i} style={{
              height: 8, borderRadius: 4,
              width: i === activeIndex ? 24 : 8,
              backgroundColor: i === activeIndex ? slide.accentColor : "#E2E8F0",
            }} />
          ))}
        </View>

        {/* Next / Get Started button — no external component, pure TouchableOpacity */}
        <TouchableOpacity onPress={goNext} activeOpacity={0.88}
          style={{ borderRadius: 18, overflow: "hidden" }}>
          <LinearGradient
            colors={["#1E3A8A", "#2563EB"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ height: 56, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
              {activeIndex === SLIDES.length - 1 ? "Get Started 🚀" : "Next →"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </View>
  );
}