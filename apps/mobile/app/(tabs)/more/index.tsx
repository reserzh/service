import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Users,
  FileText,
  Receipt,
  ChevronRight,
} from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";
import { Avatar } from "@/components/ui/Avatar";
import { getInitials } from "@/lib/format";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuItem({ icon, label, description, onPress, destructive }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-4 bg-white dark:bg-stone-800 px-4 py-5 min-h-[64px] border-b border-stone-100 dark:border-stone-700 active:bg-stone-50 dark:active:bg-stone-800"
    >
      <View className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 items-center justify-center">
        {icon}
      </View>
      <View className="flex-1">
        <Text
          className={`text-lg font-medium ${
            destructive ? "text-red-600" : "text-stone-900 dark:text-stone-50"
          }`}
        >
          {label}
        </Text>
        <Text className="text-xs text-stone-500 dark:text-stone-400">
          {description}
        </Text>
      </View>
      <ChevronRight size={18} color="#A8A29E" />
    </Pressable>
  );
}

export default function MoreScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-orange-50/50 dark:bg-stone-900" edges={["top"]}>
      {/* Profile header */}
      <Pressable
        onPress={() => router.push("/(tabs)/more/profile")}
        className="flex-row items-center gap-4 bg-white dark:bg-stone-800 px-4 py-5 mb-6 active:bg-stone-50"
      >
        <Avatar
          initials={getInitials(user?.firstName ?? "U", user?.lastName ?? "")}
          size="lg"
        />
        <View className="flex-1">
          <Text className="text-xl font-semibold text-stone-900 dark:text-stone-50">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-base text-stone-500 dark:text-stone-400">
            {user?.email}
          </Text>
        </View>
        <ChevronRight size={18} color="#A8A29E" />
      </Pressable>

      {/* Menu items */}
      <View className="rounded-xl overflow-hidden mx-4">
        <MenuItem
          icon={<Users size={24} color="#78716C" />}
          label="Customers"
          description="Search and view customer info"
          onPress={() => router.push("/(tabs)/more/customers")}
        />
        <MenuItem
          icon={<FileText size={24} color="#78716C" />}
          label="Estimates"
          description="View and create estimates"
          onPress={() => router.push("/(tabs)/more/estimates")}
        />
        <MenuItem
          icon={<Receipt size={24} color="#78716C" />}
          label="Invoices"
          description="View invoices and payment status"
          onPress={() => router.push("/(tabs)/more/invoices")}
        />
      </View>
    </SafeAreaView>
  );
}
