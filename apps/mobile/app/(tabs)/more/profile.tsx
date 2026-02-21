import { useEffect } from "react";
import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import {
  Mail,
  Shield,
  Briefcase,
  Clock,
  DollarSign,
  Map,
  Moon,
  Bell,
  BellOff,
  Info,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/stores/auth";
import { useSettingsStore } from "@/stores/settings";
import { usePerformanceStats } from "@/hooks/usePerformanceStats";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { getInitials, formatCurrency } from "@/lib/format";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  office_manager: "Office Manager",
  dispatcher: "Dispatcher",
  csr: "Customer Service",
  technician: "Technician",
};

const MAP_APP_OPTIONS = [
  { key: "default" as const, label: "Default" },
  { key: "google" as const, label: "Google Maps" },
  { key: "waze" as const, label: "Waze" },
];

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const settings = useSettingsStore();
  const { data: statsData, isLoading: statsLoading } = usePerformanceStats();

  useEffect(() => {
    settings.restore();
  }, []);

  if (!user) return null;

  const stats = statsData?.data;

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

      {/* Performance Metrics */}
      <View className="px-4 mt-4">
        <Card>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Performance
          </Text>
          {statsLoading ? (
            <View className="gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-36" />
            </View>
          ) : stats ? (
            <View className="gap-3">
              <MetricRow
                icon={<Briefcase size={16} color="#3b82f6" />}
                label="Jobs Completed"
                value={String(stats.jobsCompleted)}
              />
              <MetricRow
                icon={<Clock size={16} color="#f59e0b" />}
                label="Avg Duration"
                value={`${stats.avgDurationMinutes} min`}
              />
              <MetricRow
                icon={<DollarSign size={16} color="#10b981" />}
                label="Revenue"
                value={formatCurrency(stats.revenue)}
              />
            </View>
          ) : (
            <Text className="text-sm text-slate-400 italic">
              Stats unavailable
            </Text>
          )}
        </Card>
      </View>

      {/* Account Info */}
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

      {/* Notifications */}
      <View className="px-4 mt-4">
        <Card>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Notifications
          </Text>
          <ToggleRow
            icon={<Bell size={16} color="#3b82f6" />}
            label="Job Assigned"
            value={settings.notifyJobAssigned}
            onToggle={(v) => {
              Haptics.selectionAsync();
              settings.setNotifyJobAssigned(v);
            }}
          />
          <ToggleRow
            icon={<Bell size={16} color="#f59e0b" />}
            label="Job Updated"
            value={settings.notifyJobUpdated}
            onToggle={(v) => {
              Haptics.selectionAsync();
              settings.setNotifyJobUpdated(v);
            }}
          />
          <ToggleRow
            icon={<Bell size={16} color="#8b5cf6" />}
            label="New Estimate"
            value={settings.notifyNewEstimate}
            onToggle={(v) => {
              Haptics.selectionAsync();
              settings.setNotifyNewEstimate(v);
            }}
          />
        </Card>
      </View>

      {/* App Settings */}
      <View className="px-4 mt-4">
        <Card>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            App Settings
          </Text>

          {/* Default Map App */}
          <View className="mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Map size={16} color="#64748b" />
              <Text className="text-sm font-medium text-slate-900 dark:text-white">
                Default Map App
              </Text>
            </View>
            <View className="flex-row gap-2">
              {MAP_APP_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    settings.setPreferredMapApp(opt.key);
                  }}
                  className={`px-3 py-2 rounded-lg border ${
                    settings.preferredMapApp === opt.key
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      settings.preferredMapApp === opt.key
                        ? "font-medium text-blue-700 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Dark mode override */}
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Moon size={16} color="#64748b" />
              <Text className="text-sm font-medium text-slate-900 dark:text-white">
                Appearance
              </Text>
            </View>
            <View className="flex-row gap-2">
              {(["system", "light", "dark"] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => {
                    Haptics.selectionAsync();
                    settings.setDarkModeOverride(mode);
                  }}
                  className={`px-3 py-2 rounded-lg border ${
                    settings.darkModeOverride === mode
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Text
                    className={`text-sm capitalize ${
                      settings.darkModeOverride === mode
                        ? "font-medium text-blue-700 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {mode}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>
      </View>

      {/* About */}
      <View className="px-4 mt-4">
        <Card>
          <View className="flex-row items-center gap-2 mb-2">
            <Info size={16} color="#64748b" />
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              About
            </Text>
          </View>
          <Text className="text-sm text-slate-600 dark:text-slate-400">
            FieldService Pro v1.0.0
          </Text>
          <Text className="text-xs text-slate-400 mt-1">
            Built for field service professionals
          </Text>
        </Card>
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

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-sm text-slate-600 dark:text-slate-400">{label}</Text>
      </View>
      <Text className="text-sm font-semibold text-slate-900 dark:text-white">{value}</Text>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-sm text-slate-900 dark:text-white">{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
        thumbColor={value ? "#3b82f6" : "#f4f4f5"}
      />
    </View>
  );
}
