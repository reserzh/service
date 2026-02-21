import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function MoreLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const headerStyle = {
    backgroundColor: isDark ? "#0f172a" : "#f8fafc",
  };
  const headerTintColor = isDark ? "#f8fafc" : "#0f172a";

  return (
    <Stack
      screenOptions={{
        animation: "slide_from_right",
        headerTintColor,
        headerTitleStyle: { fontWeight: "600" as const },
        headerStyle,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="customers/index"
        options={{
          headerShown: true,
          title: "Customers",
          headerBackTitle: "More",
        }}
      />
      <Stack.Screen
        name="customers/[id]"
        options={{
          headerShown: true,
          title: "Customer",
          headerBackTitle: "Customers",
        }}
      />
      <Stack.Screen
        name="estimates/index"
        options={{
          headerShown: true,
          title: "Estimates",
          headerBackTitle: "More",
        }}
      />
      <Stack.Screen
        name="estimates/[id]"
        options={{
          headerShown: true,
          title: "Estimate",
          headerBackTitle: "Estimates",
        }}
      />
      <Stack.Screen
        name="estimates/create"
        options={{
          headerShown: true,
          title: "New Estimate",
          headerBackTitle: "Estimates",
        }}
      />
      <Stack.Screen
        name="invoices/index"
        options={{
          headerShown: true,
          title: "Invoices",
          headerBackTitle: "More",
        }}
      />
      <Stack.Screen
        name="invoices/[id]"
        options={{
          headerShown: true,
          title: "Invoice",
          headerBackTitle: "Invoices",
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          title: "Profile",
          headerBackTitle: "More",
        }}
      />
    </Stack>
  );
}
