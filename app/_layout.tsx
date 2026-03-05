import "../global.css";

import React, { useCallback } from "react";
import { Platform }           from "react-native";
import { Stack }              from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";

// Fix NativeWind dark mode on web
import { StyleSheet } from "react-native";
if (Platform.OS === "web") {
  // Tell NativeWind to use 'class' strategy instead of 'media'
  (StyleSheet as any).setFlag?.("darkMode", "class");
}

// Only use splash screen on native
let SplashScreen: any = null;
if (Platform.OS !== "web") {
  SplashScreen = require("expo-splash-screen");
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      if (Platform.OS !== "web" && SplashScreen) {
        await SplashScreen.hideAsync();
      }
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1 }}
      onLayout={onLayoutRootView}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)"     />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(provider)" />
      </Stack>
    </GestureHandlerRootView>
  );
}