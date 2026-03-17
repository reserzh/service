import { View, Text, Pressable, Linking, ScrollView } from "react-native";
import { Phone, MapPin, Clock, Info, Users } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Card } from "@/components/ui/Card";
import { NavigateButton } from "@/components/common/NavigateButton";
import { DistanceBadge } from "@/components/job/DistanceBadge";
import { PropertyDetailsCard } from "@/components/PropertyDetailsCard";
import { PropertyHistoryBanner } from "@/components/job/PropertyHistoryBanner";
import {
  formatTimeRange,
  formatPhone,
  formatAddress,
  formatCustomerName,
} from "@/lib/format";
import type { JobWithRelations } from "@/types/models";

interface JobOverviewTabProps {
  job: JobWithRelations;
}

export function JobOverviewTab({ job }: JobOverviewTabProps) {
  const address = formatAddress(job.property);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pt-3 pb-8">
      {/* Customer Card */}
      <Animated.View className="mb-3" entering={FadeInDown.delay(0).duration(400).springify()}>
        <Card>
          <Text className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">
            Customer
          </Text>
          <Text className="text-lg font-semibold text-stone-900 dark:text-white mb-1">
            {formatCustomerName(job.customer)}
          </Text>
          {job.customer.companyName && (
            <Text className="text-sm text-stone-500 mb-1">
              {job.customer.companyName}
            </Text>
          )}
          <View className="flex-row items-center gap-3 mt-2">
            <Pressable
              onPress={() => handleCall(job.customer.phone)}
              className="flex-row items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 rounded-lg active:bg-emerald-100"
              accessibilityLabel={`Call ${formatCustomerName(job.customer)}`}
              accessibilityRole="button"
            >
              <Phone size={14} color="#10b981" />
              <Text className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {formatPhone(job.customer.phone)}
              </Text>
            </Pressable>
          </View>
        </Card>
      </Animated.View>

      {/* Location Card */}
      <Animated.View className="mb-3" entering={FadeInDown.delay(80).duration(400).springify()}>
        <Card>
          <Text className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-2">
            Location
          </Text>
          <View className="flex-row items-start gap-2 mb-3">
            <MapPin size={16} color="#78716C" />
            <Text className="text-base text-stone-700 dark:text-stone-300 flex-1">
              {address}
            </Text>
          </View>
          {job.property.accessNotes && (
            <Text className="text-xs text-stone-500 mb-3">
              Access: {job.property.accessNotes}
            </Text>
          )}
          <View className="flex-row items-center gap-3">
            <NavigateButton
              address={address}
              latitude={job.property.latitude}
              longitude={job.property.longitude}
            />
            <DistanceBadge
              latitude={job.property.latitude}
              longitude={job.property.longitude}
            />
          </View>
        </Card>
      </Animated.View>

      {/* Property History — access info, last visit, substitute context */}
      <Animated.View className="mb-3" entering={FadeInDown.delay(120).duration(400).springify()}>
        <PropertyHistoryBanner
          propertyId={job.propertyId}
          assignedTo={job.assignedTo}
        />
      </Animated.View>

      {/* Property Details Card */}
      <Animated.View className="mb-3" entering={FadeInDown.delay(160).duration(400).springify()}>
        <PropertyDetailsCard
          lotSizeSqft={job.property.lotSizeSqft}
          lawnAreaSqft={job.property.lawnAreaSqft}
          propertyMetadata={job.property.propertyMetadata}
        />
      </Animated.View>

      {/* Schedule Card */}
      {job.scheduledStart && (
        <Animated.View className="mb-3" entering={FadeInDown.delay(200).duration(400).springify()}>
          <Card>
            <View className="flex-row items-center gap-2 mb-2">
              <Clock size={16} color="#EA580C" />
              <Text className="text-sm font-medium text-stone-500 uppercase tracking-wide">
                Schedule
              </Text>
            </View>
            <Text className="text-sm font-medium text-stone-900 dark:text-white">
              {formatTimeRange(job.scheduledStart, job.scheduledEnd)}
            </Text>
          </Card>
        </Animated.View>
      )}

      {/* Crew */}
      {job.assignments && job.assignments.length > 0 && (
        <Animated.View className="mb-3" entering={FadeInDown.delay(280).duration(400).springify()}>
          <Card>
            <View className="flex-row items-center gap-2 mb-2">
              <Users size={16} color="#6366f1" />
              <Text className="text-sm font-medium text-stone-500 uppercase tracking-wide">
                Crew
              </Text>
            </View>
            {job.assignments.map((a) => (
              <View key={a.id} className="flex-row items-center gap-2 mb-1.5">
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: a.user?.color ?? "#A8A29E" }}
                >
                  <Text className="text-[10px] font-bold text-white">
                    {a.user?.firstName?.[0]}{a.user?.lastName?.[0]}
                  </Text>
                </View>
                <Text className="text-base text-stone-700 dark:text-stone-300">
                  {a.user?.firstName} {a.user?.lastName}
                </Text>
                <View className={`px-1.5 py-0.5 rounded ${a.role === "lead" ? "bg-blue-100 dark:bg-blue-900" : "bg-stone-100 dark:bg-stone-800"}`}>
                  <Text className={`text-[10px] font-medium ${a.role === "lead" ? "text-blue-700 dark:text-blue-300" : "text-stone-600 dark:text-stone-400"}`}>
                    {a.role}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>
      )}

      {/* Description */}
      {job.description && (
        <Animated.View className="mb-3" entering={FadeInDown.delay(360).duration(400).springify()}>
          <Card>
            <View className="flex-row items-center gap-2 mb-2">
              <Info size={16} color="#78716C" />
              <Text className="text-sm font-medium text-stone-500 uppercase tracking-wide">
                Description
              </Text>
            </View>
            <Text className="text-sm text-stone-700 dark:text-stone-300">
              {job.description}
            </Text>
          </Card>
        </Animated.View>
      )}
    </ScrollView>
  );
}
