import { useState } from "react";
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
import { Wrench } from "lucide-react-native";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSignIn } from "@/hooks/useAuth";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const signIn = useSignIn();

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
          {/* Logo / Brand */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
              <Wrench size={32} color="#ffffff" />
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
              FieldService Pro
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in to your account
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
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

            <Input
              label="Password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
              error={errors.password}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              className="mt-2"
            />
          </View>

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
