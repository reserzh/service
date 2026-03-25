import { Metadata } from "next";
import { LoginForm } from "./login-form";
import { getTenant } from "@/lib/get-tenant";

export const metadata: Metadata = { title: "Portal Login" };

export default async function PortalLoginPage() {
  let companyName = "Customer Portal";
  let logoUrl: string | undefined;

  try {
    const site = await getTenant();
    const branding = (site.branding ?? {}) as Record<string, string>;
    companyName = branding.businessName || site.companyName || companyName;
    logoUrl = branding.logoUrl || undefined;
  } catch {
    // Use defaults if tenant not found
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {logoUrl && (
            <img src={logoUrl} alt="" className="mx-auto mb-4 h-12 w-auto" />
          )}
          <h1 className="text-2xl font-bold">{companyName}</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to view your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
