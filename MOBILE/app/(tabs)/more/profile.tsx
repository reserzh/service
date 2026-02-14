import { View, Text, ScrollView } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { getInitials, formatPhone } from "@/lib/format";
import { Mail, Phone, Shield } from "lucide-react-native";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  office_manager: "Office Manager",
  dispatcher: "Dispatcher",
  csr: "Customer Service",
  technician: "Technician",
};

export default function ProfileScreen() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950" contentContainerClassName="pb-8">
      {/* Header */}
      <View className="items-center py-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <Avatar
          initials={getInitials(user.firstName, user.lastName)}
          size="lg"
          color="#3b82f6"
        />
        <Text className="text-xl font-bold text-slate-900 dark:text-white mt-3">
          {user.firstName} {user.lastName}
        </Text>
        <Badge
          label={ROLE_LABELS[user.role] ?? user.role}
          bgClass="bg-blue-100"
          textClass="text-blue-700"
          size="md"
        />
      </View>

      {/* Info */}
      <View className="px-4 mt-4">
        <Card>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Account Info
          </Text>
          <InfoRow
            icon={<Mail size={16} color="#64748b" />}
            label="Email"
            value={user.email}
          />
          <InfoRow
            icon={<Shield size={16} color="#64748b" />}
            label="Role"
            value={ROLE_LABELS[user.role] ?? user.role}
          />
        </Card>
      </View>

      <View className="px-4 mt-6">
        <Text className="text-xs text-slate-400 text-center">
          FieldService Pro v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      {icon}
      <View>
        <Text className="text-xs text-slate-500">{label}</Text>
        <Text className="text-sm font-medium text-slate-900 dark:text-white">{value}</Text>
      </View>
    </View>
  );
}
