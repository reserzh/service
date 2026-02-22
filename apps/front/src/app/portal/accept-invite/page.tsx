import { Metadata } from "next";
import { AcceptInviteForm } from "./accept-invite-form";

export const metadata: Metadata = { title: "Accept Invitation" };

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Invalid Link</h1>
          <p className="mt-2 text-sm text-gray-600">This invitation link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Set Your Password</h1>
          <p className="mt-2 text-sm text-gray-600">Create a password to access your customer portal</p>
        </div>
        <AcceptInviteForm token={token} />
      </div>
    </div>
  );
}
