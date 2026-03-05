import React from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/theme/colors";

interface ScreenWrapperProps {
  children:    React.ReactNode;
  scrollable?: boolean;
  padded?:     boolean;
  bgColor?:    string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scrollable = false,
  padded     = true,
  bgColor    = Colors.background,
}) => {
  const content = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        ...(padded && { paddingHorizontal: 24 }),
      }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={{
        flex: 1,
        ...(padded && { paddingHorizontal: 24 }),
      }}
    >
      {children}
    </View>
  );

  // Web: don't use SafeAreaView or KeyboardAvoidingView
  if (Platform.OS === "web") {
    return (
      <View
        style={{
          flex:            1,
          backgroundColor: bgColor,
          // Center content on wide screens
          maxWidth:        480,
          width:           "100%",
          alignSelf:       "center",
        }}
      >
        {content}
      </View>
    );
  }

  // Native: full safe area handling
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={bgColor}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};