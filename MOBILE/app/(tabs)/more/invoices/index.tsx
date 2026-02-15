import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useInvoices } from "@/hooks/useInvoices";
import { SearchBar } from "@/components/common/SearchBar";
import { FilterChips } from "@/components/common/FilterChips";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { QueryErrorState } from "@/components/common/QueryErrorState";
import { AnimatedListItem } from "@/components/ui/AnimatedListItem";
import { formatCurrency, formatDate, formatCustomerName } from "@/lib/format";
import type { InvoiceStatus, InvoiceListItem } from "@/types/models";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
];

export default function InvoiceListScreen() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useInvoices({
    search: search || undefined,
    status: filter === "all" ? undefined : filter,
    pageSize: 50,
  });

  const invoices = data?.data ?? [];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem = ({ item, index }: { item: InvoiceListItem; index: number }) => {
    const customerName = formatCustomerName({
      firstName: item.customerFirstName,
      lastName: item.customerLastName,
    });
    const balanceDue = parseFloat(item.balanceDue);
    const total = parseFloat(item.total);
    const hasPartialPayment = balanceDue > 0 && balanceDue < total;

    return (
      <AnimatedListItem index={index}>
      <Pressable
        onPress={() => router.push(`/(tabs)/more/invoices/${item.id}`)}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-2 active:scale-[0.98]"
      >
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {item.invoiceNumber}
          </Text>
          <InvoiceStatusBadge status={item.status as InvoiceStatus} />
        </View>
        <Text className="text-base font-medium text-slate-900 dark:text-white mb-1" numberOfLines={1}>
          {customerName}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-slate-500">
            Due {formatDate(item.dueDate)}
          </Text>
          <View className="items-end">
            <Text className="text-sm font-semibold text-slate-900 dark:text-white">
              {formatCurrency(item.total)}
            </Text>
            {hasPartialPayment && (
              <Text className="text-xs text-amber-600">
                Balance: {formatCurrency(item.balanceDue)}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
      </AnimatedListItem>
    );
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="px-4 pt-3 pb-2 gap-3">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search invoices..." />
        <FilterChips chips={FILTERS} activeKey={filter} onSelect={setFilter} />
      </View>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          isLoading ? (
            <View className="gap-2">
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-16" />
                </View>
              ))}
            </View>
          ) : isError ? (
            <QueryErrorState onRetry={() => refetch()} />
          ) : (
            <EmptyState
              title="No invoices"
              description="Invoices created from the office will appear here"
            />
          )
        }
      />
    </View>
  );
}
