import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Users,
  FileText,
  Receipt,
  UserCircle,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { useSignOut } from "@/hooks/useAuth";
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
      className="flex-row items-center gap-4 bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-100 dark:border-slate-800 active:bg-slate-50 dark:active:bg-slate-800"
    >
      <View className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center">
        {icon}
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-medium ${
            destructive ? "text-red-600" : "text-slate-900 dark:text-white"
          }`}
        >
          {label}
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </Text>
      </View>
      <ChevronRight size={18} color="#94a3b8" />
    </Pressable>
  );
}

export default function MoreScreen() {
  const { user } = useAuthStore();
  const signOut = useSignOut();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-slate-950" edges={["top"]}>
      {/* Profile header */}
      <Pressable
        onPress={() => router.push("/(tabs)/more/profile")}
        className="flex-row items-center gap-4 bg-white dark:bg-slate-900 px-4 py-5 mb-6 active:bg-slate-50"
      >
        <Avatar
          initials={getInitials(user?.firstName ?? "U", user?.lastName ?? "")}
          size="lg"
        />
        <View className="flex-1">
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-sm text-slate-500 dark:text-slate-400">
            {user?.email}
          </Text>
        </View>
        <ChevronRight size={18} color="#94a3b8" />
      </Pressable>

      {/* Menu items */}
      <View className="rounded-xl overflow-hidden mx-4 mb-4">
        <MenuItem
          icon={<Users size={20} color="#64748b" />}
          label="Customers"
          description="Search and view customer info"
          onPress={() => router.push("/(tabs)/more/customers")}
        />
        <MenuItem
          icon={<FileText size={20} color="#64748b" />}
          label="Estimates"
          description="View and create estimates"
          onPress={() => router.push("/(tabs)/more/estimates")}
        />
        <MenuItem
          icon={<Receipt size={20} color="#64748b" />}
          label="Invoices"
          description="View invoices and payment status"
          onPress={() => router.push("/(tabs)/more/invoices")}
        />
        <MenuItem
          icon={<UserCircle size={20} color="#64748b" />}
          label="Profile"
          description="View your profile and settings"
          onPress={() => router.push("/(tabs)/more/profile")}
        />
      </View>

      <View className="rounded-xl overflow-hidden mx-4">
        <MenuItem
          icon={<LogOut size={20} color="#ef4444" />}
          label="Sign Out"
          description="Sign out of your account"
          onPress={handleSignOut}
          destructive
        />
      </View>
    </SafeAreaView>
  );
}
