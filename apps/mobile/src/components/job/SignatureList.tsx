import { useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Image } from "expo-image";
import { X, FileCheck } from "lucide-react-native";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/format";
import { SUPABASE_URL } from "@/lib/constants";
import type { JobSignature } from "@/types/models";

interface SignatureListProps {
  signatures: JobSignature[];
}

function getSignatureUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/job-signatures/${storagePath}`;
}

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  customer: { bg: "bg-blue-100", text: "text-blue-700" },
  technician: { bg: "bg-purple-100", text: "text-purple-700" },
};

export function SignatureList({ signatures }: SignatureListProps) {
  const [viewSignature, setViewSignature] = useState<JobSignature | null>(null);

  if (signatures.length === 0) {
    return <Text className="text-sm text-slate-400 italic">No signatures yet</Text>;
  }

  return (
    <>
      {signatures.map((sig) => {
        const roleBadge = ROLE_BADGE[sig.signerRole] || ROLE_BADGE.customer;
        return (
          <Pressable
            key={sig.id}
            onPress={() => setViewSignature(sig)}
            className="flex-row items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
          >
            <View className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg items-center justify-center">
              <FileCheck size={16} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-slate-900 dark:text-white">
                {sig.signerName}
              </Text>
              <Text className="text-xs text-slate-400">
                {formatRelativeTime(sig.signedAt)}
              </Text>
            </View>
            <Badge
              label={sig.signerRole === "customer" ? "Customer" : "Technician"}
              bgClass={roleBadge.bg}
              textClass={roleBadge.text}
              size="sm"
            />
          </Pressable>
        );
      })}

      {/* Fullscreen signature view */}
      <Modal visible={!!viewSignature} transparent animationType="fade">
        <View className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-4 pt-14 pb-3">
            <View>
              <Text className="text-white text-sm font-medium">
                {viewSignature?.signerName}
              </Text>
              <Text className="text-white/60 text-xs">
                {viewSignature?.signerRole === "customer" ? "Customer" : "Technician"}
                {" · "}
                {viewSignature ? formatRelativeTime(viewSignature.signedAt) : ""}
              </Text>
            </View>
            <Pressable onPress={() => setViewSignature(null)} hitSlop={12}>
              <X size={24} color="#fff" />
            </Pressable>
          </View>
          {viewSignature && (
            <View className="flex-1 bg-white mx-4 mb-8 rounded-xl overflow-hidden">
              <Image
                source={{ uri: getSignatureUrl(viewSignature.storagePath) }}
                style={{ flex: 1 }}
                contentFit="contain"
                transition={200}
              />
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
