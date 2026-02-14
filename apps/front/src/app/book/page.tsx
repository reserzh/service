import { getTenant } from "@/lib/get-tenant";
import { getBookableServices } from "@/lib/queries";
import { BookingForm } from "./booking-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Service",
  description: "Schedule a service appointment online",
};

export default async function BookPage() {
  const site = await getTenant();
  const services = await getBookableServices(site.tenantId);

  const branding = (site.branding ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Book a Service</h1>
        <p className="mt-2 text-gray-600">
          Schedule an appointment with {branding.businessName || site.companyName}
        </p>
      </div>

      <BookingForm
        tenantId={site.tenantId}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          estimatedDuration: s.estimatedDuration,
          priceDisplay: s.priceDisplay,
        }))}
      />
    </div>
  );
}
