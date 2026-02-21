import { View, Text, TextInput, Pressable } from "react-native";
import { useCallback } from "react";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { CreditCard } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";
import type { PaymentMethod } from "@/types/models";

const paymentSchema = z.object({
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
  method: z.enum(["credit_card", "debit_card", "ach", "cash", "check", "other"]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const PAYMENT_METHODS: { key: PaymentMethod; label: string }[] = [
  { key: "credit_card", label: "Credit Card" },
  { key: "debit_card", label: "Debit Card" },
  { key: "cash", label: "Cash" },
  { key: "check", label: "Check" },
  { key: "ach", label: "ACH" },
  { key: "other", label: "Other" },
];

interface RecordPaymentSheetProps {
  balanceDue: string;
  sheetRef: React.RefObject<BottomSheet | null>;
  onSubmit: (data: {
    amount: number;
    method: PaymentMethod;
    referenceNumber?: string;
    notes?: string;
  }) => Promise<void>;
}

export function RecordPaymentSheet({ balanceDue, sheetRef, onSubmit }: RecordPaymentSheetProps) {
  const { control, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<PaymentFormData>({
    defaultValues: {
      amount: balanceDue,
      method: "credit_card",
      referenceNumber: "",
      notes: "",
    },
  });

  const selectedMethod = watch("method");

  const onFormSubmit = useCallback(
    async (data: PaymentFormData) => {
      try {
        await onSubmit({
          amount: parseFloat(data.amount),
          method: data.method,
          referenceNumber: data.referenceNumber || undefined,
          notes: data.notes || undefined,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: "success", text1: "Payment recorded" });
        sheetRef.current?.close();
      } catch {
        Toast.show({ type: "error", text1: "Failed to record payment" });
      }
    },
    [onSubmit, sheetRef]
  );

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={["70%"]}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: "#cbd5e1" }}
    >
      <BottomSheetScrollView className="px-4 pb-6" keyboardShouldPersistTaps="handled">
        <Text className="text-lg font-bold text-slate-900 mb-1">
          Record Payment
        </Text>
        <Text className="text-sm text-slate-500 mb-4">
          Balance due: {formatCurrency(balanceDue)}
        </Text>

        {/* Amount */}
        <View className="mb-4">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Amount
          </Text>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                keyboardType="decimal-pad"
                className="border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 bg-slate-50"
              />
            )}
          />
          {errors.amount && (
            <Text className="text-xs text-red-500 mt-1">{errors.amount.message}</Text>
          )}
        </View>

        {/* Payment Method */}
        <View className="mb-4">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Payment Method
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  setValue("method", m.key);
                }}
                className={`px-3 py-2 rounded-lg border ${
                  selectedMethod === m.key
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedMethod === m.key ? "text-blue-700" : "text-slate-600"
                  }`}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Reference Number */}
        <View className="mb-4">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Reference Number
          </Text>
          <Controller
            control={control}
            name="referenceNumber"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Optional"
                placeholderTextColor="#94a3b8"
                className="border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 bg-slate-50"
              />
            )}
          />
        </View>

        {/* Notes */}
        <View className="mb-6">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Notes
          </Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Optional notes"
                placeholderTextColor="#94a3b8"
                multiline
                className="border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 bg-slate-50 min-h-[60px]"
                textAlignVertical="top"
              />
            )}
          />
        </View>

        <Button
          title="Record Payment"
          onPress={handleSubmit(onFormSubmit)}
          loading={isSubmitting}
          size="lg"
          icon={<CreditCard size={18} color="#ffffff" />}
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
