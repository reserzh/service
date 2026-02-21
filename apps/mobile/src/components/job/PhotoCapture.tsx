import { useState } from "react";
import { View, Text, TextInput, Alert, ActionSheetIOS, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Camera, Image as ImageIcon } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { useUploadPhoto } from "@/hooks/usePhotos";

interface PhotoCaptureProps {
  jobId: string;
}

export function PhotoCapture({ jobId }: PhotoCaptureProps) {
  const uploadPhoto = useUploadPhoto();
  const [caption, setCaption] = useState("");
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
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: "success", text1: "Photo uploaded" });
      setSelectedUri(null);
      setCaption("");
      setShowCaption(false);
    } catch {
      Toast.show({ type: "error", text1: "Failed to upload photo" });
    }
  };

  if (showCaption && selectedUri) {
    return (
      <View className="gap-2">
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Add a caption (optional)"
          placeholderTextColor="#94a3b8"
          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white"
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
            }}
          />
          <Button
            title="Upload"
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
