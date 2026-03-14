import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GEOFENCE_TASK_NAME = "job-geofence-monitoring";
const GEOFENCES_KEY = "@active_geofences";

interface GeofenceRegion {
  identifier: string; // jobId
  latitude: number;
  longitude: number;
  radius: number;
  jobSummary: string;
  customerName: string;
}

interface ScheduledJob {
  id: string;
  summary: string;
  customerFirstName?: string;
  customerLastName?: string;
  propertyLatitude?: string | null;
  propertyLongitude?: string | null;
}

// Define the background geofence task
TaskManager.defineTask(
  GEOFENCE_TASK_NAME,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async ({ data, error }: { data: any; error: any }) => {
    if (error) {
      console.error("[Geofencing] Task error:", error);
      return;
    }

    const { eventType, region } = data as {
      eventType: Location.GeofencingEventType;
      region: { identifier: string };
    };

    if (eventType === Location.GeofencingEventType.Enter) {
      // Get stored geofence info
      const raw = await AsyncStorage.getItem(GEOFENCES_KEY);
      const geofences: GeofenceRegion[] = raw ? JSON.parse(raw) : [];
      const fence = geofences.find((g) => g.identifier === region.identifier);

      if (fence) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Arriving at job site",
            body: `${fence.jobSummary} — ${fence.customerName}`,
            data: { jobId: fence.identifier, action: "job_arrival" },
          },
          trigger: null,
        });
      }
    }
  }
);

/**
 * Set up geofences for today's scheduled jobs.
 * iOS supports max 20 regions, so we cap at that.
 */
export async function setupJobGeofences(jobs: ScheduledJob[]): Promise<number> {
  try {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") return 0;

    const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") return 0;

    // Filter jobs with valid coordinates
    const validJobs = jobs.filter(
      (j) => j.propertyLatitude && j.propertyLongitude
    );

    // Cap at 20 regions (iOS limit)
    const capped = validJobs.slice(0, 20);

    if (capped.length === 0) return 0;

    // Stop existing geofences first
    await clearJobGeofences();

    // Build regions
    const regions: GeofenceRegion[] = capped.map((job) => ({
      identifier: job.id,
      latitude: parseFloat(job.propertyLatitude!),
      longitude: parseFloat(job.propertyLongitude!),
      radius: 100, // ~100m radius
      jobSummary: job.summary,
      customerName: `${job.customerFirstName ?? ""} ${job.customerLastName ?? ""}`.trim(),
    }));

    // Store region metadata for the background task
    await AsyncStorage.setItem(GEOFENCES_KEY, JSON.stringify(regions));

    // Start geofencing
    await Location.startGeofencingAsync(
      GEOFENCE_TASK_NAME,
      regions.map((r) => ({
        identifier: r.identifier,
        latitude: r.latitude,
        longitude: r.longitude,
        radius: r.radius,
        notifyOnEnter: true,
        notifyOnExit: false,
      }))
    );

    return regions.length;
  } catch (error) {
    console.error("[Geofencing] Failed to setup:", error);
    return 0;
  }
}

export async function clearJobGeofences(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
    if (isRunning) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    }
    await AsyncStorage.removeItem(GEOFENCES_KEY);
  } catch (error) {
    console.error("[Geofencing] Failed to clear:", error);
  }
}
