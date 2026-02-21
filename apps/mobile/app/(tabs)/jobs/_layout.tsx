import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function JobsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const headerColors = {
    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
    tintColor: isDark ? "#f8fafc" : "#0f172a",
  };

  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: "Job Details",
          headerBackTitle: "Jobs",
          headerStyle: { backgroundColor: headerColors.backgroundColor },
          headerTintColor: headerColors.tintColor,
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
    </Stack>
  );
}
