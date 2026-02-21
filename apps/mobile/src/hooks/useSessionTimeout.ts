import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function useSessionTimeout() {
  const [isLocked, setIsLocked] = useState(false);
  const backgroundTime = useRef<number | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appState.current === "active" &&
        (nextState === "background" || nextState === "inactive")
      ) {
        // App going to background - record time
        backgroundTime.current = Date.now();
      }

      if (
        nextState === "active" &&
        (appState.current === "background" || appState.current === "inactive")
      ) {
        // App coming back to foreground
        if (backgroundTime.current) {
          const elapsed = Date.now() - backgroundTime.current;
          if (elapsed >= TIMEOUT_MS) {
            setIsLocked(true);
          }
        }
        backgroundTime.current = null;
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  const unlock = () => setIsLocked(false);

  return { isLocked, unlock };
}
