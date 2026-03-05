import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getCall } from "@/lib/services/calls";
import { PageHeader } from "@/components/layout/page-header";
import { CallDetail } from "./call-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Call Details" };
}

export default async function CallDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let call;
  try {
    call = await getCall(ctx, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Details"
        breadcrumbs={[
          { label: "Calls", href: "/calls" },
          { label: call.callSid.slice(0, 12) + "..." },
        ]}
      />
      <CallDetail call={call} />
    </div>
  );
}
