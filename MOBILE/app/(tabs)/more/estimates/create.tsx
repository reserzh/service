import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import {
  Search,
  Plus,
  Trash2,
  ChevronRight,
  Check,
  MapPin,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useCustomers, useCustomer } from "@/hooks/useCustomers";
import { useCreateEstimate } from "@/hooks/useEstimates";
import { StepIndicator } from "@/components/common/StepIndicator";
import { SearchBar } from "@/components/common/SearchBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { formatCustomerName, formatAddress } from "@/lib/format";
import type { LineItemType, Customer, Property } from "@/types/models";

const STEPS = ["Customer", "Property", "Options", "Details", "Review"];

const LINE_ITEM_TYPES: { key: LineItemType; label: string }[] = [
  { key: "service", label: "Service" },
  { key: "material", label: "Material" },
  { key: "labor", label: "Labor" },
  { key: "other", label: "Other" },
];

interface OptionItem {
  description: string;
  quantity: string;
  unitPrice: string;
  type: LineItemType;
}

interface EstimateOption {
  name: string;
  description: string;
  isRecommended: boolean;
  items: OptionItem[];
}

function makeEmptyItem(): OptionItem {
  return { description: "", quantity: "1", unitPrice: "", type: "service" };
}

function makeEmptyOption(): EstimateOption {
  return {
    name: "",
    description: "",
    isRecommended: false,
    items: [makeEmptyItem()],
  };
}

export default function CreateEstimateScreen() {
  const [step, setStep] = useState(1);

  // Step 1 - Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");

  // Step 2 - Property
  const [propertyId, setPropertyId] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");

  // Step 3 - Options
  const [options, setOptions] = useState<EstimateOption[]>([makeEmptyOption()]);

  // Step 4 - Details
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const createEstimate = useCreateEstimate();

  const canGoNext = (): boolean => {
    switch (step) {
      case 1:
        return !!customerId;
      case 2:
        return !!propertyId;
      case 3:
        return options.every(
          (opt) =>
            opt.name.trim() &&
            opt.items.length > 0 &&
            opt.items.every(
              (item) => item.description.trim() && parseFloat(item.unitPrice) > 0
            )
        );
      case 4:
        return !!summary.trim();
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.selectionAsync();
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    if (step === 1) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await createEstimate.mutateAsync({
        customerId,
        propertyId,
        summary: summary.trim(),
        notes: notes.trim() || undefined,
        validUntil: validUntil.trim() || undefined,
        options: options.map((opt) => ({
          name: opt.name.trim(),
          description: opt.description.trim() || undefined,
          isRecommended: opt.isRecommended,
          items: opt.items.map((item) => ({
            description: item.description.trim(),
            quantity: parseFloat(item.quantity) || 1,
            unitPrice: parseFloat(item.unitPrice) || 0,
            type: item.type,
          })),
        })),
      });
      Toast.show({ type: "success", text1: "Estimate created" });
      router.back();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create estimate";
      Toast.show({ type: "error", text1: "Error", text2: msg });
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <StepIndicator steps={STEPS} currentStep={step} />

      <View className="flex-1">
        {step === 1 && (
          <SelectCustomerStep
            search={customerSearch}
            onSearchChange={setCustomerSearch}
            onSelect={(c) => {
              setCustomerId(c.id);
              setCustomerName(formatCustomerName(c));
              // Reset property when customer changes
              setPropertyId("");
              setPropertyAddress("");
              handleNext();
            }}
          />
        )}
        {step === 2 && (
          <SelectPropertyStep
            customerId={customerId}
            onSelect={(p) => {
              setPropertyId(p.id);
              setPropertyAddress(formatAddress(p));
              handleNext();
            }}
          />
        )}
        {step === 3 && (
          <OptionsStep options={options} onChange={setOptions} />
        )}
        {step === 4 && (
          <DetailsStep
            summary={summary}
            onSummaryChange={setSummary}
            notes={notes}
            onNotesChange={setNotes}
            validUntil={validUntil}
            onValidUntilChange={setValidUntil}
          />
        )}
        {step === 5 && (
          <ReviewStep
            customerName={customerName}
            propertyAddress={propertyAddress}
            options={options}
            summary={summary}
            notes={notes}
            validUntil={validUntil}
          />
        )}
      </View>

      {/* Bottom bar */}
      <View className="flex-row gap-3 px-4 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <Button
          title={step === 1 ? "Cancel" : "Back"}
          onPress={handleBack}
          variant="outline"
          className="flex-1"
        />
        {step < 5 ? (
          <Button
            title="Next"
            onPress={handleNext}
            disabled={!canGoNext()}
            className="flex-1"
          />
        ) : (
          <Button
            title="Create Estimate"
            onPress={handleSubmit}
            loading={createEstimate.isPending}
            className="flex-1"
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ----- Step 1: Select Customer -----

function SelectCustomerStep({
  search,
  onSearchChange,
  onSelect,
}: {
  search: string;
  onSearchChange: (s: string) => void;
  onSelect: (customer: Customer) => void;
}) {
  const { data, isLoading } = useCustomers({ search: search || undefined, pageSize: 30 });
  const customers = data?.data ?? [];

  return (
    <View className="flex-1">
      <View className="px-4 pt-2 pb-3">
        <SearchBar value={search} onChangeText={onSearchChange} placeholder="Search customers..." />
      </View>
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-4"
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelect(item)}
            className="flex-row items-center justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-2 active:scale-[0.98]"
          >
            <View>
              <Text className="text-base font-medium text-slate-900 dark:text-white">
                {formatCustomerName(item)}
              </Text>
              {item.companyName && (
                <Text className="text-xs text-slate-500">{item.companyName}</Text>
              )}
              <Text className="text-xs text-slate-400 mt-0.5">{item.phone}</Text>
            </View>
            <ChevronRight size={18} color="#94a3b8" />
          </Pressable>
        )}
        ListEmptyComponent={
          isLoading ? (
            <LoadingScreen />
          ) : (
            <EmptyState
              title="No customers found"
              description={search ? "Try a different search term" : "No customers available"}
            />
          )
        }
      />
    </View>
  );
}

// ----- Step 2: Select Property -----

function SelectPropertyStep({
  customerId,
  onSelect,
}: {
  customerId: string;
  onSelect: (property: Property) => void;
}) {
  const { data, isLoading } = useCustomer(customerId);
  const properties = data?.data?.properties ?? [];

  if (isLoading) return <LoadingScreen />;

  if (properties.length === 0) {
    return (
      <EmptyState
        title="No properties"
        description="This customer has no properties on file"
      />
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pt-2 pb-4">
      {properties.map((property) => (
        <Pressable
          key={property.id}
          onPress={() => onSelect(property)}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-2 active:scale-[0.98]"
        >
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-2">
              <MapPin size={14} color="#64748b" />
              <Text className="text-sm font-medium text-slate-900 dark:text-white">
                {property.name || "Service Address"}
              </Text>
            </View>
            {property.isPrimary && (
              <Badge label="Primary" bgClass="bg-blue-100" textClass="text-blue-700" />
            )}
          </View>
          <Text className="text-sm text-slate-600 dark:text-slate-400 ml-5">
            {formatAddress(property)}
          </Text>
          {property.accessNotes && (
            <Text className="text-xs text-slate-500 ml-5 mt-1">
              Access: {property.accessNotes}
            </Text>
          )}
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ----- Step 3: Options -----

function OptionsStep({
  options,
  onChange,
}: {
  options: EstimateOption[];
  onChange: (opts: EstimateOption[]) => void;
}) {
  const updateOption = (index: number, updates: Partial<EstimateOption>) => {
    const next = [...options];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const updateItem = (optIndex: number, itemIndex: number, updates: Partial<OptionItem>) => {
    const next = [...options];
    const items = [...next[optIndex].items];
    items[itemIndex] = { ...items[itemIndex], ...updates };
    next[optIndex] = { ...next[optIndex], items };
    onChange(next);
  };

  const addItem = (optIndex: number) => {
    const next = [...options];
    next[optIndex] = {
      ...next[optIndex],
      items: [...next[optIndex].items, makeEmptyItem()],
    };
    onChange(next);
  };

  const removeItem = (optIndex: number, itemIndex: number) => {
    const next = [...options];
    next[optIndex] = {
      ...next[optIndex],
      items: next[optIndex].items.filter((_, i) => i !== itemIndex),
    };
    onChange(next);
  };

  const addOption = () => {
    onChange([...options, makeEmptyOption()]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 1) return;
    Alert.alert("Remove Option", `Remove "${options[index].name || "Untitled"}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onChange(options.filter((_, i) => i !== index)),
      },
    ]);
  };

  const getOptionTotal = (opt: EstimateOption): number => {
    return opt.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pt-2 pb-4" keyboardShouldPersistTaps="handled">
      {options.map((option, optIndex) => (
        <View
          key={optIndex}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-3"
        >
          {/* Option header */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Option {optIndex + 1}
            </Text>
            {options.length > 1 && (
              <Pressable onPress={() => removeOption(optIndex)} hitSlop={8}>
                <Trash2 size={16} color="#ef4444" />
              </Pressable>
            )}
          </View>

          {/* Option name */}
          <TextInput
            value={option.name}
            onChangeText={(t) => updateOption(optIndex, { name: t })}
            placeholder="Option name (e.g. Basic, Premium)"
            placeholderTextColor="#94a3b8"
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-white mb-2 bg-slate-50 dark:bg-slate-800"
          />

          {/* Description */}
          <TextInput
            value={option.description}
            onChangeText={(t) => updateOption(optIndex, { description: t })}
            placeholder="Description (optional)"
            placeholderTextColor="#94a3b8"
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white mb-2 bg-slate-50 dark:bg-slate-800"
            multiline
          />

          {/* Recommended toggle */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              updateOption(optIndex, { isRecommended: !option.isRecommended });
            }}
            className="flex-row items-center gap-2 mb-3"
          >
            <View
              className={`w-5 h-5 rounded border items-center justify-center ${
                option.isRecommended
                  ? "bg-blue-600 border-blue-600"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            >
              {option.isRecommended && <Check size={14} color="#fff" />}
            </View>
            <Text className="text-sm text-slate-700 dark:text-slate-300">Recommended</Text>
          </Pressable>

          {/* Line items */}
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Line Items
          </Text>

          {option.items.map((item, itemIndex) => (
            <View
              key={itemIndex}
              className="border border-slate-100 dark:border-slate-700 rounded-xl p-3 mb-2 bg-slate-50 dark:bg-slate-800"
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-2">
                  <TextInput
                    value={item.description}
                    onChangeText={(t) => updateItem(optIndex, itemIndex, { description: t })}
                    placeholder="Description"
                    placeholderTextColor="#94a3b8"
                    className="text-sm text-slate-900 dark:text-white mb-2"
                  />
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="text-[10px] text-slate-400 mb-0.5">Qty</Text>
                      <TextInput
                        value={item.quantity}
                        onChangeText={(t) => updateItem(optIndex, itemIndex, { quantity: t })}
                        placeholder="1"
                        placeholderTextColor="#94a3b8"
                        keyboardType="decimal-pad"
                        className="border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] text-slate-400 mb-0.5">Unit Price</Text>
                      <TextInput
                        value={item.unitPrice}
                        onChangeText={(t) => updateItem(optIndex, itemIndex, { unitPrice: t })}
                        placeholder="0.00"
                        placeholderTextColor="#94a3b8"
                        keyboardType="decimal-pad"
                        className="border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                      />
                    </View>
                  </View>
                </View>
                {option.items.length > 1 && (
                  <Pressable onPress={() => removeItem(optIndex, itemIndex)} hitSlop={8} className="pt-1">
                    <Trash2 size={14} color="#ef4444" />
                  </Pressable>
                )}
              </View>

              {/* Type pills */}
              <View className="flex-row gap-1.5 mt-2">
                {LINE_ITEM_TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateItem(optIndex, itemIndex, { type: t.key });
                    }}
                    className={`px-2.5 py-1 rounded-full ${
                      item.type === t.key
                        ? "bg-blue-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-medium ${
                        item.type === t.key
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Add item button */}
          <Pressable
            onPress={() => addItem(optIndex)}
            className="flex-row items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 active:bg-slate-50 dark:active:bg-slate-800"
          >
            <Plus size={14} color="#64748b" />
            <Text className="text-sm text-slate-500">Add Item</Text>
          </Pressable>

          {/* Option total */}
          <View className="flex-row items-center justify-end mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <Text className="text-sm text-slate-500 mr-2">Total:</Text>
            <Text className="text-base font-bold text-slate-900 dark:text-white">
              ${getOptionTotal(option).toFixed(2)}
            </Text>
          </View>
        </View>
      ))}

      {/* Add option button */}
      <Button
        title="Add Option"
        onPress={addOption}
        variant="outline"
        icon={<Plus size={16} color="#374151" />}
      />
    </ScrollView>
  );
}

// ----- Step 4: Details -----

function DetailsStep({
  summary,
  onSummaryChange,
  notes,
  onNotesChange,
  validUntil,
  onValidUntilChange,
}: {
  summary: string;
  onSummaryChange: (s: string) => void;
  notes: string;
  onNotesChange: (s: string) => void;
  validUntil: string;
  onValidUntilChange: (s: string) => void;
}) {
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pt-2 pb-4" keyboardShouldPersistTaps="handled">
      <Card>
        <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Summary *
        </Text>
        <TextInput
          value={summary}
          onChangeText={onSummaryChange}
          placeholder="Brief description of the estimate"
          placeholderTextColor="#94a3b8"
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 mb-4"
        />

        <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Notes
        </Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Additional notes for the customer"
          placeholderTextColor="#94a3b8"
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 mb-4"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 80 }}
        />

        <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Valid Until
        </Text>
        <TextInput
          value={validUntil}
          onChangeText={onValidUntilChange}
          placeholder="YYYY-MM-DD (optional)"
          placeholderTextColor="#94a3b8"
          className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-base text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800"
          autoCapitalize="none"
        />
      </Card>
    </ScrollView>
  );
}

// ----- Step 5: Review -----

function ReviewStep({
  customerName,
  propertyAddress,
  options,
  summary,
  notes,
  validUntil,
}: {
  customerName: string;
  propertyAddress: string;
  options: EstimateOption[];
  summary: string;
  notes: string;
  validUntil: string;
}) {
  const getOptionTotal = (opt: EstimateOption): number => {
    return opt.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pt-2 pb-4">
      {/* Customer & Property */}
      <Card>
        <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Customer
        </Text>
        <Text className="text-base font-medium text-slate-900 dark:text-white">
          {customerName}
        </Text>
        <Text className="text-sm text-slate-500 mt-1">{propertyAddress}</Text>
      </Card>

      {/* Summary */}
      <View className="mt-3">
        <Card>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Summary
          </Text>
          <Text className="text-base text-slate-900 dark:text-white">{summary}</Text>
          {validUntil ? (
            <Text className="text-xs text-slate-500 mt-1">Valid until: {validUntil}</Text>
          ) : null}
        </Card>
      </View>

      {/* Options */}
      {options.map((option, index) => (
        <View key={index} className="mt-3">
          <Card>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-slate-900 dark:text-white">
                  {option.name || `Option ${index + 1}`}
                </Text>
                {option.isRecommended && (
                  <Badge label="Recommended" bgClass="bg-blue-100" textClass="text-blue-700" />
                )}
              </View>
              <Text className="text-base font-bold text-slate-900 dark:text-white">
                ${getOptionTotal(option).toFixed(2)}
              </Text>
            </View>

            {option.description ? (
              <Text className="text-xs text-slate-500 mb-2">{option.description}</Text>
            ) : null}

            {option.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                className="flex-row items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-sm text-slate-700 dark:text-slate-300">{item.description}</Text>
                  <Text className="text-xs text-slate-400">
                    {item.quantity} x ${parseFloat(item.unitPrice || "0").toFixed(2)}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-slate-900 dark:text-white">
                  ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ))}

      {/* Notes */}
      {notes ? (
        <View className="mt-3">
          <Card>
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Notes
            </Text>
            <Text className="text-sm text-slate-700 dark:text-slate-300">{notes}</Text>
          </Card>
        </View>
      ) : null}
    </ScrollView>
  );
}
