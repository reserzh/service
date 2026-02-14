import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { bookingRequests } from "@fieldservice/shared/db/schema";
import { handleApiError } from "@/lib/api/errors";

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
    const body = await req.json();
    const parsed = bookingSchema.parse(body);

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
