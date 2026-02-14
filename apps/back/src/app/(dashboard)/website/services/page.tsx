import { requireAuth } from "@/lib/auth";
import { listServices } from "@/lib/services/service-catalog";
import { PageHeader } from "@/components/layout/page-header";
import { ServicesList } from "./services-list";

export default async function ServicesPage() {
  const ctx = await requireAuth();
  const services = await listServices(ctx);

  return (
    <>
      <PageHeader
        title="Service Catalog"
        description="Manage services displayed on your public website"
      />
      <ServicesList initialServices={services} />
    </>
  );
}
