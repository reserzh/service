import { db } from "@/lib/db";
import {
  bookingRequests,
  serviceCatalog,
  customers,
  properties,
  jobs,
} from "@fieldservice/shared/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { UserContext } from "@/lib/auth";
import { assertPermission } from "@/lib/auth/permissions";
import { logActivity } from "./activity";
import { getNextSequenceNumber } from "./sequences";
import { NotFoundError } from "@/lib/api/errors";

export interface ListBookingsParams {
  status?: "pending" | "confirmed" | "canceled";
  page?: number;
  pageSize?: number;
}

export async function listBookingRequests(ctx: UserContext, params: ListBookingsParams = {}) {
  assertPermission(ctx, "website", "read");

  const { page = 1, status } = params;
  const pageSize = Math.min(Math.max(params.pageSize ?? 25, 1), 100);
  const offset = (page - 1) * pageSize;

  const conditions = [eq(bookingRequests.tenantId, ctx.tenantId)];
  if (status) {
    conditions.push(eq(bookingRequests.status, status));
  }

  const results = await db
    .select()
    .from(bookingRequests)
    .leftJoin(serviceCatalog, and(eq(bookingRequests.serviceId, serviceCatalog.id), eq(serviceCatalog.tenantId, ctx.tenantId)))
    .where(and(...conditions))
    .orderBy(desc(bookingRequests.createdAt))
    .limit(pageSize)
    .offset(offset);

  return results.map((r) => ({
    ...r.booking_requests,
    service: r.service_catalog,
  }));
}

export async function getBookingRequest(ctx: UserContext, bookingId: string) {
  assertPermission(ctx, "website", "read");

  const [result] = await db
    .select()
    .from(bookingRequests)
    .leftJoin(serviceCatalog, and(eq(bookingRequests.serviceId, serviceCatalog.id), eq(serviceCatalog.tenantId, ctx.tenantId)))
    .where(and(eq(bookingRequests.id, bookingId), eq(bookingRequests.tenantId, ctx.tenantId)))
    .limit(1);

  if (!result) throw new NotFoundError("Booking request");

  return {
    ...result.booking_requests,
    service: result.service_catalog,
  };
}

export async function updateBookingStatus(
  ctx: UserContext,
  bookingId: string,
  status: "pending" | "confirmed" | "canceled"
) {
  assertPermission(ctx, "website", "update");

  const [updated] = await db
    .update(bookingRequests)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(bookingRequests.id, bookingId), eq(bookingRequests.tenantId, ctx.tenantId)))
    .returning();

  if (!updated) throw new NotFoundError("Booking request");

  await logActivity(ctx, "website", updated.id, "booking_status_updated", { status });
  return updated;
}

export async function convertToJob(ctx: UserContext, bookingId: string) {
  assertPermission(ctx, "jobs", "create");

  const [booking] = await db
    .select()
    .from(bookingRequests)
    .where(and(eq(bookingRequests.id, bookingId), eq(bookingRequests.tenantId, ctx.tenantId)))
    .limit(1);

  if (!booking) throw new NotFoundError("Booking request");

  // Check if already converted
  if (booking.convertedJobId) {
    return { jobId: booking.convertedJobId, customerId: booking.convertedCustomerId };
  }

  const result = await db.transaction(async (tx) => {
    // Create or find customer
    let customerId: string;
    const existingCustomers = await tx
      .select()
      .from(customers)
      .where(and(eq(customers.tenantId, ctx.tenantId), eq(customers.email, booking.email)))
      .limit(1);

    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
    } else {
      const [newCustomer] = await tx
        .insert(customers)
        .values({
          tenantId: ctx.tenantId,
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone,
          createdBy: ctx.userId,
        })
        .returning();
      customerId = newCustomer.id;
    }

    // Create property if address provided
    let propertyId: string | undefined;
    if (booking.addressLine1) {
      const [property] = await tx
        .insert(properties)
        .values({
          tenantId: ctx.tenantId,
          customerId,
          addressLine1: booking.addressLine1,
          addressLine2: booking.addressLine2 ?? null,
          city: booking.city ?? "",
          state: booking.state ?? "",
          zip: booking.zip ?? "",
          isPrimary: true,
        })
        .returning();
      propertyId = property.id;
    }

    // If no property, try to get existing primary
    if (!propertyId) {
      const existingProps = await tx
        .select()
        .from(properties)
        .where(and(eq(properties.tenantId, ctx.tenantId), eq(properties.customerId, customerId)))
        .limit(1);
      if (existingProps.length > 0) {
        propertyId = existingProps[0].id;
      }
    }

    if (!propertyId) {
      throw new Error("Cannot create job without a service address. Please add an address to the booking.");
    }

    // Get service name for job summary
    let serviceName = "Service Request";
    if (booking.serviceId) {
      const [svc] = await tx
        .select({ name: serviceCatalog.name })
        .from(serviceCatalog)
        .where(and(eq(serviceCatalog.id, booking.serviceId), eq(serviceCatalog.tenantId, ctx.tenantId)))
        .limit(1);
      if (svc) serviceName = svc.name;
    }

    const jobNumber = await getNextSequenceNumber(ctx.tenantId, "job", tx);

    const [job] = await tx
      .insert(jobs)
      .values({
        tenantId: ctx.tenantId,
        jobNumber,
        customerId,
        propertyId,
        jobType: "service",
        summary: `${serviceName} - Online Booking`,
        description: booking.message ?? null,
        scheduledStart: booking.preferredDate
          ? new Date(`${booking.preferredDate}T09:00:00`)
          : undefined,
        createdBy: ctx.userId,
      })
      .returning();

    // Update booking with conversion references
    await tx
      .update(bookingRequests)
      .set({
        convertedJobId: job.id,
        convertedCustomerId: customerId,
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(and(eq(bookingRequests.id, bookingId), eq(bookingRequests.tenantId, ctx.tenantId)));

    return { jobId: job.id, customerId };
  });

  await logActivity(ctx, "website", bookingId, "booking_converted", {
    jobId: result.jobId,
    customerId: result.customerId,
  });

  return result;
}
