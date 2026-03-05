import * as Location from "expo-location";
// @ts-expect-error expo-task-manager types may not be installed in container
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jobsApi } from "@/api/endpoints/jobs";

const LOCATION_TASK_NAME = "background-location-tracking";
const TRACKING_JOB_ID_KEY = "@tracking_job_id";

// Define the background task
// eslint-disable-next-line @typescript-eslint/no-explicit-any
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: { data: any; error: any }) => {
  if (error) {
    console.error("[LocationTracking] Background task error:", error);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const jobId = await AsyncStorage.getItem(TRACKING_JOB_ID_KEY);
  if (!jobId) return;

  const latest = locations[locations.length - 1];
  try {
    await jobsApi.updateTrackingLocation(
      jobId,
      latest.coords.latitude,
      latest.coords.longitude
    );
  } catch {
    // Location updates are best-effort; silently drop failures (e.g. offline)
  }
});

export async function startLocationTracking(jobId: string): Promise<boolean> {
  try {
    // Request background permission
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") return false;

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      // Still allow en_route without background tracking
      console.warn("[LocationTracking] Background permission denied, tracking will be limited");
      return false;
    }

    // Store the job ID for the background task
    await AsyncStorage.setItem(TRACKING_JOB_ID_KEY, jobId);

    // Start background location updates
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15000, // 15 seconds
      distanceInterval: 50, // 50 meters
      deferredUpdatesInterval: 15000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Sharing location",
        notificationBody: "Your live location is being shared with the customer",
        notificationColor: "#4f46e5",
      },
    });

    return true;
  } catch (error) {
    console.error("[LocationTracking] Failed to start:", error);
    return false;
  }
}

export async function stopLocationTracking(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TRACKING_JOB_ID_KEY);
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (error) {
    console.error("[LocationTracking] Failed to stop:", error);
  }
}

export async function isTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch {
    return false;
  }
}
