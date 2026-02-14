import { cache } from "react";
import { db } from "./db";
import {
  sitePages,
  siteSections,
  serviceCatalog,
  bookingRequests,
} from "@fieldservice/shared/db/schema";
import { eq, and, asc } from "drizzle-orm";

export const getPublishedPage = cache(async (tenantId: string, slug: string) => {
  const [page] = await db
    .select()
    .from(sitePages)
    .where(
      and(
        eq(sitePages.tenantId, tenantId),
        eq(sitePages.slug, slug),
        eq(sitePages.status, "published")
      )
    )
    .limit(1);

  return page ?? null;
});

export const getHomepage = cache(async (tenantId: string) => {
  const [page] = await db
    .select()
    .from(sitePages)
    .where(
      and(
        eq(sitePages.tenantId, tenantId),
        eq(sitePages.isHomepage, true),
        eq(sitePages.status, "published")
      )
    )
    .limit(1);

  return page ?? null;
});

export const getPageSections = cache(async (tenantId: string, pageId: string) => {
  return db
    .select()
    .from(siteSections)
    .where(
      and(
        eq(siteSections.tenantId, tenantId),
        eq(siteSections.pageId, pageId),
        eq(siteSections.isVisible, true)
      )
    )
    .orderBy(asc(siteSections.sortOrder));
});

export const getActiveServices = cache(async (tenantId: string) => {
  return db
    .select()
    .from(serviceCatalog)
    .where(
      and(
        eq(serviceCatalog.tenantId, tenantId),
        eq(serviceCatalog.isActive, true)
      )
    )
    .orderBy(asc(serviceCatalog.sortOrder));
});

export const getBookableServices = cache(async (tenantId: string) => {
  return db
    .select()
    .from(serviceCatalog)
    .where(
      and(
        eq(serviceCatalog.tenantId, tenantId),
        eq(serviceCatalog.isActive, true),
        eq(serviceCatalog.isBookable, true)
      )
    )
    .orderBy(asc(serviceCatalog.sortOrder));
});

export async function createBookingRequest(tenantId: string, input: {
  serviceId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  message?: string;
}) {
  const [booking] = await db
    .insert(bookingRequests)
    .values({
      tenantId,
      serviceId: input.serviceId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      zip: input.zip,
      preferredDate: input.preferredDate,
      preferredTimeSlot: input.preferredTimeSlot,
      message: input.message,
    })
    .returning();

  return booking;
}
