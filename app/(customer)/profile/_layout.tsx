import { useEffect } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function RootLayout() {
  const hydrateAndFetch = useAuthStore((s) => s.hydrateAndFetch);

  /* ── On app start: restore token from storage → fetch profile from API ── */
  useEffect(() => {
    hydrateAndFetch();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"        />
      <Stack.Screen name="(auth)"       />
      <Stack.Screen name="(customer)"   />
      <Stack.Screen name="(provider)"   />
    </Stack>
  );
}