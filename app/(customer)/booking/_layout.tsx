import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="service-details" />
      <Stack.Screen name="select-expert"   />
      <Stack.Screen name="schedule"        />
      <Stack.Screen name="payment"         />
      <Stack.Screen name="booking"         />
    </Stack>
  );
}