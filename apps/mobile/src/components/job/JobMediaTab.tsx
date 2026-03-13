import { View, Text, ScrollView } from "react-native";
import { useMemo, useState } from "react";
import { PenTool, ArrowLeftRight } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PhotoGrid } from "./PhotoGrid";
import { PhotoCapture } from "./PhotoCapture";
import { SignatureList } from "./SignatureList";
import { SignatureModal } from "./SignatureModal";
import { PhotoComparisonSlider } from "@/components/PhotoComparisonSlider";
import type { JobWithRelations } from "@/types/models";
import { SUPABASE_URL } from "@/lib/constants";

interface JobMediaTabProps {
  job: JobWithRelations;
}

export function JobMediaTab({ job }: JobMediaTabProps) {
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const comparisonPhotos = useMemo(() => {
    const before = job.photos.find((p) => p.photoType === "before");
    const after = job.photos.find((p) => p.photoType === "after");
    if (!before || !after) return null;
    return {
      beforeUri: `${SUPABASE_URL}/storage/v1/object/public/job-photos/${before.storagePath}`,
      afterUri: `${SUPABASE_URL}/storage/v1/object/public/job-photos/${after.storagePath}`,
    };
  }, [job.photos]);

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pt-3 pb-8">
      {/* Photos */}
      <Card className="mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Photos
            </Text>
            {job.photos.length > 0 && (
              <Badge
                label={String(job.photos.length)}
                bgClass="bg-blue-100"
                textClass="text-blue-700"
                size="sm"
              />
            )}
          </View>
          <View className="flex-row items-center gap-2">
            {comparisonPhotos && (
              <Button
                title="Compare"
                variant="outline"
                size="sm"
                onPress={() => setShowComparison(!showComparison)}
                icon={<ArrowLeftRight size={14} color="#3b82f6" />}
              />
            )}
            <PhotoCapture jobId={job.id} />
          </View>
        </View>
        {showComparison && comparisonPhotos ? (
          <PhotoComparisonSlider
            beforeUri={comparisonPhotos.beforeUri}
            afterUri={comparisonPhotos.afterUri}
          />
        ) : (
          <PhotoGrid photos={job.photos} jobId={job.id} />
        )}
      </Card>

      {/* Signatures */}
      <Card>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Signatures
            </Text>
            {job.signatures.length > 0 && (
              <Badge
                label={String(job.signatures.length)}
                bgClass="bg-emerald-100"
                textClass="text-emerald-700"
                size="sm"
              />
            )}
          </View>
          <Button
            title="Capture"
            variant="outline"
            size="sm"
            onPress={() => setShowSignatureModal(true)}
            icon={<PenTool size={14} color="#3b82f6" />}
          />
        </View>
        <SignatureList signatures={job.signatures} />
      </Card>

      <SignatureModal
        jobId={job.id}
        visible={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
      />
    </ScrollView>
  );
}
