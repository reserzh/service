import { db } from "./db";
import {
  trackingSessions,
  users,
  tenants,
  jobs,
  properties,
} from "@fieldservice/shared/db/schema";
import { eq } from "drizzle-orm";

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
      companyName: tenants.name,
      companyPhone: tenants.phone,
      jobNumber: jobs.jobNumber,
      jobSummary: jobs.summary,
      propertyAddress: properties.addressLine1,
      propertyCity: properties.city,
      propertyState: properties.state,
      propertyZip: properties.zip,
    })
    .from(trackingSessions)
    .innerJoin(users, eq(trackingSessions.technicianId, users.id))
    .innerJoin(tenants, eq(trackingSessions.tenantId, tenants.id))
    .innerJoin(jobs, eq(trackingSessions.jobId, jobs.id))
    .innerJoin(properties, eq(jobs.propertyId, properties.id))
    .where(eq(trackingSessions.token, token))
    .limit(1);

  if (!session) return null;

  // Check if expired — persist to DB
  if (session.status === "active" && new Date(session.expiresAt) < new Date()) {
    await db
      .update(trackingSessions)
      .set({ status: "expired", endedAt: new Date() })
      .where(eq(trackingSessions.id, session.id));
    return { ...session, status: "expired" as const };
  }

  return session;
}
