import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown:      false,
        animation:        "slide_from_right",
        contentStyle:     { backgroundColor: "#F8FAFC" },
        gestureEnabled:   true,
        gestureDirection: "horizontal",
      }}
    >
      <Stack.Screen name="splash"                    options={{ animation: "fade" }} />
      <Stack.Screen name="onboarding"                options={{ animation: "fade" }} />
      <Stack.Screen name="role-select"               />
      <Stack.Screen name="login"                     />
      <Stack.Screen name="otp-verify"                />
      <Stack.Screen name="customer/register-step1"   />  {/* ← Customer routes */}
      <Stack.Screen name="customer/register-step2"   />
      <Stack.Screen name="provider/register-step1"   />  {/* ← Provider routes (next) */}
      <Stack.Screen name="provider/register-step2"   />
      <Stack.Screen name="provider/register-step3"   />
      <Stack.Screen name="provider/pending"          />
    </Stack>
  );
}