import "../global.css";
import { useEffect } from "react";
import { Appearance } from "react-native";
import { useColorScheme } from "nativewind";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import NetInfo from "@react-native-community/netinfo";
import Toast from "react-native-toast-message";
import { useAuthInit } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { BiometricLock } from "@/components/auth/BiometricLock";
import { setupNotificationHandler } from "@/lib/notifications";
import { queryPersister } from "@/lib/queryPersister";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { useSyncQueueStore } from "@/stores/syncQueue";
import { startSyncListeners } from "@/lib/syncProcessor";
import { useTradeTypeSync } from "@/hooks/useTradeType";

// Sync TanStack Query online state with NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours (for offline persistence)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function DarkModeEnforcer() {
  const darkModeOverride = useSettingsStore((s) => s.darkModeOverride);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    // Set NativeWind color scheme (controls dark: classes)
    setColorScheme(darkModeOverride === "system" ? "system" : darkModeOverride);
    // Set RN Appearance (controls StatusBar, native components)
    Appearance.setColorScheme(
      darkModeOverride === "system" ? null : darkModeOverride
    );
  }, [darkModeOverride, setColorScheme]);

  return null;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthInit();
  useTradeTypeSync();

  useEffect(() => {
    const cleanup = setupNotificationHandler();
    return cleanup;
  }, []);

  // Restore persisted stores and start sync listeners
  useEffect(() => {
    useSyncQueueStore.getState().restore();
    useSettingsStore.getState().restore();

    const cleanupSync = startSyncListeners(queryClient);
    return cleanupSync;
  }, []);

  return <>{children}</>;
}

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const biometricLockEnabled = useSettingsStore((s) => s.biometricLockEnabled);
  const { isLocked, unlock } = useSessionTimeout();

  return (
    <>
      {children}
      {isAuthenticated && biometricLockEnabled && (
        <BiometricLock visible={isLocked} onUnlock={unlock} />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}
        >
          <AuthProvider>
            <DarkModeEnforcer />
            <SessionGuard>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </SessionGuard>
            <OfflineBanner />
            <StatusBar style="auto" />
            <Toast />
          </AuthProvider>
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
