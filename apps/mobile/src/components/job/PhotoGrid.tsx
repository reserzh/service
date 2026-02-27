import { useState } from "react";
import { View, Text, Pressable, Modal, Dimensions, Alert } from "react-native";
import { Image } from "expo-image";
import { X, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useDeletePhoto } from "@/hooks/usePhotos";
import { formatRelativeTime } from "@/lib/format";
import { SUPABASE_URL } from "@/lib/constants";
import type { JobPhoto } from "@/types/models";

interface PhotoGridProps {
  photos: JobPhoto[];
  jobId: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 16;
const GRID_GAP = 8;
const COLUMNS = 3;
const THUMB_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

function getPhotoUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/job-photos/${storagePath}`;
}

export function PhotoGrid({ photos, jobId }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null);
  const deletePhoto = useDeletePhoto();

  const handleLongPress = (photo: JobPhoto) => {
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
    return <Text className="text-sm text-slate-400 italic">No photos yet</Text>;
  }

  // Group photos: Before > After > General
  const beforePhotos = photos.filter((p) => p.photoType === "before");
  const afterPhotos = photos.filter((p) => p.photoType === "after");
  const generalPhotos = photos.filter((p) => p.photoType === "general" || !p.photoType);
  const hasMultipleTypes = [beforePhotos.length > 0, afterPhotos.length > 0, generalPhotos.length > 0]
    .filter(Boolean).length > 1;

  const renderGrid = (group: JobPhoto[]) => (
    <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
      {group.map((photo) => (
        <Pressable
          key={photo.id}
          onPress={() => setSelectedPhoto(photo)}
          onLongPress={() => handleLongPress(photo)}
          className="rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700"
        >
          <Image
            source={{ uri: getPhotoUrl(photo.storagePath) }}
            style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
            contentFit="cover"
            transition={200}
          />
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
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Before</Text>
              {renderGrid(beforePhotos)}
            </View>
          )}
          {afterPhotos.length > 0 && (
            <View>
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">After</Text>
              {renderGrid(afterPhotos)}
            </View>
          )}
          {generalPhotos.length > 0 && (
            <View>
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">General</Text>
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
                  {formatRelativeTime(selectedPhoto.createdAt)}
                </Text>
              )}
            </View>
            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => {
                  if (selectedPhoto) handleLongPress(selectedPhoto);
                }}
                hitSlop={12}
              >
                <Trash2 size={22} color="#ef4444" />
              </Pressable>
              <Pressable onPress={() => setSelectedPhoto(null)} hitSlop={12}>
                <X size={24} color="#fff" />
              </Pressable>
            </View>
          </View>
          {selectedPhoto && (
            <Image
              source={{ uri: getPhotoUrl(selectedPhoto.storagePath) }}
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
