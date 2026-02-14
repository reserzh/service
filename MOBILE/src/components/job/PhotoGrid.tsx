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

  return (
    <>
      <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
        {photos.map((photo) => (
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
          </Pressable>
        ))}
      </View>

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
