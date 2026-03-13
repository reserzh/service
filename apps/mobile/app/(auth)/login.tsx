import { useState, useEffect } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Wrench, Eye, EyeOff, Fingerprint, Check, Square } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeInUp, BounceIn } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSignIn } from "@/hooks/useAuth";
import {
  isBiometricAvailable,
  authenticateWithBiometrics,
  getBiometricType,
} from "@/lib/biometrics";
import Toast from "react-native-toast-message";

const REMEMBER_KEY = "remember_email";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const signIn = useSignIn();

  // Load remembered email and check biometrics
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }

      const available = await isBiometricAvailable();
      if (available) {
        const type = await getBiometricType();
        setBiometricLabel(type);
      }
    })();
  }, []);

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!email.includes("@")) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_KEY, email.trim());
      } else {
        await AsyncStorage.removeItem(REMEMBER_KEY);
      }
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricLabel) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await authenticateWithBiometrics("Sign in to FieldService Pro");
    if (success) {
      // Biometric verified - still need password for actual auth
      // This is a convenience prompt; in production you'd store a secure token
      Toast.show({
        type: "info",
        text1: "Biometric verified",
        text2: "Enter your password to sign in",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-1 justify-center px-6"
          keyboardShouldPersistTaps="handled"
        >
          {/* Animated Logo / Brand */}
          <Animated.View entering={BounceIn.duration(600)} className="items-center mb-10">
            <View className="w-20 h-20 bg-blue-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
              <Wrench size={40} color="#ffffff" />
            </View>
            <Animated.Text
              entering={FadeInDown.delay(200).duration(400)}
              className="text-3xl font-bold text-slate-900 dark:text-white"
            >
              FieldService Pro
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(300).duration(400)}
              className="text-base text-slate-500 dark:text-slate-400 mt-1"
            >
              Sign in to your account
            </Animated.Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(400).duration(400)} className="gap-4">
            <Input
              label="Email"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="you@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
            />

            <View>
              <Input
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                }}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoComplete="password"
                error={errors.password}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 p-2"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                accessibilityRole="button"
              >
                {showPassword ? (
                  <EyeOff size={20} color="#64748b" />
                ) : (
                  <Eye size={20} color="#64748b" />
                )}
              </Pressable>
            </View>

            {/* Remember me */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setRememberMe(!rememberMe);
              }}
              className="flex-row items-center gap-2"
              accessibilityLabel="Remember me"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View
                className={`w-6 h-6 rounded border items-center justify-center ${
                  rememberMe
                    ? "bg-blue-600 border-blue-600"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              >
                {rememberMe && <Check size={14} color="#fff" />}
              </View>
              <Text className="text-base text-slate-700 dark:text-slate-300">
                Remember me
              </Text>
            </Pressable>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              className="mt-2"
            />

            {/* Biometric quick login */}
            {biometricLabel && (
              <Pressable
                onPress={handleBiometricLogin}
                className="flex-row items-center justify-center gap-2 py-4 min-h-[56px] rounded-xl border border-slate-200 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800"
                accessibilityLabel={`Sign in with ${biometricLabel}`}
                accessibilityRole="button"
              >
                <Fingerprint size={24} color="#3b82f6" />
                <Text className="text-lg font-medium text-slate-700 dark:text-slate-300">
                  Sign in with {biometricLabel}
                </Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Footer */}
          <View className="items-center mt-8">
            <Pressable>
              <Text className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Forgot your password?
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
