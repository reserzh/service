import { Stack } from "expo-router";

export default function JobsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: "Job Details",
          headerBackTitle: "Jobs",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTintColor: "#0f172a",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
    </Stack>
  );
}
