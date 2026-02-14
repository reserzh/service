import { requireAuth } from "@/lib/auth";
import { listBookingRequests } from "@/lib/services/bookings";
import { PageHeader } from "@/components/layout/page-header";
import { BookingsList } from "./bookings-list";

export default async function BookingsPage() {
  const ctx = await requireAuth();
  const bookings = await listBookingRequests(ctx);

  const serialized = bookings.map((b) => ({
    ...b,
    preferredDate: b.preferredDate ? String(b.preferredDate) : null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    service: b.service ? { name: b.service.name } : null,
  }));

  return (
    <>
      <PageHeader
        title="Booking Requests"
        description="Manage online booking submissions from your website"
      />
      <BookingsList initialBookings={serialized} />
    </>
  );
}
