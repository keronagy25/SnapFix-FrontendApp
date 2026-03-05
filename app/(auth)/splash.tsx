import React, { useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
import { router }   from "expo-router";
import { MotiView, MotiText } from "moti";
import { Colors }     from "@/theme/colors";
import { Typography } from "@/theme/typography";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/onboarding");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={{
        flex:            1,
        backgroundColor: Colors.primary.DEFAULT,
        alignItems:      "center",
        justifyContent:  "center",
      }}
    >
      {/* Background Circles */}
      <MotiView
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.08 }}
        transition={{ type: "timing", duration: 1000 }}
        style={{
          position:     "absolute",
          width:        width * 1.5,
          height:       width * 1.5,
          borderRadius: width * 0.75,
          backgroundColor: Colors.accent.DEFAULT,
          top:  -width * 0.5,
          right: -width * 0.3,
        }}
      />
      <MotiView
        from={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.06 }}
        transition={{ type: "timing", duration: 1200, delay: 200 }}
        style={{
          position:     "absolute",
          width:        width,
          height:       width,
          borderRadius: width * 0.5,
          backgroundColor: Colors.accent.light,
          bottom: -width * 0.3,
          left:   -width * 0.2,
        }}
      />

      {/* Logo Container */}
      <MotiView
        from={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type:     "spring",
          damping:  12,
          stiffness: 100,
        }}
        style={{ alignItems: "center" }}
      >
        {/* Logo Icon */}
        <MotiView
          from={{ rotate: "-180deg" }}
          animate={{ rotate: "0deg" }}
          transition={{ type: "spring", damping: 10, delay: 300 }}
          style={{
            width:           90,
            height:          90,
            borderRadius:    28,
            backgroundColor: "rgba(255,255,255,0.15)",
            alignItems:      "center",
            justifyContent:  "center",
            marginBottom:    20,
            borderWidth:     1,
            borderColor:     "rgba(255,255,255,0.25)",
          }}
        >
          <Text style={{ fontSize: 44 }}>⚡</Text>
        </MotiView>

        {/* App Name */}
        <MotiView
          from={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ delay: 400, type: "timing", duration: 600 }}
        >
          <Text
            style={{
              fontFamily: Typography.fonts.extrabold,
              fontSize:   Typography.sizes["4xl"],
              color:      Colors.text.inverse,
              letterSpacing: 1,
            }}
          >
            Snap<Text style={{ color: Colors.accent.DEFAULT }}>Fix</Text>
          </Text>
        </MotiView>

        {/* Tagline */}
        <MotiView
          from={{ translateY: 10, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ delay: 600, type: "timing", duration: 600 }}
        >
          <Text
            style={{
              fontFamily: Typography.fonts.regular,
              fontSize:   Typography.sizes.base,
              color:      "rgba(255,255,255,0.7)",
              marginTop:  8,
              letterSpacing: 2,
            }}
          >
            HOME SERVICES, FAST.
          </Text>
        </MotiView>
      </MotiView>

      {/* Loading dots */}
      <View
        style={{
          position:       "absolute",
          bottom:         60,
          flexDirection:  "row",
          gap:            8,
        }}
      >
        {[0, 1, 2].map((i) => (
          <MotiView
            key={i}
            from={{ opacity: 0.3, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type:      "timing",
              duration:  600,
              delay:     i * 200 + 800,
              loop:      true,
              repeatReverse: true,
            }}
            style={{
              width:        8,
              height:       8,
              borderRadius: 4,
              backgroundColor: Colors.accent.DEFAULT,
            }}
          />
        ))}
      </View>
    </View>
  );
}