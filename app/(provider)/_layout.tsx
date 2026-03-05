import { Stack } from "expo-router";

export default function ProviderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="jobs"      />
      <Stack.Screen name="wallet"    />
      <Stack.Screen name="chat"      />
      <Stack.Screen name="profile"   />
    </Stack>
  );
}