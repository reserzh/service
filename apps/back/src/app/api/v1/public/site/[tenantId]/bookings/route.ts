import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { bookingRequests, tenants } from "@fieldservice/shared/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { handleApiError, validateUUID } from "@/lib/api/errors";

const bookingSchema = z.object({
  serviceId: z.string().uuid().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().min(1).max(50),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zip: z.string().max(20).optional(),
  preferredDate: z.string().optional(),
  preferredTimeSlot: z.enum(["morning", "afternoon", "evening"]).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    validateUUID(tenantId);

    // Validate tenant exists
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (!tenant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = bookingSchema.parse(body);

    // Prevent duplicate submissions: same email + tenant within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [recentDuplicate] = await db
      .select({ id: bookingRequests.id })
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.tenantId, tenantId),
          eq(bookingRequests.email, parsed.email),
          gte(bookingRequests.createdAt, fiveMinutesAgo)
        )
      )
      .limit(1);

    if (recentDuplicate) {
      return NextResponse.json(
        { data: { id: recentDuplicate.id, message: "Booking request already submitted" } },
        { status: 200 }
      );
    }

    const [booking] = await db
      .insert(bookingRequests)
      .values({
        tenantId,
        serviceId: parsed.serviceId,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        phone: parsed.phone,
        addressLine1: parsed.addressLine1,
        addressLine2: parsed.addressLine2,
        city: parsed.city,
        state: parsed.state,
        zip: parsed.zip,
        preferredDate: parsed.preferredDate,
        preferredTimeSlot: parsed.preferredTimeSlot,
        message: parsed.message,
      })
      .returning({ id: bookingRequests.id });

    return NextResponse.json(
      { data: { id: booking.id, message: "Booking request submitted successfully" } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
