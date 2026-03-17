import { View, Text, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { Fingerprint, Lock } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import {
  isBiometricAvailable,
  authenticateWithBiometrics,
  getBiometricType,
} from "@/lib/biometrics";

interface BiometricLockProps {
  visible: boolean;
  onUnlock: () => void;
}

export function BiometricLock({ visible, onUnlock }: BiometricLockProps) {
  const [biometricLabel, setBiometricLabel] = useState("Unlock");
  const [hasBiometrics, setHasBiometrics] = useState(false);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setHasBiometrics(available);
      if (available) {
        const type = await getBiometricType();
        setBiometricLabel(`Unlock with ${type}`);
        // Auto-prompt on mount
        const success = await authenticateWithBiometrics("Unlock FieldService Pro");
        if (success) {
          onUnlock();
        }
      }
    })();
  }, [visible]);

  if (!visible) return null;

  const handleUnlock = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (hasBiometrics) {
      const success = await authenticateWithBiometrics("Unlock FieldService Pro");
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onUnlock();
      }
    } else {
      // No biometrics, just unlock (fallback for devices without biometric hardware)
      onUnlock();
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="absolute inset-0 bg-stone-900 items-center justify-center z-50"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <View className="items-center">
        <View className="w-20 h-20 rounded-full bg-stone-800 items-center justify-center mb-6">
          <Lock size={36} color="#A8A29E" />
        </View>
        <Text className="text-xl font-bold text-white mb-2">
          FieldService Pro
        </Text>
        <Text className="text-sm text-stone-400 mb-8">
          Session locked
        </Text>
        <Pressable
          onPress={handleUnlock}
          className="flex-row items-center gap-3 bg-blue-600 rounded-2xl px-8 py-4 active:bg-blue-700"
          accessibilityLabel={biometricLabel}
          accessibilityRole="button"
        >
          <Fingerprint size={22} color="#ffffff" />
          <Text className="text-base font-semibold text-white">
            {biometricLabel}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
