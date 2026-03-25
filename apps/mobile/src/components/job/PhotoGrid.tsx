import { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, Dimensions, Alert } from "react-native";
import { Image } from "expo-image";
import { X, Trash2, ImageOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useDeletePhoto } from "@/hooks/usePhotos";
import { PendingSyncBadge } from "@/components/ui/PendingSyncBadge";
import { formatRelativeTime } from "@/lib/format";
import { SUPABASE_URL } from "@/lib/constants";
import { photoUriCache } from "@/lib/photoUriCache";
import type { JobPhoto } from "@/types/models";

interface OfflinePhoto extends JobPhoto {
  _offlineUri?: string;
  _pending?: boolean;
}

interface PhotoGridProps {
  photos: OfflinePhoto[];
  jobId: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 16;
const GRID_GAP = 8;
const COLUMNS = 3;
const THUMB_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

function getPhotoUrl(photo: OfflinePhoto): string {
  // Use local file URI for offline/pending photos
  if (photo._offlineUri) {
    return photo._offlineUri;
  }
  // Fall back to cached local URI from a recent upload (survives cache invalidation)
  const cached = photoUriCache.get(photo.id);
  if (cached) {
    return cached;
  }
  return `${SUPABASE_URL}/storage/v1/object/public/job-photos/${photo.storagePath}`;
}

export function PhotoGrid({ photos, jobId }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<OfflinePhoto | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());
  const deletePhoto = useDeletePhoto();

  // Clear failed state when photos change (e.g., after refetch resolves a transient error)
  useEffect(() => {
    setFailedIds(new Set());
  }, [photos]);

  const handleLongPress = (photo: OfflinePhoto) => {
    // Don't allow deleting pending offline photos from server
    if (photo._pending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePhoto.mutateAsync({ jobId, photoId: photo.id });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({ type: "success", text1: "Photo deleted" });
          } catch {
            Toast.show({ type: "error", text1: "Failed to delete photo" });
          }
        },
      },
    ]);
  };

  if (photos.length === 0) {
    return <Text className="text-sm text-stone-400 italic">No photos yet</Text>;
  }

  // Group photos: Before > After > General
  const beforePhotos = photos.filter((p) => p.photoType === "before");
  const afterPhotos = photos.filter((p) => p.photoType === "after");
  const generalPhotos = photos.filter((p) => p.photoType === "general" || !p.photoType);
  const hasMultipleTypes = [beforePhotos.length > 0, afterPhotos.length > 0, generalPhotos.length > 0]
    .filter(Boolean).length > 1;

  const renderGrid = (group: OfflinePhoto[]) => (
    <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
      {group.map((photo) => (
        <Pressable
          key={photo.id}
          onPress={() => setSelectedPhoto(photo)}
          onLongPress={() => handleLongPress(photo)}
          className="rounded-lg overflow-hidden bg-stone-200 dark:bg-stone-700"
        >
          {failedIds.has(photo.id) ? (
            <View
              style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
              className="items-center justify-center bg-stone-200 dark:bg-stone-700"
            >
              <ImageOff size={24} color="#A8A29E" />
            </View>
          ) : (
            <Image
              source={{ uri: getPhotoUrl(photo) }}
              style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
              contentFit="cover"
              transition={200}
              recyclingKey={photo.id}
              onError={() =>
                setFailedIds((prev) => new Set(prev).add(photo.id))
              }
            />
          )}
          {/* Type badge */}
          {photo.photoType && photo.photoType !== "general" && (
            <View
              className={`absolute top-1 left-1 px-1.5 py-0.5 rounded ${
                photo.photoType === "before" ? "bg-blue-500" : "bg-green-500"
              }`}
            >
              <Text className="text-[10px] font-semibold text-white uppercase">
                {photo.photoType}
              </Text>
            </View>
          )}
          {/* Pending sync badge */}
          {photo._pending && (
            <View className="absolute top-1 right-1">
              <PendingSyncBadge count={1} compact />
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );

  return (
    <>
      {hasMultipleTypes ? (
        <View className="gap-3">
          {beforePhotos.length > 0 && (
            <View>
              <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">Before</Text>
              {renderGrid(beforePhotos)}
            </View>
          )}
          {afterPhotos.length > 0 && (
            <View>
              <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">After</Text>
              {renderGrid(afterPhotos)}
            </View>
          )}
          {generalPhotos.length > 0 && (
            <View>
              <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">General</Text>
              {renderGrid(generalPhotos)}
            </View>
          )}
        </View>
      ) : (
        renderGrid(photos)
      )}

      {/* Fullscreen modal */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <View className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 pt-14 pb-3">
            <View className="flex-1">
              {selectedPhoto?.caption && (
                <Text className="text-white text-sm font-medium" numberOfLines={1}>
                  {selectedPhoto.caption}
                </Text>
              )}
              {selectedPhoto && (
                <Text className="text-white/60 text-xs">
                  {selectedPhoto._pending
                    ? "Pending upload"
                    : formatRelativeTime(selectedPhoto.createdAt)}
                </Text>
              )}
            </View>
            <View className="flex-row items-center gap-4">
              {selectedPhoto && !selectedPhoto._pending && (
                <Pressable
                  onPress={() => {
                    if (selectedPhoto) handleLongPress(selectedPhoto);
                  }}
                  hitSlop={12}
                >
                  <Trash2 size={22} color="#ef4444" />
                </Pressable>
              )}
              <Pressable onPress={() => setSelectedPhoto(null)} hitSlop={12}>
                <X size={24} color="#fff" />
              </Pressable>
            </View>
          </View>
          {selectedPhoto && (
            <Image
              source={{ uri: getPhotoUrl(selectedPhoto) }}
              style={{ flex: 1 }}
              contentFit="contain"
              transition={200}
            />
          )}
        </View>
      </Modal>
    </>
  );
}
