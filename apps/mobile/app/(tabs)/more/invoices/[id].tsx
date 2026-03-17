import { useRef } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Calendar, CreditCard, FileText, Briefcase, Send, Ban } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import BottomSheet from "@gorhom/bottom-sheet";
import { useInvoice, useSendInvoice, useVoidInvoice, useRecordPayment } from "@/hooks/useInvoices";
import { RecordPaymentSheet } from "@/components/invoice/RecordPaymentSheet";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { JobStatusBadge } from "@/components/job/JobStatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { formatCurrency, formatDate, formatCustomerName } from "@/lib/format";
import type { InvoiceStatus, JobStatus, Payment, PaymentMethod } from "@/types/models";
import { useState, useCallback } from "react";

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, refetch } = useInvoice(id);
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const recordPayment = useRecordPayment();
  const paymentSheetRef = useRef<BottomSheet>(null);
  const [refreshing, setRefreshing] = useState(false);

  const invoice = data?.data;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading || !invoice) {
    return <LoadingScreen />;
  }

  const balanceDue = parseFloat(invoice.balanceDue);
  const canSend = invoice.status === "draft";
  const canRecordPayment = balanceDue > 0 && invoice.status !== "void";
  const canVoid = invoice.status !== "void" && invoice.status !== "paid";

  const handleSend = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await sendInvoice.mutateAsync(id);
      Toast.show({ type: "success", text1: "Invoice sent" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to send invoice" });
    }
  };

  const handleVoid = async () => {
    try {
      await voidInvoice.mutateAsync(id);
      Toast.show({ type: "success", text1: "Invoice voided" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to void invoice" });
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
              {invoice.invoiceNumber}
            </Text>
            <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
          </View>
          <View className="flex-row items-center gap-2 mt-1">
            <Calendar size={14} color="#78716C" />
            <Text className="text-sm text-stone-500">
              Due {formatDate(invoice.dueDate)}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View className="px-4 mb-3">
          <Card>
            <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
              Summary
            </Text>
            <TotalRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
            <TotalRow
              label={`Tax (${parseFloat(invoice.taxRate).toFixed(1)}%)`}
              value={formatCurrency(invoice.taxAmount)}
            />
            <View className="border-t border-stone-200 dark:border-stone-700 mt-2 pt-2">
              <TotalRow label="Total" value={formatCurrency(invoice.total)} bold />
            </View>
            <TotalRow label="Amount Paid" value={formatCurrency(invoice.amountPaid)} color="text-emerald-600" />
            {balanceDue > 0 && (
              <View className="border-t border-stone-200 dark:border-stone-700 mt-2 pt-2">
                <TotalRow label="Balance Due" value={formatCurrency(invoice.balanceDue)} bold color="text-red-600" />
              </View>
            )}
          </Card>
        </View>

        {/* Customer */}
        <View className="px-4 mb-3">
          <Card onPress={() => router.push(`/(tabs)/more/customers/${invoice.customerId}`)}>
            <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
              Customer
            </Text>
            <Text className="text-base font-medium text-stone-900 dark:text-stone-50">
              {formatCustomerName(invoice.customer)}
            </Text>
          </Card>
        </View>

        {/* Line items */}
        {invoice.lineItems.length > 0 && (
          <View className="px-4 mb-3">
            <Card>
              <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
                Line Items
              </Text>
              {invoice.lineItems.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between py-2 border-b border-stone-100 dark:border-stone-700 last:border-0"
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
          </View>
        )}

        {/* Linked job */}
        {invoice.linkedJob && (
          <View className="px-4 mb-3">
            <Card onPress={() => router.push(`/(tabs)/jobs/${invoice.linkedJob!.id}`)}>
              <View className="flex-row items-center gap-2 mb-2">
                <Briefcase size={14} color="#78716C" />
                <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Linked Job
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {invoice.linkedJob.jobNumber}
                  </Text>
                  <Text className="text-xs text-stone-500" numberOfLines={1}>
                    {invoice.linkedJob.summary}
                  </Text>
                </View>
                <JobStatusBadge status={invoice.linkedJob.status as JobStatus} />
              </View>
            </Card>
          </View>
        )}

        {/* Linked estimate */}
        {invoice.linkedEstimate && (
          <View className="px-4 mb-3">
            <Card onPress={() => router.push(`/(tabs)/more/estimates/${invoice.linkedEstimate!.id}`)}>
              <View className="flex-row items-center gap-2 mb-2">
                <FileText size={14} color="#78716C" />
                <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Linked Estimate
                </Text>
              </View>
              <Text className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {invoice.linkedEstimate.estimateNumber}
              </Text>
              <Text className="text-xs text-stone-500" numberOfLines={1}>
                {invoice.linkedEstimate.summary}
              </Text>
            </Card>
          </View>
        )}

        {/* Payments */}
        {invoice.payments.length > 0 && (
          <View className="px-4 mb-3">
            <Card>
              <View className="flex-row items-center gap-2 mb-3">
                <CreditCard size={14} color="#78716C" />
                <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                  Payments
                </Text>
              </View>
              {invoice.payments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} />
              ))}
            </Card>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View className="px-4 mb-3">
            <Card>
              <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                Notes
              </Text>
              <Text className="text-sm text-stone-700 dark:text-stone-300">
                {invoice.notes}
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      {(canSend || canRecordPayment || canVoid) && (
        <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 px-4 pt-3 pb-8">
          <View className="flex-row gap-3">
            {canSend && (
              <Button
                title="Send Invoice"
                onPress={handleSend}
                loading={sendInvoice.isPending}
                icon={<Send size={16} color="#ffffff" />}
                className="flex-1"
              />
            )}
            {canRecordPayment && (
              <Button
                title="Record Payment"
                onPress={() => paymentSheetRef.current?.snapToIndex(0)}
                variant={canSend ? "outline" : "primary"}
                icon={<CreditCard size={16} color={canSend ? "#374151" : "#ffffff"} />}
                className="flex-1"
              />
            )}
            {canVoid && !canSend && (
              <Button
                title="Void"
                onPress={handleVoid}
                variant="danger"
                loading={voidInvoice.isPending}
                icon={<Ban size={16} color="#ffffff" />}
                size="sm"
              />
            )}
          </View>
        </View>
      )}

      {/* Record Payment Sheet */}
      {canRecordPayment && (
        <RecordPaymentSheet
          balanceDue={invoice.balanceDue}
          sheetRef={paymentSheetRef}
          onSubmit={async (data) => {
            await recordPayment.mutateAsync({ id, data });
            refetch();
          }}
        />
      )}
    </View>
  );
}

function TotalRow({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text
        className={`text-sm ${bold ? "font-semibold text-stone-900 dark:text-stone-50" : "text-stone-500"}`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${bold ? "font-bold" : "font-medium"} ${
          color ?? "text-stone-900 dark:text-stone-50"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  ach: "ACH",
  cash: "Cash",
  check: "Check",
  other: "Other",
};

function PaymentRow({ payment }: { payment: Payment }) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-stone-100 dark:border-stone-700 last:border-0">
      <View>
        <Text className="text-sm font-medium text-stone-900 dark:text-stone-50">
          {formatCurrency(payment.amount)}
        </Text>
        <Text className="text-xs text-stone-500">
          {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
          {payment.referenceNumber ? ` · ${payment.referenceNumber}` : ""}
        </Text>
      </View>
      <Text className="text-xs text-stone-400">
        {formatDate(payment.processedAt)}
      </Text>
    </View>
  );
}
