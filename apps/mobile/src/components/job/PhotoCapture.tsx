import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ActionSheetIOS, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Camera } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { useUploadPhoto } from "@/hooks/usePhotos";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import type { PhotoType } from "@/types/models";

const PHOTO_TYPE_OPTIONS: { value: PhotoType; label: string }[] = [
  { value: "before", label: "Before" },
  { value: "after", label: "After" },
  { value: "general", label: "General" },
];

interface PhotoCaptureProps {
  jobId: string;
}

export function PhotoCapture({ jobId }: PhotoCaptureProps) {
  const uploadPhoto = useUploadPhoto();
  const { isOffline } = useNetworkStatus();
  const [caption, setCaption] = useState("");
  const [photoType, setPhotoType] = useState<PhotoType>("general");
  const [showCaption, setShowCaption] = useState(false);
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState("image/jpeg");

  const pickImage = async (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      exif: false,
    };

    let result: ImagePicker.ImagePickerResult;

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required to take photos.");
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library permission is required.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedUri(asset.uri);
      setSelectedMimeType(asset.mimeType || "image/jpeg");
      setShowCaption(true);
    }
  };

  const showActionSheet = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickImage(true);
          if (buttonIndex === 2) pickImage(false);
        }
      );
    } else {
      Alert.alert("Add Photo", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => pickImage(true) },
        { text: "Choose from Library", onPress: () => pickImage(false) },
      ]);
    }
  };

  const handleUpload = async () => {
    if (!selectedUri) return;
    try {
      await uploadPhoto.mutateAsync({
        jobId,
        fileUri: selectedUri,
        mimeType: selectedMimeType,
        caption: caption.trim() || undefined,
        photoType,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: isOffline ? "Photo saved" : "Photo uploaded",
        text2: isOffline ? "Will upload when online" : undefined,
      });
      setSelectedUri(null);
      setCaption("");
      setPhotoType("general");
      setShowCaption(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload photo";
      Toast.show({ type: "error", text1: msg });
    }
  };

  if (showCaption && selectedUri) {
    return (
      <View className="gap-2">
        {/* Photo type selector */}
        <View className="flex-row gap-2">
          {PHOTO_TYPE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setPhotoType(opt.value)}
              className={`flex-1 items-center rounded-lg border py-3.5 ${
                photoType === opt.value
                  ? "bg-blue-500 border-blue-500"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  photoType === opt.value
                    ? "text-white"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Add a caption (optional)"
          placeholderTextColor="#94a3b8"
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 text-base text-slate-900 dark:text-white"
        />
        <View className="flex-row gap-2">
          <Button
            title="Cancel"
            variant="ghost"
            size="sm"
            onPress={() => {
              setSelectedUri(null);
              setShowCaption(false);
              setCaption("");
              setPhotoType("general");
            }}
          />
          <Button
            title={isOffline ? "Save" : "Upload"}
            size="sm"
            onPress={handleUpload}
            loading={uploadPhoto.isPending}
            icon={<Camera size={14} color="#fff" />}
          />
        </View>
      </View>
    );
  }

  return (
    <Button
      title="Add Photo"
      variant="outline"
      size="sm"
      onPress={showActionSheet}
      icon={<Camera size={14} color="#3b82f6" />}
    />
  );
}
