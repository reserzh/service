import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBookingRequest } from "@/lib/queries";

const bookingSchema = z.object({
  tenantId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTimeSlot: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid booking data", issues: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { tenantId, ...input } = parsed.data;
    const booking = await createBookingRequest(tenantId, input);

    return NextResponse.json({ data: { id: booking.id } }, { status: 201 });
  } catch (error) {
    console.error("Booking submission error:", error);
    return NextResponse.json(
      { error: { message: "Failed to submit booking" } },
      { status: 500 }
    );
  }
}
