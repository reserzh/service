import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useEstimateDraftStore } from "@/stores/estimateDraft";
import { estimatesApi } from "@/api/endpoints/estimates";

type InputMode = "lxw" | "direct" | "ai_photo";

interface AreaAnalysisResult {
  estimatedSqft: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
  range: { min: number; max: number };
  zones?: { name: string; estimatedSqft: number }[];
}

interface AreaCalculatorStepProps {
  onSelectOption: (option: {
    name: string;
    description: string;
    isRecommended: boolean;
    items: { pricebookItemId?: string; description: string; quantity: string; unitPrice: string; type: string }[];
  }) => void;
  categories: string[];
}

const CONFIDENCE_COLORS = {
  low: { bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
  medium: { bg: "#fffbeb", text: "#d97706", border: "#fde68a" },
  high: { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
};

export function AreaCalculatorStep({ onSelectOption, categories }: AreaCalculatorStepProps) {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [directSqft, setDirectSqft] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("lxw");
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

  // AI Photo state
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState("image/jpeg");
  const [photoContext, setPhotoContext] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AreaAnalysisResult | null>(null);

  const areaSqft =
    inputMode === "direct"
      ? Number(directSqft) || 0
      : inputMode === "ai_photo"
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
    } catch {
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

  // ---- AI Photo handlers ----

  const pickPhoto = async (useCamera: boolean) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
      exif: false,
    };

    let result: ImagePicker.ImagePickerResult;

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera permission is required to take photos.");
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Photo library permission is required.");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setPhotoMimeType(asset.mimeType || "image/jpeg");
      setAnalysisResult(null);
    }
  };

  const showPhotoActionSheet = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickPhoto(true);
          if (buttonIndex === 2) pickPhoto(false);
        }
      );
    } else {
      Alert.alert("Add Photo", "Choose an option", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => pickPhoto(true) },
        { text: "Choose from Library", onPress: () => pickPhoto(false) },
      ]);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!photoUri) return;

    setError("");
    setAnalyzing(true);
    try {
      const res = await estimatesApi.analyzePhoto(
        photoUri,
        photoMimeType,
        photoContext.trim() || undefined
      );
      setAnalysisResult(res.data);
    } catch {
      setError("Failed to analyze photo. Please try again or enter dimensions manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUseEstimate = () => {
    if (!analysisResult) return;
    setDirectSqft(String(analysisResult.estimatedSqft));
    setInputMode("direct");
    setAnalysisResult(null);
    setPhotoUri(null);
  };

  // ---- Render ----

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Area Calculator</Text>
      <Text style={styles.subtitle}>
        Enter lawn dimensions to generate pricing options
      </Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, inputMode === "lxw" && styles.toggleActive]}
          onPress={() => setInputMode("lxw")}
        >
          <Text style={[styles.toggleText, inputMode === "lxw" && styles.toggleTextActive]}>
            L x W
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, inputMode === "direct" && styles.toggleActive]}
          onPress={() => setInputMode("direct")}
        >
          <Text style={[styles.toggleText, inputMode === "direct" && styles.toggleTextActive]}>
            Direct Sqft
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, inputMode === "ai_photo" && styles.toggleActive]}
          onPress={() => setInputMode("ai_photo")}
        >
          <Text style={[styles.toggleText, inputMode === "ai_photo" && styles.toggleTextActive]}>
            AI Photo
          </Text>
        </TouchableOpacity>
      </View>

      {inputMode === "direct" && (
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
      )}

      {inputMode === "lxw" && (
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

      {inputMode === "ai_photo" && (
        <View style={styles.aiPhotoSection}>
          {photoUri ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity style={styles.retakeBtn} onPress={showPhotoActionSheet}>
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureBtn} onPress={showPhotoActionSheet}>
              <Text style={styles.captureBtnIcon}>📷</Text>
              <Text style={styles.captureBtnText}>Take or Select Photo</Text>
              <Text style={styles.captureBtnHint}>
                Snap a photo of the area — AI will estimate dimensions
              </Text>
            </TouchableOpacity>
          )}

          {photoUri && !analysisResult && (
            <>
              <TextInput
                style={styles.contextInput}
                value={photoContext}
                onChangeText={setPhotoContext}
                placeholder="Optional: describe what to measure (e.g. 'front yard', 'patio area')"
                placeholderTextColor="#999"
                multiline
              />
              <TouchableOpacity
                style={[styles.analyzeBtn, analyzing && styles.analyzeBtnDisabled]}
                onPress={handleAnalyzePhoto}
                disabled={analyzing}
              >
                {analyzing ? (
                  <View style={styles.analyzingRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.analyzeBtnText}>Analyzing...</Text>
                  </View>
                ) : (
                  <Text style={styles.analyzeBtnText}>Analyze with AI</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {analysisResult && (
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <Text style={styles.analysisTitle}>AI Estimate</Text>
                <View
                  style={[
                    styles.confidenceBadge,
                    { backgroundColor: CONFIDENCE_COLORS[analysisResult.confidence].bg,
                      borderColor: CONFIDENCE_COLORS[analysisResult.confidence].border },
                  ]}
                >
                  <Text
                    style={[
                      styles.confidenceText,
                      { color: CONFIDENCE_COLORS[analysisResult.confidence].text },
                    ]}
                  >
                    {analysisResult.confidence.toUpperCase()} confidence
                  </Text>
                </View>
              </View>

              <Text style={styles.analysisSqft}>
                {analysisResult.estimatedSqft.toLocaleString()} sq ft
              </Text>
              <Text style={styles.analysisRange}>
                Range: {analysisResult.range.min.toLocaleString()} – {analysisResult.range.max.toLocaleString()} sq ft
              </Text>
              <Text style={styles.analysisReasoning}>{analysisResult.reasoning}</Text>

              {analysisResult.zones && analysisResult.zones.length > 0 && (
                <View style={styles.zonesSection}>
                  <Text style={styles.zonesTitle}>Zones</Text>
                  {analysisResult.zones.map((zone, i) => (
                    <View key={i} style={styles.zoneRow}>
                      <Text style={styles.zoneName}>{zone.name}</Text>
                      <Text style={styles.zoneSqft}>{zone.estimatedSqft.toLocaleString()} sqft</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity style={styles.useEstimateBtn} onPress={handleUseEstimate}>
                <Text style={styles.useEstimateBtnText}>Use This Estimate</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {inputMode !== "ai_photo" && areaSqft > 0 && (
        <Text style={styles.sqftDisplay}>{areaSqft.toLocaleString()} sq ft</Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {inputMode !== "ai_photo" && (
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
      )}

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

  // AI Photo styles
  aiPhotoSection: { marginBottom: 16 },
  captureBtn: {
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  captureBtnIcon: { fontSize: 32, marginBottom: 8 },
  captureBtnText: { fontSize: 16, fontWeight: "600", color: "#4f46e5" },
  captureBtnHint: { fontSize: 12, color: "#999", marginTop: 4, textAlign: "center" },
  photoPreview: { borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  previewImage: { width: "100%", height: 200, borderRadius: 12 },
  retakeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retakeBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  contextInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 12,
    minHeight: 44,
  },
  analyzeBtn: {
    backgroundColor: "#7c3aed",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  analyzingRow: { flexDirection: "row", alignItems: "center", gap: 8 },

  // Analysis result card
  analysisCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 12,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  analysisTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  confidenceBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  confidenceText: { fontSize: 11, fontWeight: "600" },
  analysisSqft: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4f46e5",
    marginVertical: 4,
  },
  analysisRange: { fontSize: 13, color: "#888" },
  analysisReasoning: { fontSize: 13, color: "#666", marginTop: 8, lineHeight: 18 },
  zonesSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 8 },
  zonesTitle: { fontSize: 13, fontWeight: "600", color: "#666", marginBottom: 4 },
  zoneRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  zoneName: { fontSize: 13, color: "#333" },
  zoneSqft: { fontSize: 13, color: "#666" },
  useEstimateBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  useEstimateBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
