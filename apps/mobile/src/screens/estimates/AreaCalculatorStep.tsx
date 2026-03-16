import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useEstimateDraftStore } from "@/stores/estimateDraft";
import { estimatesApi } from "@/api/endpoints/estimates";

interface AreaCalculatorStepProps {
  onSelectOption: (option: {
    name: string;
    description: string;
    isRecommended: boolean;
    items: { pricebookItemId?: string; description: string; quantity: string; unitPrice: string; type: string }[];
  }) => void;
  categories: string[];
}

export function AreaCalculatorStep({ onSelectOption, categories }: AreaCalculatorStepProps) {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [directSqft, setDirectSqft] = useState("");
  const [useDirectInput, setUseDirectInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    options: {
      name: string;
      description: string;
      isRecommended: boolean;
      items: { pricebookItemId: string; description: string; quantity: number; unitPrice: number; type: string }[];
      total: number;
    }[];
  } | null>(null);
  const [error, setError] = useState("");

  const areaSqft = useDirectInput
    ? Number(directSqft) || 0
    : (Number(length) || 0) * (Number(width) || 0);

  const handleCalculate = useCallback(async () => {
    if (areaSqft <= 0) {
      setError("Please enter valid dimensions");
      return;
    }
    if (categories.length === 0) {
      setError("Please select at least one service category");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await estimatesApi.calculateArea({
        areaSqft,
        serviceCategories: categories,
      });
      setResults(res.data);
      useEstimateDraftStore.getState().setAreaSqft(areaSqft);
    } catch (e) {
      setError("Failed to calculate pricing. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [areaSqft, categories]);

  const handleSelect = (option: NonNullable<typeof results>["options"][number]) => {
    onSelectOption({
      name: option.name,
      description: option.description,
      isRecommended: option.isRecommended,
      items: option.items.map((item) => ({
        pricebookItemId: item.pricebookItemId,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        type: item.type,
      })),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Area Calculator</Text>
      <Text style={styles.subtitle}>
        Enter lawn dimensions to generate pricing options
      </Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, !useDirectInput && styles.toggleActive]}
          onPress={() => setUseDirectInput(false)}
        >
          <Text style={[styles.toggleText, !useDirectInput && styles.toggleTextActive]}>
            L x W
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, useDirectInput && styles.toggleActive]}
          onPress={() => setUseDirectInput(true)}
        >
          <Text style={[styles.toggleText, useDirectInput && styles.toggleTextActive]}>
            Direct Sqft
          </Text>
        </TouchableOpacity>
      </View>

      {useDirectInput ? (
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Square Feet</Text>
            <TextInput
              style={styles.input}
              value={directSqft}
              onChangeText={setDirectSqft}
              keyboardType="numeric"
              placeholder="e.g. 1200"
            />
          </View>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Length (ft)</Text>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <Text style={styles.times}>x</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Width (ft)</Text>
            <TextInput
              style={styles.input}
              value={width}
              onChangeText={setWidth}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>
      )}

      {areaSqft > 0 && (
        <Text style={styles.sqftDisplay}>{areaSqft.toLocaleString()} sq ft</Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.calculateBtn, loading && styles.calculateBtnDisabled]}
        onPress={handleCalculate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.calculateBtnText}>Calculate Pricing</Text>
        )}
      </TouchableOpacity>

      {results && results.options.length > 0 && (
        <View style={styles.results}>
          {results.options.map((option) => (
            <TouchableOpacity
              key={option.name}
              style={[
                styles.optionCard,
                option.isRecommended && styles.optionCardRecommended,
              ]}
              onPress={() => handleSelect(option)}
            >
              {option.isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
              <Text style={styles.optionName}>{option.name}</Text>
              <Text style={styles.optionDesc}>{option.description}</Text>
              <Text style={styles.optionTotal}>
                ${option.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.optionItems}>
                {option.items.length} item{option.items.length !== 1 ? "s" : ""}
              </Text>
              <Text style={styles.useThis}>Tap to use this option</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {results && results.options.length === 0 && (
        <Text style={styles.noResults}>
          No pricebook items found for the selected categories with sqft-based pricing.
          Add items with unit "sqft" to your pricebook first.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4, marginBottom: 16 },
  toggleRow: { flexDirection: "row", marginBottom: 16, gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  toggleActive: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  toggleText: { fontSize: 14, color: "#666" },
  toggleTextActive: { color: "#4f46e5", fontWeight: "600" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 8 },
  inputGroup: { flex: 1 },
  label: { fontSize: 12, color: "#666", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  times: { fontSize: 20, color: "#999", paddingBottom: 12 },
  sqftDisplay: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4f46e5",
    textAlign: "center",
    marginVertical: 8,
  },
  error: { color: "#ef4444", fontSize: 13, marginVertical: 8 },
  calculateBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  calculateBtnDisabled: { opacity: 0.6 },
  calculateBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  results: { marginTop: 20, gap: 12 },
  optionCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  optionCardRecommended: { borderColor: "#4f46e5", borderWidth: 2 },
  recommendedBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  recommendedText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  optionName: { fontSize: 18, fontWeight: "700", color: "#111" },
  optionDesc: { fontSize: 13, color: "#666", marginTop: 2 },
  optionTotal: { fontSize: 22, fontWeight: "700", color: "#111", marginTop: 8 },
  optionItems: { fontSize: 12, color: "#888", marginTop: 2 },
  useThis: { fontSize: 13, color: "#4f46e5", fontWeight: "500", marginTop: 8 },
  noResults: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 20, lineHeight: 20 },
});
