import { View, Text, ScrollView } from "react-native";
import { MessageSquare, Clock } from "lucide-react-native";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/format";
import type { JobWithRelations } from "@/types/models";

interface JobHistoryTabProps {
  job: JobWithRelations;
}

export function JobHistoryTab({ job }: JobHistoryTabProps) {
  const entries = [...job.notes]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (entries.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8 py-16">
        <View className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 items-center justify-center mb-4">
          <Clock size={28} color="#A8A29E" />
        </View>
        <Text className="text-lg font-semibold text-stone-900 dark:text-white text-center mb-1">
          No activity yet
        </Text>
        <Text className="text-sm text-stone-500 dark:text-stone-400 text-center">
          Notes and updates will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pt-3 pb-8">
      {/* Timeline */}
      <View className="pl-4">
        {entries.map((note, index) => (
          <View key={note.id} className="flex-row mb-0">
            {/* Timeline dot + line */}
            <View className="items-center mr-3">
              <View className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />
              {index < entries.length - 1 && (
                <View className="w-0.5 flex-1 bg-stone-200 dark:bg-stone-700 mt-1" />
              )}
            </View>

            {/* Content */}
            <View className="flex-1 pb-4">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-xs font-medium text-stone-600 dark:text-stone-400">
                  {note.user
                    ? `${note.user.firstName} ${note.user.lastName}`
                    : "Team"}
                </Text>
                {note.isInternal && (
                  <Badge
                    label="Internal"
                    bgClass="bg-stone-100"
                    textClass="text-stone-500"
                  />
                )}
              </View>
              <Text className="text-sm text-stone-900 dark:text-white mb-1">
                {note.content}
              </Text>
              <Text className="text-xs text-stone-400">
                {formatRelativeTime(note.createdAt)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
