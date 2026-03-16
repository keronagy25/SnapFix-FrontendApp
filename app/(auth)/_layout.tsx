import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="customer/login" />
      <Stack.Screen name="customer/register-step1" />
      <Stack.Screen name="customer/register-step2" />
      <Stack.Screen name="provider/login" />
      <Stack.Screen name="provider/register" />
      <Stack.Screen name="provider/pending" />
    </Stack>
  );
}