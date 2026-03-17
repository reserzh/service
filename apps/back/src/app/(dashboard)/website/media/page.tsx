import { requireAuth } from "@/lib/auth";
import { listMedia } from "@/lib/services/website";
import { PageHeader } from "@/components/layout/page-header";
import { MediaClient } from "./media-client";

export default async function MediaPage() {
  const ctx = await requireAuth();
  const media = await listMedia(ctx);

  // Serialize Date objects for client component
  const serialized = media.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        title="Media Library"
        description="Manage images and files for your website"
      />

      <MediaClient initialMedia={serialized} />
    </>
  );
}
