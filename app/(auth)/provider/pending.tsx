import React from "react";
import { View, Text } from "react-native";
import { Colors }     from "@/theme/colors";
import { Typography } from "@/theme/typography";

export default function ProviderPendingScreen() {
  return (
    <View
      style={{
        flex:            1,
        alignItems:      "center",
        justifyContent:  "center",
        backgroundColor: Colors.background,
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>⏳</Text>
      <Text
        style={{
          fontFamily: Typography.fonts.bold,
          fontSize:   Typography.sizes.xl,
          color:      Colors.text.primary,
        }}
      >
        Under Review
      </Text>
    </View>
  );
}