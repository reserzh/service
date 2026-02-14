import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CheckCircle2, DollarSign } from "lucide-react-native";
import { useEstimate } from "@/hooks/useEstimates";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ESTIMATE_STATUS_COLORS } from "@/lib/colors";
import { ESTIMATE_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate, formatCustomerName, formatAddress } from "@/lib/format";
import type { EstimateStatus, EstimateOption } from "@/types/models";

export default function EstimateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useEstimate(id);
  const estimate = data?.data;

  if (isLoading || !estimate) {
    return <LoadingScreen />;
  }

  const colors = ESTIMATE_STATUS_COLORS[estimate.status as EstimateStatus];

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="pb-8">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {estimate.estimateNumber}
          </Text>
          <Badge
            label={ESTIMATE_STATUS_LABELS[estimate.status as EstimateStatus]}
            bgClass={colors.bg}
            textClass={colors.text}
          />
        </View>
        <Text className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {estimate.summary}
        </Text>
        <Text className="text-sm text-slate-500">
          Created {formatDate(estimate.createdAt)}
        </Text>
      </View>

      {/* Customer */}
      <View className="px-4 mb-3">
        <Card>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Customer
          </Text>
          <Text className="text-base font-medium text-slate-900 dark:text-white">
            {formatCustomerName(estimate.customer)}
          </Text>
          <Text className="text-sm text-slate-500 mt-1">
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
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Notes
            </Text>
            <Text className="text-sm text-slate-700 dark:text-slate-300">
              {estimate.notes}
            </Text>
          </Card>
        </View>
      )}
    </ScrollView>
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
          <Text className="text-base font-semibold text-slate-900 dark:text-white">
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
          <Text className="text-lg font-bold text-slate-900 dark:text-white">
            {formatCurrency(option.total)}
          </Text>
        </View>
      </View>

      {option.description && (
        <Text className="text-sm text-slate-500 mb-3">{option.description}</Text>
      )}

      {/* Line items */}
      {option.items.map((item) => (
        <View
          key={item.id}
          className="flex-row items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
        >
          <View className="flex-1 mr-3">
            <Text className="text-sm text-slate-700 dark:text-slate-300" numberOfLines={1}>
              {item.description}
            </Text>
            <Text className="text-xs text-slate-400">
              {item.quantity} x {formatCurrency(item.unitPrice)}
            </Text>
          </View>
          <Text className="text-sm font-medium text-slate-900 dark:text-white">
            {formatCurrency(item.total)}
          </Text>
        </View>
      ))}
    </Card>
  );
}
