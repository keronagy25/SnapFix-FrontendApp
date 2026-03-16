import React, { useCallback, useEffect } from "react";
import { View, Platform } from "react-native";
import { Stack } from "expo-router";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";

// Conditionally load SplashScreen only on native
let ExpoSplashScreen: any = null;
try {
  if (Platform.OS !== "web") {
    ExpoSplashScreen = require("expo-splash-screen");
    ExpoSplashScreen.preventAutoHideAsync().catch(() => {});
  }
} catch {}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (ExpoSplashScreen) {
        ExpoSplashScreen.hideAsync().catch(() => {});
      }
    }
  }, [fontsLoaded, fontError]);

  // Don't return null — return a View so the native splash hides
  // If we return null, SplashScreen.hideAsync never fires on some Android versions
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: "#1E3A8A" }} />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"      />
      <Stack.Screen name="(auth)"     />
      <Stack.Screen name="(customer)" />
      <Stack.Screen name="(provider)" />
    </Stack>
  );
}