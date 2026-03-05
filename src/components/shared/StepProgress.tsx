import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { Colors } from "@/theme/colors";

interface StepProgressProps {
  current: number; // 1-based
  total:   number;
  color?:  string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  current,
  total,
  color = Colors.primary.DEFAULT,
}) => (
  <View
    style={{
      flexDirection: "row",
      gap:           8,
      marginBottom:  32,
    }}
  >
    {Array.from({ length: total }).map((_, i) => (
      <MotiView
        key={i}
        animate={{
          flex:            i < current ? 1.5 : 1,
          backgroundColor: i < current ? color : Colors.border,
          opacity:         i < current ? 1 : 0.4,
        }}
        transition={{ type: "spring", damping: 15 }}
        style={{ height: 4, borderRadius: 2 }}
      />
    ))}
  </View>
);