import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  Phone,
  Mail,
  MapPin,
  Tag,
  Home,
  Wrench,
  Clock,
  Shield,
} from "lucide-react-native";
import { useCustomer } from "@/hooks/useCustomers";
import { useJobs } from "@/hooks/useJobs";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ErrorFallback } from "@/components/common/ErrorFallback";
import { Avatar } from "@/components/ui/Avatar";
import { JobStatusBadge } from "@/components/job/JobStatusBadge";
import { NavigateButton } from "@/components/common/NavigateButton";
import { formatPhone, getInitials, formatCustomerName, formatDate, formatAddress } from "@/lib/format";
import type { Property, Equipment, Job, JobStatus } from "@/types/models";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useCustomer(id);
  const customer = data?.data;

  const { data: jobsData } = useJobs({ customerId: id, pageSize: 10 });
  const jobs = jobsData?.data ?? [];

  if (isError) {
    return <ErrorFallback message="Failed to load customer details" onRetry={() => refetch()} />;
  }

  if (isLoading || !customer) {
    return <LoadingScreen />;
  }

  const properties = customer.properties ?? [];
  const equipment = customer.equipment ?? [];

  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Profile header */}
      <View className="items-center py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <Avatar
          initials={getInitials(customer.firstName, customer.lastName)}
          size="lg"
          color="#3b82f6"
        />
        <Text className="text-xl font-bold text-slate-900 dark:text-white mt-3">
          {formatCustomerName(customer)}
        </Text>
        {customer.companyName && (
          <Text className="text-sm text-slate-500 mt-0.5">{customer.companyName}</Text>
        )}
        <View className="flex-row items-center gap-2 mt-2">
          <Badge
            label={customer.type === "commercial" ? "Commercial" : "Residential"}
            bgClass={customer.type === "commercial" ? "bg-purple-100" : "bg-blue-100"}
            textClass={customer.type === "commercial" ? "text-purple-700" : "text-blue-700"}
          />
        </View>
      </View>

      {/* Contact actions */}
      <View className="flex-row gap-3 px-4 py-4">
        <Pressable
          onPress={() => Linking.openURL(`tel:${customer.phone}`)}
          className="flex-1 flex-row items-center justify-center gap-2 bg-emerald-600 py-3 rounded-xl active:bg-emerald-700"
        >
          <Phone size={18} color="#fff" />
          <Text className="text-base font-semibold text-white">Call</Text>
        </Pressable>
        {customer.email && (
          <Pressable
            onPress={() => Linking.openURL(`mailto:${customer.email}`)}
            className="flex-1 flex-row items-center justify-center gap-2 bg-blue-600 py-3 rounded-xl active:bg-blue-700"
          >
            <Mail size={18} color="#fff" />
            <Text className="text-base font-semibold text-white">Email</Text>
          </Pressable>
        )}
      </View>

      {/* Contact info */}
      <View className="px-4 mb-3">
        <Card>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Contact Info
          </Text>
          <InfoRow icon={<Phone size={16} color="#64748b" />} label="Phone" value={formatPhone(customer.phone)} />
          {customer.altPhone && (
            <InfoRow icon={<Phone size={16} color="#64748b" />} label="Alt Phone" value={formatPhone(customer.altPhone)} />
          )}
          {customer.email && (
            <InfoRow icon={<Mail size={16} color="#64748b" />} label="Email" value={customer.email} />
          )}
          {customer.source && (
            <InfoRow icon={<Tag size={16} color="#64748b" />} label="Source" value={customer.source} />
          )}
        </Card>
      </View>

      {/* Notes */}
      {customer.notes && (
        <View className="px-4 mb-3">
          <Card>
            <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Notes
            </Text>
            <Text className="text-sm text-slate-700 dark:text-slate-300">
              {customer.notes}
            </Text>
          </Card>
        </View>
      )}

      {/* Properties */}
      {properties.length > 0 && (
        <View className="px-4 mb-3">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1">
            Properties
          </Text>
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </View>
      )}

      {/* Equipment */}
      {equipment.length > 0 && (
        <View className="px-4 mb-3">
          <Card>
            <View className="flex-row items-center gap-2 mb-3">
              <Wrench size={14} color="#64748b" />
              <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Equipment
              </Text>
            </View>
            {equipment.map((item, index) => (
              <EquipmentRow key={item.id} item={item} isLast={index === equipment.length - 1} />
            ))}
          </Card>
        </View>
      )}

      {/* Job History */}
      {jobs.length > 0 && (
        <View className="px-4 mb-3">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 px-1">
            Job History
          </Text>
          {jobs.map((job) => (
            <JobHistoryCard key={job.id} job={job} />
          ))}
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      {icon}
      <View>
        <Text className="text-xs text-slate-500">{label}</Text>
        <Text className="text-sm text-slate-900 dark:text-white">{value}</Text>
      </View>
    </View>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const address = formatAddress(property);

  return (
    <View className="mb-2">
      <Card>
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Home size={14} color="#64748b" />
            <Text className="text-sm font-medium text-slate-900 dark:text-white">
              {property.name || "Service Address"}
            </Text>
          </View>
          {property.isPrimary && (
            <Badge label="Primary" bgClass="bg-blue-100" textClass="text-blue-700" />
          )}
        </View>
        <View className="flex-row items-start gap-2 mb-2">
          <MapPin size={14} color="#94a3b8" className="mt-0.5" />
          <Text className="text-sm text-slate-600 dark:text-slate-400 flex-1">
            {address}
          </Text>
        </View>
        {property.accessNotes && (
          <Text className="text-xs text-slate-500 mb-2">
            Access: {property.accessNotes}
          </Text>
        )}
        <NavigateButton
          address={address}
          latitude={property.latitude}
          longitude={property.longitude}
          size="sm"
        />
      </Card>
    </View>
  );
}

function EquipmentRow({ item, isLast }: { item: Equipment; isLast: boolean }) {
  return (
    <View className={`py-2 ${!isLast ? "border-b border-slate-100 dark:border-slate-800" : ""}`}>
      <Text className="text-sm font-medium text-slate-900 dark:text-white">
        {item.type}
        {item.brand ? ` · ${item.brand}` : ""}
        {item.model ? ` ${item.model}` : ""}
      </Text>
      {item.serialNumber && (
        <Text className="text-xs text-slate-500 mt-0.5">S/N: {item.serialNumber}</Text>
      )}
      <View className="flex-row items-center gap-4 mt-1">
        {item.installDate && (
          <View className="flex-row items-center gap-1">
            <Clock size={11} color="#94a3b8" />
            <Text className="text-xs text-slate-400">Installed {formatDate(item.installDate)}</Text>
          </View>
        )}
        {item.warrantyExpiry && (
          <View className="flex-row items-center gap-1">
            <Shield size={11} color="#94a3b8" />
            <Text className="text-xs text-slate-400">Warranty {formatDate(item.warrantyExpiry)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function JobHistoryCard({ job }: { job: Job }) {
  return (
    <View className="mb-2">
      <Card onPress={() => router.push(`/(tabs)/jobs/${job.id}`)}>
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {job.jobNumber} · {job.jobType}
          </Text>
          <JobStatusBadge status={job.status as JobStatus} />
        </View>
        <Text className="text-sm font-medium text-slate-900 dark:text-white" numberOfLines={1}>
          {job.summary}
        </Text>
        <Text className="text-xs text-slate-500 mt-1">
          {formatDate(job.scheduledStart ?? job.createdAt)}
        </Text>
      </Card>
    </View>
  );
}
