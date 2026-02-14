import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { router } from "expo-router";
import { usersApi } from "@/api/endpoints/users";

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not already granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission not granted");
    return null;
  }

  // Get the Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  // Set Android notification channel
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return tokenData.data;
}

export async function savePushToken(token: string): Promise<void> {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  try {
    await usersApi.registerPushToken({ token, platform });
  } catch (error) {
    console.error("Failed to save push token:", error);
  }
}

export async function removePushToken(): Promise<void> {
  try {
    await usersApi.removePushToken();
  } catch (error) {
    console.error("Failed to remove push token:", error);
  }
}

export function setupNotificationHandler(): () => void {
  // Handle notification taps - navigate to relevant screen
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;

      if (data?.jobId) {
        router.push(`/(tabs)/jobs/${data.jobId}`);
      }
    }
  );

  return () => subscription.remove();
}
