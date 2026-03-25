import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { settingsApi } from "@/api/endpoints/settings";

export function useBrandingSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setBranding = useSettingsStore((s) => s.setBranding);

  useEffect(() => {
    if (!isAuthenticated) return;

    settingsApi
      .getBranding()
      .then((res) => {
        if (res.data) {
          setBranding({
            companyName: res.data.companyName,
            logoUrl: res.data.logoUrl,
            accentColor: res.data.accentColor,
          });
        }
      })
      .catch(() => {
        // Silently fail — branding will use cached value from AsyncStorage
      });
  }, [isAuthenticated, setBranding]);
}
