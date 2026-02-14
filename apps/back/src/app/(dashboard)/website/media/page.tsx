import { requireAuth } from "@/lib/auth";
import { listMedia } from "@/lib/services/website";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload } from "lucide-react";

export default async function MediaPage() {
  const ctx = await requireAuth();
  const media = await listMedia(ctx);

  return (
    <>
      <PageHeader
        title="Media Library"
        description="Manage images and files for your website"
      />

      <div className="mt-6">
        <div className="flex justify-end mb-4">
          <Button disabled>
            <Upload className="mr-2 h-4 w-4" />
            Upload Media
          </Button>
        </div>

        {media.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Image className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No media files yet. Upload images to use on your website.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {media.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {item.mimeType?.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.altText ?? item.filename}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate">{item.filename}</p>
                  {item.sizeBytes && (
                    <p className="text-xs text-muted-foreground">
                      {(item.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
