import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getTenantSettings } from "@/lib/services/settings";
import { PageHeader } from "@/components/layout/page-header";
import { BookingAvailabilityForm } from "./booking-availability-form";

export const metadata: Metadata = { title: "Booking Availability" };

export default async function BookingAvailabilityPage() {
  const ctx = await requireAuth();
  const settings = await getTenantSettings(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Availability"
        description="Configure when customers can request quotes and bookings on your public website"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Booking Availability" },
        ]}
      />
      <BookingAvailabilityForm
        quoteAvailability={settings.quoteAvailability}
      />
    </div>
  );
}
