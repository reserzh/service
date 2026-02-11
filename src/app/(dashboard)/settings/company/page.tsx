import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { getCompanyProfile } from "@/lib/services/settings";
import { PageHeader } from "@/components/layout/page-header";
import { CompanyProfileForm } from "./company-profile-form";

export const metadata: Metadata = { title: "Company Profile" };

export default async function CompanyProfilePage() {
  const ctx = await requireAuth();
  const company = await getCompanyProfile(ctx);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Profile"
        description="Update your business information"
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Company Profile" },
        ]}
      />
      <CompanyProfileForm company={company} />
    </div>
  );
}
