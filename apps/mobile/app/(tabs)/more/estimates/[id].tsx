import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { CheckCircle2, DollarSign, Briefcase } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useEstimate, useConvertEstimateToJob } from "@/hooks/useEstimates";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ESTIMATE_STATUS_COLORS } from "@/lib/colors";
import { ESTIMATE_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate, formatCustomerName, formatAddress } from "@/lib/format";
import type { EstimateStatus, EstimateOption } from "@/types/models";
import { useState, useCallback } from "react";

export default function EstimateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, refetch } = useEstimate(id);
  const convertToJob = useConvertEstimateToJob();
  const [refreshing, setRefreshing] = useState(false);

  const estimate = data?.data;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading || !estimate) {
    return <LoadingScreen />;
  }

  const colors = ESTIMATE_STATUS_COLORS[estimate.status as EstimateStatus];
  const canConvert = estimate.status === "approved" && !estimate.jobId;

  const handleConvertToJob = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const result = await convertToJob.mutateAsync(id);
      Toast.show({ type: "success", text1: "Job created from estimate" });
      if (result.data?.jobId) {
        router.push(`/(tabs)/jobs/${result.data.jobId}`);
      }
    } catch {
      Toast.show({ type: "error", text1: "Failed to convert estimate" });
    }
  };

  return (
    <View className="flex-1 bg-orange-50/50 dark:bg-stone-900">
      <ScrollView
        contentContainerClassName="pb-32"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              {estimate.estimateNumber}
            </Text>
            <Badge
              label={ESTIMATE_STATUS_LABELS[estimate.status as EstimateStatus]}
              bgClass={colors.bg}
              textClass={colors.text}
            />
          </View>
          <Text className="text-xl font-bold text-stone-900 dark:text-stone-50 mb-1">
            {estimate.summary}
          </Text>
          <Text className="text-sm text-stone-500">
            Created {formatDate(estimate.createdAt)}
          </Text>
        </View>

        {/* Customer */}
        <View className="px-4 mb-3">
          <Card>
            <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
              Customer
            </Text>
            <Text className="text-base font-medium text-stone-900 dark:text-stone-50">
              {formatCustomerName(estimate.customer)}
            </Text>
            <Text className="text-sm text-stone-500 mt-1">
              {formatAddress(estimate.property)}
            </Text>
          </Card>
        </View>

        {/* Options */}
        {estimate.options.map((option) => (
          <View key={option.id} className="px-4 mb-3">
            <OptionCard
              option={option}
              isApproved={estimate.approvedOptionId === option.id}
            />
          </View>
        ))}

        {/* Notes */}
        {estimate.notes && (
          <View className="px-4 mb-3">
            <Card>
              <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                Notes
              </Text>
              <Text className="text-sm text-stone-700 dark:text-stone-300">
                {estimate.notes}
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Convert to Job button */}
      {canConvert && (
        <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 px-4 pt-3 pb-8">
          <Button
            title="Convert to Job"
            onPress={handleConvertToJob}
            loading={convertToJob.isPending}
            size="lg"
            icon={<Briefcase size={18} color="#ffffff" />}
          />
        </View>
      )}
    </View>
  );
}

function OptionCard({
  option,
  isApproved,
}: {
  option: EstimateOption;
  isApproved: boolean;
}) {
  return (
    <Card
      className={isApproved ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : ""}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-stone-900 dark:text-stone-50">
            {option.name}
          </Text>
          {option.isRecommended && (
            <Badge label="Recommended" bgClass="bg-blue-100" textClass="text-blue-700" />
          )}
          {isApproved && (
            <View className="flex-row items-center gap-1 bg-emerald-100 rounded-full px-2 py-0.5">
              <CheckCircle2 size={12} color="#10b981" />
              <Text className="text-xs font-medium text-emerald-700">Approved</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-1">
          <DollarSign size={16} color="#0f172a" />
          <Text className="text-lg font-bold text-stone-900 dark:text-stone-50">
            {formatCurrency(option.total)}
          </Text>
        </View>
      </View>

      {option.description && (
        <Text className="text-sm text-stone-500 mb-3">{option.description}</Text>
      )}

      {option.items.map((item) => (
        <View
          key={item.id}
          className="flex-row items-center justify-between py-1.5 border-b border-stone-100 dark:border-stone-700 last:border-0"
        >
          <View className="flex-1 mr-3">
            <Text className="text-sm text-stone-700 dark:text-stone-300" numberOfLines={1}>
              {item.description}
            </Text>
            <Text className="text-xs text-stone-400">
              {item.quantity} x {formatCurrency(item.unitPrice)}
            </Text>
          </View>
          <Text className="text-sm font-medium text-stone-900 dark:text-stone-50">
            {formatCurrency(item.total)}
          </Text>
        </View>
      ))}
    </Card>
  );
}
