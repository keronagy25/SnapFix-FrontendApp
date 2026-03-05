import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { router }       from "expo-router";
import { MotiView }     from "moti";
import { ScreenWrapper } from "@/components/shared/ScreenWrapper";
import { Button }        from "@/components/ui/Button";
import { Colors }        from "@/theme/colors";
import { Typography }    from "@/theme/typography";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id:          "1",
    emoji:       "🔍",
    title:       "Find Trusted\nExperts",
    description: "Browse hundreds of verified professionals for any home service — plumbing, electrical, AC, and more.",
    bgColor:     Colors.primary[50],
    accentColor: Colors.primary.DEFAULT,
  },
  {
    id:          "2",
    emoji:       "⚡",
    title:       "Fast &\nReliable Service",
    description: "Book same-day appointments. Track your provider in real-time as they head to your home.",
    bgColor:     `${Colors.accent.DEFAULT}15`,
    accentColor: Colors.accent.DEFAULT,
  },
  {
    id:          "3",
    emoji:       "🔒",
    title:       "Secure\nPayments",
    description: "Pay safely in EGP via Cash, Card, Wallet, or Fawry. Your money is protected until the job is done.",
    bgColor:     `${Colors.success}15`,
    accentColor: Colors.success,
  },
];

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex((i) => i + 1);
    } else {
      router.replace("/(auth)/role-select");
    }
  };

  const handleSkip = () => {
    router.replace("/(auth)/role-select");
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Skip Button */}
      <View
        style={{
          position:    "absolute",
          top:         56,
          right:       24,
          zIndex:      10,
        }}
      >
        <TouchableOpacity onPress={handleSkip}>
          <Text
            style={{
              fontFamily: Typography.fonts.medium,
              fontSize:   Typography.sizes.base,
              color:      Colors.text.secondary,
            }}
          >
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              flex:           1,
              alignItems:     "center",
              justifyContent: "center",
              paddingHorizontal: 32,
              paddingTop:     100,
            }}
          >
            {/* Emoji Circle */}
            <MotiView
              from={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              style={{
                width:           140,
                height:          140,
                borderRadius:    44,
                backgroundColor: item.bgColor,
                alignItems:      "center",
                justifyContent:  "center",
                marginBottom:    48,
              }}
            >
              <Text style={{ fontSize: 72 }}>{item.emoji}</Text>
            </MotiView>

            {/* Text */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, type: "timing", duration: 500 }}
            >
              <Text
                style={{
                  fontFamily:   Typography.fonts.extrabold,
                  fontSize:     Typography.sizes["3xl"],
                  color:        Colors.text.primary,
                  textAlign:    "center",
                  marginBottom: 16,
                  lineHeight:   40,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontFamily: Typography.fonts.regular,
                  fontSize:   Typography.sizes.base,
                  color:      Colors.text.secondary,
                  textAlign:  "center",
                  lineHeight: 24,
                }}
              >
                {item.description}
              </Text>
            </MotiView>
          </View>
        )}
      />

      {/* Bottom Controls */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom:     48,
          gap:               24,
        }}
      >
        {/* Dots */}
        <View
          style={{
            flexDirection:  "row",
            justifyContent: "center",
            gap:            8,
          }}
        >
          {SLIDES.map((_, i) => (
            <MotiView
              key={i}
              animate={{
                width:           i === activeIndex ? 24 : 8,
                backgroundColor: i === activeIndex
                  ? SLIDES[activeIndex].accentColor
                  : Colors.border,
              }}
              transition={{ type: "spring", damping: 15 }}
              style={{ height: 8, borderRadius: 4 }}
            />
          ))}
        </View>

        {/* Button */}
        <Button
          label={activeIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          variant="primary"
          size="lg"
          onPress={handleNext}
        />
      </View>
    </View>
  );
}