import { db } from "@/lib/db";
import {
  trackingSessions,
  jobs,
  properties,
  users,
  tenants,
} from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import crypto from "crypto";

const EARTH_RADIUS_KM = 6371;
const URBAN_AVG_SPEED_KMH = 30;
const ROUTE_FACTOR = 1.3;
const SESSION_TTL_HOURS = 4;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeEta(
  currentLat: number,
  currentLng: number,
  destLat: number,
  destLng: number
): number {
  const distKm = haversineDistance(currentLat, currentLng, destLat, destLng);
  const routeDistKm = distKm * ROUTE_FACTOR;
  return Math.round((routeDistKm / URBAN_AVG_SPEED_KMH) * 60);
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createTrackingSession(ctx: UserContext, jobId: string) {
  // Get job + property for destination coordinates
  const [job] = await db
    .select({
      id: jobs.id,
      propertyId: jobs.propertyId,
      assignedTo: jobs.assignedTo,
    })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.tenantId, ctx.tenantId)))
    .limit(1);

  if (!job) throw new Error("Job not found");

  const [property] = await db
    .select({
      latitude: properties.latitude,
      longitude: properties.longitude,
    })
    .from(properties)
    .where(and(eq(properties.id, job.propertyId), eq(properties.tenantId, ctx.tenantId)))
    .limit(1);

  // Expire any existing active sessions for this job
  await db
    .update(trackingSessions)
    .set({ status: "expired", endedAt: new Date() })
    .where(
      and(
        eq(trackingSessions.jobId, jobId),
        eq(trackingSessions.tenantId, ctx.tenantId),
        eq(trackingSessions.status, "active")
      )
    );

  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  const [session] = await db
    .insert(trackingSessions)
    .values({
      tenantId: ctx.tenantId,
      jobId,
      technicianId: job.assignedTo ?? ctx.userId,
      token,
      destinationLatitude: property?.latitude ?? null,
      destinationLongitude: property?.longitude ?? null,
      expiresAt,
    })
    .returning();

  return session;
}

export async function updateTrackingLocation(
  ctx: UserContext,
  jobId: string,
  latitude: number,
  longitude: number
) {
  const [session] = await db
    .select()
    .from(trackingSessions)
    .where(
      and(
        eq(trackingSessions.jobId, jobId),
        eq(trackingSessions.tenantId, ctx.tenantId),
        eq(trackingSessions.status, "active")
      )
    )
    .limit(1);

  if (!session) return null;

  // Only the assigned technician can update their own location
  if (session.technicianId !== ctx.userId) return null;

  let etaMinutes: number | null = null;
  if (session.destinationLatitude && session.destinationLongitude) {
    etaMinutes = computeEta(
      latitude,
      longitude,
      Number(session.destinationLatitude),
      Number(session.destinationLongitude)
    );
  }

  const [updated] = await db
    .update(trackingSessions)
    .set({
      currentLatitude: String(latitude),
      currentLongitude: String(longitude),
      etaMinutes,
      lastLocationAt: new Date(),
    })
    .where(eq(trackingSessions.id, session.id))
    .returning();

  return updated;
}

export async function endTrackingSession(ctx: UserContext, jobId: string) {
  await db
    .update(trackingSessions)
    .set({ status: "completed", endedAt: new Date() })
    .where(
      and(
        eq(trackingSessions.jobId, jobId),
        eq(trackingSessions.tenantId, ctx.tenantId),
        eq(trackingSessions.status, "active")
      )
    );
}

export async function getActiveTrackingSession(ctx: UserContext, jobId: string) {
  const [session] = await db
    .select()
    .from(trackingSessions)
    .where(
      and(
        eq(trackingSessions.jobId, jobId),
        eq(trackingSessions.tenantId, ctx.tenantId),
        eq(trackingSessions.status, "active")
      )
    )
    .limit(1);

  return session ?? null;
}

export async function getTrackingSessionByToken(token: string) {
  const [session] = await db
    .select({
      id: trackingSessions.id,
      status: trackingSessions.status,
      currentLatitude: trackingSessions.currentLatitude,
      currentLongitude: trackingSessions.currentLongitude,
      destinationLatitude: trackingSessions.destinationLatitude,
      destinationLongitude: trackingSessions.destinationLongitude,
      etaMinutes: trackingSessions.etaMinutes,
      lastLocationAt: trackingSessions.lastLocationAt,
      startedAt: trackingSessions.startedAt,
      endedAt: trackingSessions.endedAt,
      expiresAt: trackingSessions.expiresAt,
      techFirstName: users.firstName,
      techLastName: users.lastName,
      companyName: tenants.name,
      jobNumber: jobs.jobNumber,
      jobSummary: jobs.summary,
      propertyAddress: properties.addressLine1,
      propertyCity: properties.city,
      propertyState: properties.state,
      propertyZip: properties.zip,
    })
    .from(trackingSessions)
    .innerJoin(users, and(eq(trackingSessions.technicianId, users.id), eq(trackingSessions.tenantId, users.tenantId)))
    .innerJoin(tenants, eq(trackingSessions.tenantId, tenants.id))
    .innerJoin(jobs, and(eq(trackingSessions.jobId, jobs.id), eq(trackingSessions.tenantId, jobs.tenantId)))
    .innerJoin(properties, and(eq(jobs.propertyId, properties.id), eq(jobs.tenantId, properties.tenantId)))
    .where(eq(trackingSessions.token, token))
    .limit(1);

  if (!session) return null;

  // Check if expired
  if (session.status === "active" && new Date(session.expiresAt) < new Date()) {
    await db
      .update(trackingSessions)
      .set({ status: "expired", endedAt: new Date() })
      .where(eq(trackingSessions.id, session.id));
    return { ...session, status: "expired" as const };
  }

  return session;
}
