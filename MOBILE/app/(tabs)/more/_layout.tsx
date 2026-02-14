import { Stack } from "expo-router";

export default function MoreLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="customers/index"
        options={{
          headerShown: true,
          title: "Customers",
          headerBackTitle: "More",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <Stack.Screen
        name="customers/[id]"
        options={{
          headerShown: true,
          title: "Customer",
          headerBackTitle: "Customers",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <Stack.Screen
        name="estimates/index"
        options={{
          headerShown: true,
          title: "Estimates",
          headerBackTitle: "More",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <Stack.Screen
        name="estimates/[id]"
        options={{
          headerShown: true,
          title: "Estimate",
          headerBackTitle: "Estimates",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <Stack.Screen
        name="estimates/create"
        options={{
          headerShown: true,
          title: "New Estimate",
          headerBackTitle: "Estimates",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <Stack.Screen
        name="invoices/index"
        options={{
          headerShown: true,
          title: "Invoices",
          headerBackTitle: "More",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <Stack.Screen
        name="invoices/[id]"
        options={{
          headerShown: true,
          title: "Invoice",
          headerBackTitle: "Invoices",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          title: "Profile",
          headerBackTitle: "More",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
    </Stack>
  );
}
