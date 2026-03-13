import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { settingsApi } from "@/api/endpoints/settings";

export function useTradeTypeSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setTradeType = useSettingsStore((s) => s.setTradeType);

  useEffect(() => {
    if (!isAuthenticated) return;

    settingsApi
      .getTenantSettings()
      .then((res) => {
        if (res.data?.tradeType) {
          setTradeType(res.data.tradeType);
        }
      })
      .catch(() => {
        // Silently fail — tradeType will use cached value from AsyncStorage
      });
  }, [isAuthenticated, setTradeType]);
}
