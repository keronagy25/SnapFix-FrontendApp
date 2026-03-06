import { Stack } from "expo-router";

export default function CustomerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home"     />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="wallet"   />
      <Stack.Screen name="chat"     />
      <Stack.Screen name="profile"  />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="booking"  />
    </Stack>
  );
}