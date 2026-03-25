import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { Plus, DollarSign } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PendingSyncBadge } from "@/components/ui/PendingSyncBadge";
import { useAddJobLineItem } from "@/hooks/useJobs";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSignalColors } from "@/hooks/useSignalColors";
import { formatCurrency } from "@/lib/format";
import type { JobWithRelations } from "@/types/models";

interface WorkLineItemSectionProps {
  job: JobWithRelations;
}

const LINE_ITEM_TYPES: { key: string; label: string }[] = [
  { key: "service", label: "Service" },
  { key: "material", label: "Material" },
  { key: "labor", label: "Labor" },
  { key: "other", label: "Other" },
];

export function WorkLineItemSection({ job }: WorkLineItemSectionProps) {
  const colors = useSignalColors();
  const addLineItem = useAddJobLineItem();
  const { isOffline } = useNetworkStatus();
  const [showLineItemInput, setShowLineItemInput] = useState(false);
  const [lineItemDesc, setLineItemDesc] = useState("");
  const [lineItemQty, setLineItemQty] = useState("1");
  const [lineItemPrice, setLineItemPrice] = useState("");
  const [lineItemType, setLineItemType] = useState("labor");

  const lineItemTotal = job.lineItems.reduce(
    (sum, li) => sum + parseFloat(li.total),
    0
  );
  const pendingLineItems = job.lineItems.filter((li) => li.id.startsWith("temp_")).length;

  const resetForm = () => {
    setShowLineItemInput(false);
    setLineItemDesc("");
    setLineItemQty("1");
    setLineItemPrice("");
    setLineItemType("labor");
  };

  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide">
            Line Items
          </Text>
          {pendingLineItems > 0 && (
            <PendingSyncBadge count={pendingLineItems} />
          )}
        </View>
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1">
            <DollarSign size={14} color="#78716C" />
            <Text className="text-sm font-semibold text-stone-900 dark:text-white">
              {formatCurrency(lineItemTotal)}
            </Text>
          </View>
          <Pressable
            onPress={() => setShowLineItemInput(!showLineItemInput)}
            className="flex-row items-center gap-1"
          >
            <Plus size={14} color={colors.accent} />
            <Text className="text-sm font-medium text-orange-600 dark:text-orange-400">Add</Text>
          </Pressable>
        </View>
      </View>

      {showLineItemInput && (
        <View className="mb-3 gap-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <TextInput
            value={lineItemDesc}
            onChangeText={setLineItemDesc}
            placeholder="Description"
            placeholderTextColor="#A8A29E"
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-base text-stone-900 dark:text-white"
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-xs text-stone-400 mb-0.5">Qty</Text>
              <TextInput
                value={lineItemQty}
                onChangeText={setLineItemQty}
                placeholder="1"
                placeholderTextColor="#A8A29E"
                keyboardType="decimal-pad"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-base text-stone-900 dark:text-white"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-stone-400 mb-0.5">Unit Price</Text>
              <TextInput
                value={lineItemPrice}
                onChangeText={setLineItemPrice}
                placeholder="0.00"
                placeholderTextColor="#A8A29E"
                keyboardType="decimal-pad"
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-base text-stone-900 dark:text-white"
              />
            </View>
          </View>
          <View className="flex-row gap-1.5 flex-wrap">
            {LINE_ITEM_TYPES.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setLineItemType(t.key)}
                className={`px-3 min-h-[44px] items-center justify-center rounded-full ${
                  lineItemType === t.key
                    ? "bg-orange-600"
                    : "bg-stone-200 dark:bg-stone-700"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    lineItemType === t.key
                      ? "text-white"
                      : "text-stone-600 dark:text-stone-400"
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row justify-end gap-2">
            <Button
              title="Cancel"
              variant="ghost"
              size="sm"
              onPress={resetForm}
            />
            <Button
              title="Save"
              size="sm"
              onPress={async () => {
                if (!lineItemDesc.trim() || !lineItemPrice) return;
                try {
                  await addLineItem.mutateAsync({
                    id: job.id,
                    item: {
                      description: lineItemDesc.trim(),
                      quantity: parseFloat(lineItemQty) || 1,
                      unitPrice: parseFloat(lineItemPrice) || 0,
                      type: lineItemType as "service" | "material" | "labor" | "other",
                    },
                  });
                  Toast.show({
                    type: "success",
                    text1: isOffline ? "Line item saved" : "Line item added",
                    text2: isOffline ? "Will sync when online" : undefined,
                  });
                  resetForm();
                } catch {
                  Toast.show({ type: "error", text1: "Failed to add line item" });
                }
              }}
              loading={addLineItem.isPending}
              disabled={!lineItemDesc.trim() || !lineItemPrice}
              icon={<Plus size={14} color="#fff" />}
            />
          </View>
        </View>
      )}

      {job.lineItems.length > 0 ? (
        job.lineItems.map((item) => (
          <View
            key={item.id}
            className="flex-row items-center justify-between py-2 border-b border-stone-100 dark:border-stone-700"
          >
            <View className="flex-1 mr-3">
              <Text className="text-base text-stone-900 dark:text-white" numberOfLines={1}>
                {item.description}
              </Text>
              <Text className="text-xs text-stone-500">
                {item.quantity} x {formatCurrency(item.unitPrice)}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-medium text-stone-900 dark:text-white">
                {formatCurrency(item.total)}
              </Text>
              {item.id.startsWith("temp_") && (
                <PendingSyncBadge count={1} compact />
              )}
            </View>
          </View>
        ))
      ) : (
        <Text className="text-base text-stone-400 italic">No line items yet</Text>
      )}
    </Card>
  );
}
