import { requireCustomerAuth } from "@/lib/portal-auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function PortalProfilePage() {
  const ctx = await requireCustomerAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>

      {/* Customer Info */}
      <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Account Information
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="mt-1 text-gray-900">
              {ctx.firstName} {ctx.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="mt-1 text-gray-900">{ctx.email}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="mt-8 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Change Password
        </h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
