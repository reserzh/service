import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Calendar, CreditCard, FileText, Briefcase } from "lucide-react-native";
import { useInvoice } from "@/hooks/useInvoices";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { JobStatusBadge } from "@/components/job/JobStatusBadge";
import { Card } from "@/components/ui/Card";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { formatCurrency, formatDate, formatCustomerName, formatAddress } from "@/lib/format";
import type { InvoiceStatus, JobStatus, EstimateStatus, Payment } from "@/types/models";

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useInvoice(id);
  const invoice = data?.data;

  if (isLoading || !invoice) {
    return <LoadingScreen />;
  }

  const balanceDue = parseFloat(invoice.balanceDue);

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="pb-8">
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {invoice.invoiceNumber}
          </Text>
          <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
        </View>
        <View className="flex-row items-center gap-2 mt-1">
          <Calendar size={14} color="#64748b" />
          <Text className="text-sm text-slate-500">
            Due {formatDate(invoice.dueDate)}
          </Text>
        </View>
      </View>

      {/* Totals */}
      <View className="px-4 mb-3">
        <Card>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Summary
          </Text>
          <TotalRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
          <TotalRow
            label={`Tax (${parseFloat(invoice.taxRate).toFixed(1)}%)`}
            value={formatCurrency(invoice.taxAmount)}
          />
          <View className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
            <TotalRow label="Total" value={formatCurrency(invoice.total)} bold />
          </View>
          <TotalRow label="Amount Paid" value={formatCurrency(invoice.amountPaid)} color="text-emerald-600" />
          {balanceDue > 0 && (
            <View className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
              <TotalRow label="Balance Due" value={formatCurrency(invoice.balanceDue)} bold color="text-red-600" />
            </View>
          )}
        </Card>
      </View>

      {/* Customer */}
      <View className="px-4 mb-3">
        <Card onPress={() => router.push(`/(tabs)/more/customers/${invoice.customerId}`)}>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Customer
          </Text>
          <Text className="text-base font-medium text-slate-900 dark:text-white">
            {formatCustomerName(invoice.customer)}
          </Text>
        </Card>
      </View>

      {/* Line items */}
      {invoice.lineItems.length > 0 && (
        <View className="px-4 mb-3">
          <Card>
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Line Items
            </Text>
            {invoice.lineItems.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
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
        </View>
      )}

      {/* Linked job */}
      {invoice.linkedJob && (
        <View className="px-4 mb-3">
          <Card onPress={() => router.push(`/(tabs)/jobs/${invoice.linkedJob!.id}`)}>
            <View className="flex-row items-center gap-2 mb-2">
              <Briefcase size={14} color="#64748b" />
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Linked Job
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-medium text-slate-900 dark:text-white">
                  {invoice.linkedJob.jobNumber}
                </Text>
                <Text className="text-xs text-slate-500" numberOfLines={1}>
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
              <FileText size={14} color="#64748b" />
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Linked Estimate
              </Text>
            </View>
            <Text className="text-sm font-medium text-slate-900 dark:text-white">
              {invoice.linkedEstimate.estimateNumber}
            </Text>
            <Text className="text-xs text-slate-500" numberOfLines={1}>
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
              <CreditCard size={14} color="#64748b" />
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
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
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Notes
            </Text>
            <Text className="text-sm text-slate-700 dark:text-slate-300">
              {invoice.notes}
            </Text>
          </Card>
        </View>
      )}
    </ScrollView>
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
        className={`text-sm ${bold ? "font-semibold text-slate-900 dark:text-white" : "text-slate-500"}`}
      >
        {label}
      </Text>
      <Text
        className={`text-sm ${bold ? "font-bold" : "font-medium"} ${
          color ?? "text-slate-900 dark:text-white"
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
    <View className="flex-row items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <View>
        <Text className="text-sm font-medium text-slate-900 dark:text-white">
          {formatCurrency(payment.amount)}
        </Text>
        <Text className="text-xs text-slate-500">
          {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
          {payment.referenceNumber ? ` · ${payment.referenceNumber}` : ""}
        </Text>
      </View>
      <Text className="text-xs text-slate-400">
        {formatDate(payment.processedAt)}
      </Text>
    </View>
  );
}
