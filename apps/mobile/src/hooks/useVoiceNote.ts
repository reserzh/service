import { useState, useCallback, useRef } from "react";
import { Alert, Platform } from "react-native";

interface UseVoiceNoteOptions {
  /** Called with transcribed text */
  onResult: (text: string) => void;
  /** Language code (default: en-US) */
  locale?: string;
}

interface SpeechModule {
  ExpoSpeechRecognitionModule: {
    requestPermissionsAsync: () => Promise<{ granted: boolean }>;
    start: (opts: { lang: string; interimResults: boolean }) => void;
    stop: () => void;
    addListener: (
      event: string,
      cb: (ev: { value: string[] }) => void
    ) => { remove: () => void };
  };
}

/**
 * Hook for voice-to-text input using the platform's speech recognizer.
 *
 * Uses expo-speech-recognition when available, with a graceful fallback
 * that prompts users to use the keyboard microphone button.
 */
export function useVoiceNote({ onResult, locale = "en-US" }: UseVoiceNoteOptions) {
  const [isListening, setIsListening] = useState(false);
  const speechRef = useRef<SpeechModule | null>(undefined);

  const startListening = useCallback(async () => {
    try {
      // Lazy-load speech recognition module
      if (speechRef.current === undefined) {
        try {
          // Dynamic require to avoid hard compile-time dependency
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const mod = require("expo-speech-recognition") as SpeechModule;
          speechRef.current = mod;
        } catch {
          speechRef.current = null;
        }
      }

      if (speechRef.current) {
        const { ExpoSpeechRecognitionModule } = speechRef.current;

        const { granted } =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Permission needed",
            "Microphone permission is required for voice notes."
          );
          return;
        }

        setIsListening(true);

        let errorSub: { remove: () => void } | null = null;
        const subscription = ExpoSpeechRecognitionModule.addListener(
          "result",
          (event) => {
            if (event.value?.[0]) {
              onResult(event.value[0]);
            }
            setIsListening(false);
            subscription.remove();
            errorSub?.remove();
          }
        );
        errorSub = ExpoSpeechRecognitionModule.addListener(
          "error",
          () => {
            setIsListening(false);
            subscription.remove();
            errorSub?.remove();
          }
        );

        ExpoSpeechRecognitionModule.start({
          lang: locale,
          interimResults: false,
        });
      } else {
        // Fallback: remind user about keyboard mic button
        Alert.alert(
          "Voice Input",
          Platform.OS === "ios"
            ? "Tap the microphone button on your keyboard to dictate text."
            : "Tap the microphone icon on your keyboard (Google Voice Typing) to dictate text.",
          [{ text: "OK" }]
        );
      }
    } catch {
      setIsListening(false);
      Alert.alert(
        "Voice Input",
        "Voice recognition is not available. Use the microphone button on your keyboard instead."
      );
    }
  }, [onResult, locale]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (speechRef.current) {
      try {
        speechRef.current.ExpoSpeechRecognitionModule.stop();
      } catch {
        // ignore
      }
    }
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
  };
}
