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
import { estimatesApi } from "@/api/endpoints/estimates";

interface BOMItem {
  pricebookItemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  type: string;
  isEstimated?: boolean;
}

interface BOMOption {
  name: string;
  description: string;
  isRecommended: boolean;
  items: BOMItem[];
  total: number;
}

interface BOMStepProps {
  onSelectOption: (option: {
    name: string;
    description: string;
    isRecommended: boolean;
    items: { pricebookItemId?: string; description: string; quantity: string; unitPrice: string; type: string }[];
  }) => void;
  initialJobType?: string;
  initialAreaSqft?: number;
  initialLength?: number;
  initialWidth?: number;
}

const COMMON_JOB_TYPES = [
  "Pergola",
  "Paver Installation",
  "Artificial Turf",
  "Fence",
  "Sod Installation",
  "Deck",
  "Retaining Wall",
  "Irrigation",
];

export function BOMStep({
  onSelectOption,
  initialJobType,
  initialAreaSqft,
  initialLength,
  initialWidth,
}: BOMStepProps) {
  const [jobType, setJobType] = useState(initialJobType ?? "");
  const [areaSqft, setAreaSqft] = useState(initialAreaSqft ? String(initialAreaSqft) : "");
  const [length, setLength] = useState(initialLength ? String(initialLength) : "");
  const [width, setWidth] = useState(initialWidth ? String(initialWidth) : "");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ source: "template" | "ai"; options: BOMOption[] } | null>(null);

  const handleGenerate = useCallback(async (useAI?: boolean) => {
    if (!jobType.trim()) {
      setError("Please select or enter a job type");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await estimatesApi.generateBOM({
        jobType: jobType.trim(),
        areaSqft: Number(areaSqft) || undefined,
        length: Number(length) || undefined,
        width: Number(width) || undefined,
        useAI,
        description: description.trim() || undefined,
      });
      setResult(res.data);
    } catch {
      setError("Failed to generate bill of materials. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [jobType, areaSqft, length, width, description]);

  const handleSelect = (option: BOMOption) => {
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
      <Text style={styles.title}>Bill of Materials</Text>
      <Text style={styles.subtitle}>
        Select a job type and dimensions to auto-generate materials
      </Text>

      {/* Job type quick-select */}
      <Text style={styles.label}>Job Type</Text>
      <View style={styles.chipRow}>
        {COMMON_JOB_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, jobType === type && styles.chipActive]}
            onPress={() => setJobType(type)}
          >
            <Text style={[styles.chipText, jobType === type && styles.chipTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={styles.input}
        value={jobType}
        onChangeText={setJobType}
        placeholder="Or type a custom job type..."
        placeholderTextColor="#999"
      />

      {/* Dimensions */}
      <Text style={[styles.label, { marginTop: 16 }]}>Dimensions (optional)</Text>
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.sublabel}>Area (sqft)</Text>
          <TextInput
            style={styles.input}
            value={areaSqft}
            onChangeText={setAreaSqft}
            keyboardType="numeric"
            placeholder="e.g. 500"
          />
        </View>
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.sublabel}>Length (ft)</Text>
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
          <Text style={styles.sublabel}>Width (ft)</Text>
          <TextInput
            style={styles.input}
            value={width}
            onChangeText={setWidth}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>

      <TextInput
        style={[styles.input, { marginTop: 12, minHeight: 44 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Additional details (optional)"
        placeholderTextColor="#999"
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={() => handleGenerate(false)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.generateBtnText}>Generate BOM</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.aiBtn, loading && styles.generateBtnDisabled]}
          onPress={() => handleGenerate(true)}
          disabled={loading}
        >
          <Text style={styles.aiBtnText}>AI Generate</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.results}>
          <View style={styles.sourceRow}>
            <Text style={styles.sourceLabel}>
              Source: {result.source === "template" ? "Template" : "AI Generated"}
            </Text>
          </View>

          {result.options.map((option) => (
            <TouchableOpacity
              key={option.name}
              style={[styles.optionCard, option.isRecommended && styles.optionCardRecommended]}
              onPress={() => handleSelect(option)}
            >
              {option.isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
              <Text style={styles.optionName}>{option.name}</Text>
              <Text style={styles.optionDesc}>{option.description}</Text>

              {/* Item list */}
              <View style={styles.itemList}>
                {option.items.map((item, i) => (
                  <View key={i} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemDesc}>{item.description}</Text>
                      {item.isEstimated && (
                        <Text style={styles.estimatedTag}>est.</Text>
                      )}
                    </View>
                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                    <Text style={styles.itemPrice}>
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.optionTotal}>
                  ${option.total.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <Text style={styles.useThis}>Tap to use this option</Text>
            </TouchableOpacity>
          ))}

          {result.options.length === 0 && (
            <Text style={styles.noResults}>
              No materials found for this job type. Try "AI Generate" for AI-powered suggestions.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8 },
  sublabel: { fontSize: 12, color: "#666", marginBottom: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: "#4f46e5", backgroundColor: "#eef2ff" },
  chipText: { fontSize: 13, color: "#666" },
  chipTextActive: { color: "#4f46e5", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 8 },
  inputGroup: { flex: 1 },
  times: { fontSize: 20, color: "#999", paddingBottom: 12 },
  error: { color: "#ef4444", fontSize: 13, marginVertical: 8 },
  buttonRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  generateBtn: {
    flex: 1,
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  aiBtn: {
    flex: 1,
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  aiBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  results: { marginTop: 20, gap: 12 },
  sourceRow: { marginBottom: 4 },
  sourceLabel: { fontSize: 12, color: "#888", fontWeight: "500" },
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
  itemList: { marginTop: 12, gap: 6 },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4 },
  itemDesc: { fontSize: 13, color: "#333" },
  estimatedTag: { fontSize: 10, color: "#d97706", fontWeight: "600" },
  itemQty: { fontSize: 13, color: "#666", width: 40, textAlign: "right" },
  itemPrice: { fontSize: 13, color: "#333", fontWeight: "500", width: 70, textAlign: "right" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#f3f4f6", marginTop: 8, paddingTop: 8 },
  optionTotal: { fontSize: 22, fontWeight: "700", color: "#111", textAlign: "right" },
  useThis: { fontSize: 13, color: "#4f46e5", fontWeight: "500", marginTop: 8 },
  noResults: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 20, lineHeight: 20 },
});
