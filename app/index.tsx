import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const token = useAuthStore((s) => s.token);
  const role  = useAuthStore((s) => s.role);

  if (token && role === "customer") return <Redirect href="/(customer)/home" />;
  if (token && role === "provider") return <Redirect href="/(provider)/dashboard" />;

  return <Redirect href="/(auth)/splash" />;
}