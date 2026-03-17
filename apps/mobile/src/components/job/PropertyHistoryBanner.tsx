import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Clock, Key, AlertTriangle, Image, FileText } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { propertiesApi } from "@/api/endpoints/properties";
import { useAuthStore } from "@/stores/auth";
import { formatDistanceToNow } from "date-fns";

interface PropertyHistoryBannerProps {
  propertyId: string;
  assignedTo: string | null;
}

export function PropertyHistoryBanner({ propertyId, assignedTo }: PropertyHistoryBannerProps) {
  const { user } = useAuthStore();

  const { data } = useQuery({
    queryKey: ["property-history", propertyId],
    queryFn: () => propertiesApi.getHistory(propertyId, 3),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

  const history = data?.data;
  if (!history) return null;

  const { property, recentJobs } = history;
  const hasAccessInfo = property.gateCode || property.accessNotes || (property.obstacles && property.obstacles.length > 0);
  const lastJob = recentJobs[0];

  // Check if current user hasn't been to this property before
  const isSubstitute = assignedTo === user?.userId && lastJob &&
    lastJob.assignedFirstName && lastJob.assignedLastName &&
    `${user?.firstName} ${user?.lastName}` !== `${lastJob.assignedFirstName} ${lastJob.assignedLastName}`;

  if (!hasAccessInfo && !lastJob) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 mb-3">
      {/* Access Info */}
      {hasAccessInfo && (
        <View className="mb-3">
          <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">
            Property Access
          </Text>
          {property.gateCode && (
            <View className="flex-row items-center gap-2 mb-1">
              <Key size={14} color="#d97706" />
              <Text className="text-sm font-medium text-stone-800 dark:text-stone-200">
                Gate Code: {property.gateCode}
              </Text>
            </View>
          )}
          {property.accessNotes && (
            <Text className="text-sm text-stone-600 dark:text-stone-400 mb-1">
              {property.accessNotes}
            </Text>
          )}
          {property.obstacles && property.obstacles.length > 0 && (
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={14} color="#d97706" />
              <Text className="text-sm text-stone-600 dark:text-stone-400">
                Obstacles: {property.obstacles.join(", ")}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Last Visit Summary */}
      {lastJob && (
        <View>
          <View className="flex-row items-center gap-2 mb-2">
            <Clock size={14} color="#d97706" />
            <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              Last Visit
              {isSubstitute && " (Different Tech)"}
            </Text>
          </View>

          <Text className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
            {lastJob.summary}
            {lastJob.completedAt && (
              <Text className="text-stone-500"> — {formatDistanceToNow(new Date(lastJob.completedAt), { addSuffix: true })}</Text>
            )}
          </Text>

          {lastJob.assignedFirstName && (
            <Text className="text-xs text-stone-500 dark:text-stone-400 mb-1">
              By {lastJob.assignedFirstName} {lastJob.assignedLastName}
            </Text>
          )}

          {/* Notes from last visit */}
          {lastJob.notes.length > 0 && (
            <View className="mt-1">
              {lastJob.notes.slice(0, 2).map((note, i) => (
                <View key={i} className="flex-row items-start gap-1.5 mb-0.5">
                  <FileText size={12} color="#A8A29E" style={{ marginTop: 2 }} />
                  <Text className="text-sm text-stone-600 dark:text-stone-400 flex-1" numberOfLines={2}>
                    {note.content}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Quick stats */}
          <View className="flex-row items-center gap-4 mt-2">
            {lastJob.photoCount > 0 && (
              <View className="flex-row items-center gap-1">
                <Image size={12} color="#A8A29E" />
                <Text className="text-xs text-stone-500">{lastJob.photoCount} photos</Text>
              </View>
            )}
            {lastJob.checklistSummary.total > 0 && (
              <Text className="text-xs text-stone-500">
                Checklist: {lastJob.checklistSummary.completed}/{lastJob.checklistSummary.total}
              </Text>
            )}
          </View>
        </View>
      )}
    </Card>
  );
}
