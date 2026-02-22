import { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Portal Login" };

export default function PortalLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Customer Portal</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to view your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
