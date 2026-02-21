import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
