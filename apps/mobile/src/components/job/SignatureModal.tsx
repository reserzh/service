import { useRef, useState } from "react";
import { View, Text, Modal, TextInput, Pressable } from "react-native";
import SignatureCanvas, { type SignatureViewRef } from "react-native-signature-canvas";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { X, RotateCcw } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { useUploadSignature } from "@/hooks/useSignatures";
import type { SignerRole } from "@/types/models";

interface SignatureModalProps {
  jobId: string;
  visible: boolean;
  onClose: () => void;
}

const ROLES: { value: SignerRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "technician", label: "Technician" },
];

export function SignatureModal({ jobId, visible, onClose }: SignatureModalProps) {
  const signatureRef = useRef<SignatureViewRef>(null);
  const uploadSignature = useUploadSignature();
  const [signerName, setSignerName] = useState("");
  const [signerRole, setSignerRole] = useState<SignerRole>("customer");
  const [hasSignature, setHasSignature] = useState(false);

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
  };

  const handleDone = () => {
    if (!signerName.trim()) {
      Toast.show({ type: "error", text1: "Please enter signer name" });
      return;
    }
    signatureRef.current?.readSignature();
  };

  const handleSignatureData = async (base64: string) => {
    if (!base64 || !signerName.trim()) return;

    try {
      await uploadSignature.mutateAsync({
        jobId,
        base64,
        signerName: signerName.trim(),
        signerRole,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: "success", text1: "Signature saved" });
      handleClose();
    } catch {
      Toast.show({ type: "error", text1: "Failed to save signature" });
    }
  };

  const handleClose = () => {
    signatureRef.current?.clearSignature();
    setSignerName("");
    setSignerRole("customer");
    setHasSignature(false);
    onClose();
  };

  const signatureStyle = `
    .m-signature-pad { box-shadow: none; border: none; }
    .m-signature-pad--body { border: none; }
    .m-signature-pad--footer { display: none; }
    body, html { background-color: #ffffff; }
  `;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3 border-b border-slate-200">
          <Text className="text-lg font-bold text-slate-900">Capture Signature</Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <X size={24} color="#64748b" />
          </Pressable>
        </View>

        {/* Signer info */}
        <View className="px-4 pt-4 pb-3 gap-3">
          <TextInput
            value={signerName}
            onChangeText={setSignerName}
            placeholder="Signer name"
            placeholderTextColor="#94a3b8"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900"
          />
          <View className="flex-row gap-2">
            {ROLES.map((role) => (
              <Pressable
                key={role.value}
                onPress={() => setSignerRole(role.value)}
                className={`flex-1 items-center py-2.5 rounded-xl border ${
                  signerRole === role.value
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-slate-200"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    signerRole === role.value ? "text-blue-700" : "text-slate-500"
                  }`}
                >
                  {role.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Signature canvas */}
        <View className="flex-1 mx-4 mb-3 border border-slate-200 rounded-xl overflow-hidden">
          <SignatureCanvas
            ref={signatureRef}
            webStyle={signatureStyle}
            onOK={handleSignatureData}
            onBegin={() => setHasSignature(true)}
            backgroundColor="#ffffff"
            penColor="#1e293b"
            minWidth={2}
            maxWidth={4}
            trimWhitespace
            imageType="image/png"
          />
        </View>

        {/* Actions */}
        <View className="flex-row gap-3 px-4 pb-10">
          <View className="flex-1">
            <Button
              title="Clear"
              variant="outline"
              onPress={handleClear}
              icon={<RotateCcw size={16} color="#64748b" />}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Save Signature"
              onPress={handleDone}
              loading={uploadSignature.isPending}
              disabled={!hasSignature || !signerName.trim()}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
