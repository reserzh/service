import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBookingRequest, getTenantSettings } from "@/lib/queries";

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

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

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

    // Validate against quote availability settings
    const settings = await getTenantSettings(tenantId);
    const availability = settings.quoteAvailability;

    if (availability?.enabled && input.preferredDate) {
      const date = new Date(input.preferredDate + "T00:00:00");
      const dayKey = DAY_KEYS[date.getDay()];

      // Check day of week is allowed
      const dayWindows = availability.windows[dayKey];
      if (!dayWindows || dayWindows.length === 0) {
        return NextResponse.json(
          { error: { message: "Bookings are not available on this day of the week" } },
          { status: 400 }
        );
      }

      // Check lead time
      if (availability.leadTimeDays !== undefined && availability.leadTimeDays > 0) {
        const minDate = new Date();
        minDate.setHours(0, 0, 0, 0);
        minDate.setDate(minDate.getDate() + availability.leadTimeDays);
        if (date < minDate) {
          return NextResponse.json(
            { error: { message: `Bookings must be made at least ${availability.leadTimeDays} day(s) in advance` } },
            { status: 400 }
          );
        }
      }

      // Check max advance days
      if (availability.maxAdvanceDays !== undefined) {
        const maxDate = new Date();
        maxDate.setHours(0, 0, 0, 0);
        maxDate.setDate(maxDate.getDate() + availability.maxAdvanceDays);
        if (date > maxDate) {
          return NextResponse.json(
            { error: { message: `Bookings cannot be made more than ${availability.maxAdvanceDays} day(s) in advance` } },
            { status: 400 }
          );
        }
      }

      // Check time slot falls within a configured window
      if (input.preferredTimeSlot && input.preferredTimeSlot.includes("-")) {
        const [slotStart, slotEnd] = input.preferredTimeSlot.split("-").map((t) => t.trim());
        const isValidSlot = dayWindows.some(
          (w) => w.start === slotStart && w.end === slotEnd
        );
        if (!isValidSlot) {
          return NextResponse.json(
            { error: { message: "The selected time slot is not available" } },
            { status: 400 }
          );
        }
      }
    }

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
