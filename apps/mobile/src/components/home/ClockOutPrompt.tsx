import { useState } from "react";
import { View, Text, TextInput, Pressable, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { Package, Wrench, MessageSquare, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dailyReportsApi, type DailyReportInput } from "@/api/endpoints/daily-reports";
import Toast from "react-native-toast-message";
import { useSignalColors } from "@/hooks/useSignalColors";

interface ClockOutPromptProps {
  visible: boolean;
  onSkip: () => void;
  onSubmitted: () => void;
}

export function ClockOutPrompt({ visible, onSkip, onSubmitted }: ClockOutPromptProps) {
  const colors = useSignalColors();
  const [materialRequests, setMaterialRequests] = useState("");
  const [equipmentIssues, setEquipmentIssues] = useState("");
  const [officeNotes, setOfficeNotes] = useState("");

  const submit = useMutation({
    mutationFn: (input: DailyReportInput) => dailyReportsApi.create(input),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: "success", text1: "Report submitted" });
      resetForm();
      onSubmitted();
    },
    onError: () => {
      Toast.show({ type: "error", text1: "Failed to submit report" });
    },
  });

  const resetForm = () => {
    setMaterialRequests("");
    setEquipmentIssues("");
    setOfficeNotes("");
  };

  const handleSkip = () => {
    resetForm();
    onSkip();
  };

  const handleSubmit = () => {
    const hasContent = materialRequests.trim() || equipmentIssues.trim() || officeNotes.trim();
    if (!hasContent) {
      handleSkip();
      return;
    }
    submit.mutate({
      materialRequests: materialRequests.trim() || undefined,
      equipmentIssues: equipmentIssues.trim() || undefined,
      officeNotes: officeNotes.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <View className="flex-1 bg-black/50" />
        <View className="bg-white dark:bg-stone-800 rounded-t-3xl px-5 pt-6 pb-10">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-xl font-heading-bold text-stone-900 dark:text-white">
              End of Day Report
            </Text>
            <Pressable onPress={handleSkip} className="p-2" accessibilityLabel="Close">
              <X size={24} color="#A8A29E" />
            </Pressable>
          </View>

          <Text className="text-sm text-stone-500 dark:text-stone-400 mb-5">
            Anything the office needs to know for tomorrow?
          </Text>

          {/* Material Requests */}
          <View className="mb-4">
            <View className="flex-row items-center gap-2 mb-1.5">
              <Package size={16} color="#f59e0b" />
              <Text className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Materials needed for tomorrow?
              </Text>
            </View>
            <TextInput
              value={materialRequests}
              onChangeText={setMaterialRequests}
              placeholder="e.g., 2 bags of base course, 50 pavers..."
              placeholderTextColor="#A8A29E"
              multiline
              className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-base text-stone-900 dark:text-white min-h-[60px]"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* Equipment Issues */}
          <View className="mb-4">
            <View className="flex-row items-center gap-2 mb-1.5">
              <Wrench size={16} color="#ef4444" />
              <Text className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Equipment issues?
              </Text>
            </View>
            <TextInput
              value={equipmentIssues}
              onChangeText={setEquipmentIssues}
              placeholder="e.g., Compactor running rough, need oil change..."
              placeholderTextColor="#A8A29E"
              multiline
              className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-base text-stone-900 dark:text-white min-h-[60px]"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* Office Notes */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-1.5">
              <MessageSquare size={16} color={colors.accent} />
              <Text className="text-sm font-medium text-stone-700 dark:text-stone-300">
                Notes for office?
              </Text>
            </View>
            <TextInput
              value={officeNotes}
              onChangeText={setOfficeNotes}
              placeholder="e.g., Customer asked about adding sprinklers..."
              placeholderTextColor="#A8A29E"
              multiline
              className="bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-3 text-base text-stone-900 dark:text-white min-h-[60px]"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* Buttons */}
          <View className="gap-3">
            <Pressable
              onPress={handleSubmit}
              disabled={submit.isPending}
              className="bg-orange-600 rounded-2xl py-4 items-center active:bg-orange-700"
              style={{ minHeight: 56 }}
            >
              <Text className="text-lg font-bold text-white">
                {submit.isPending ? "Submitting..." : "Submit & Clock Out"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSkip}
              className="rounded-2xl py-4 items-center active:bg-stone-100"
              style={{ minHeight: 56 }}
            >
              <Text className="text-base font-medium text-stone-500">
                Skip & Clock Out
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
