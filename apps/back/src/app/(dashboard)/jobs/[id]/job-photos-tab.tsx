"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  ArrowLeftRight,
  X,
} from "lucide-react";
import type { JobData } from "./job-detail-content";

function PhotoSection({
  photos,
  getPhotoUrl,
  onSelect,
}: {
  photos: { id: string; storagePath: string; caption: string | null; photoType: string; createdAt: Date }[];
  getPhotoUrl: (path: string) => string;
  onSelect: (url: string) => void;
}) {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <button
          key={photo.id}
          className="group relative rounded-lg overflow-hidden bg-muted aspect-square cursor-pointer border hover:ring-2 hover:ring-primary transition-all"
          onClick={() => onSelect(getPhotoUrl(photo.storagePath))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPhotoUrl(photo.storagePath)}
            alt={photo.caption || "Job photo"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {photo.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-6">
              <p className="text-[11px] text-white truncate">{photo.caption}</p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

interface JobPhotosTabProps {
  job: JobData;
}

export function JobPhotosTab({ job }: JobPhotosTabProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonSlider, setComparisonSlider] = useState(50);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  function getPhotoUrl(storagePath: string) {
    return `${supabaseUrl}/storage/v1/object/public/job-photos/${storagePath}`;
  }

  // Group photos by type
  const beforePhotos = job.photos.filter((p) => p.photoType === "before");
  const afterPhotos = job.photos.filter((p) => p.photoType === "after");
  const generalPhotos = job.photos.filter((p) => p.photoType === "general" || !p.photoType);

  return (
    <>
      {job.photos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No photos yet. Photos can be added from the mobile app.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Comparison view */}
          {beforePhotos.length > 0 && afterPhotos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant={showComparison ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
                  Compare
                </Button>
              </div>
              {showComparison && (
                <Card className="overflow-hidden mb-4">
                  <CardContent className="p-0">
                    <div
                      className="relative w-full select-none"
                      style={{ aspectRatio: "16/9" }}
                    >
                      {/* After (full) */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getPhotoUrl(afterPhotos[0].storagePath)}
                        alt="After"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Before (clipped) */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${comparisonSlider}%` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getPhotoUrl(beforePhotos[0].storagePath)}
                          alt="Before"
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ minWidth: "100%", width: `${10000 / comparisonSlider}%`, maxWidth: "none" }}
                        />
                      </div>
                      {/* Divider line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
                        style={{ left: `${comparisonSlider}%` }}
                      />
                      {/* Labels */}
                      <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white font-medium">
                        Before
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded text-xs text-white font-medium">
                        After
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={comparisonSlider}
                        onChange={(e) => setComparisonSlider(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {beforePhotos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Before</h4>
              <PhotoSection photos={beforePhotos} getPhotoUrl={getPhotoUrl} onSelect={setSelectedPhoto} />
            </div>
          )}
          {afterPhotos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">After</h4>
              <PhotoSection photos={afterPhotos} getPhotoUrl={getPhotoUrl} onSelect={setSelectedPhoto} />
            </div>
          )}
          {generalPhotos.length > 0 && (
            <div>
              {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                <h4 className="text-sm font-medium mb-3">General</h4>
              )}
              <PhotoSection photos={generalPhotos} getPhotoUrl={getPhotoUrl} onSelect={setSelectedPhoto} />
            </div>
          )}
        </div>
      )}

      {/* Lightbox modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-white/80"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedPhoto}
            alt="Photo detail"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
