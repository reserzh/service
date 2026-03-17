import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useState, useMemo } from "react";
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { DollarSign } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import type { JobWithRelations } from "@/types/models";

interface CreateInvoiceSheetProps {
  job: JobWithRelations;
  sheetRef: React.RefObject<BottomSheet | null>;
  onSubmit: (data: { taxRate: number }) => Promise<void>;
}

export function CreateInvoiceSheet({ job, sheetRef, onSubmit }: CreateInvoiceSheetProps) {
  const [taxRate, setTaxRate] = useState("8.5");
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(
    () => job.lineItems.reduce((sum, li) => sum + parseFloat(li.total), 0),
    [job.lineItems]
  );

  const taxAmount = subtotal * ((parseFloat(taxRate) || 0) / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({ taxRate: parseFloat(taxRate) || 0 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: "success", text1: "Invoice created" });
      sheetRef.current?.close();
    } catch {
      Toast.show({ type: "error", text1: "Failed to create invoice" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["60%"]}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: "#cbd5e1" }}
    >
      <BottomSheetScrollView className="px-4 pb-6">
        <Text className="text-lg font-bold text-stone-900 mb-4">
          Create Invoice
        </Text>

        {/* Line items preview */}
        <View className="mb-4">
          <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
            Line Items from Job
          </Text>
          {job.lineItems.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between py-2 border-b border-stone-100"
            >
              <View className="flex-1 mr-3">
                <Text className="text-sm text-stone-900" numberOfLines={1}>
                  {item.description}
                </Text>
                <Text className="text-xs text-stone-500">
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <Text className="text-sm font-medium text-stone-900">
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Tax rate input */}
        <View className="mb-4">
          <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
            Tax Rate (%)
          </Text>
          <TextInput
            value={taxRate}
            onChangeText={setTaxRate}
            placeholder="0.00"
            placeholderTextColor="#A8A29E"
            keyboardType="decimal-pad"
            className="border border-stone-200 rounded-xl px-4 py-3 text-base text-stone-900 bg-stone-50"
          />
        </View>

        {/* Totals */}
        <View className="bg-stone-50 rounded-xl p-4 mb-6">
          <View className="flex-row justify-between py-1">
            <Text className="text-sm text-stone-500">Subtotal</Text>
            <Text className="text-sm font-medium text-stone-900">
              {formatCurrency(subtotal)}
            </Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-sm text-stone-500">
              Tax ({parseFloat(taxRate) || 0}%)
            </Text>
            <Text className="text-sm font-medium text-stone-900">
              {formatCurrency(taxAmount)}
            </Text>
          </View>
          <View className="flex-row justify-between py-1 mt-1 border-t border-stone-200 pt-2">
            <Text className="text-base font-semibold text-stone-900">Total</Text>
            <Text className="text-base font-bold text-stone-900">
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        <Button
          title="Create Invoice"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          icon={<DollarSign size={18} color="#ffffff" />}
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
