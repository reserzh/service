import { View, Text, ScrollView, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { JobChecklist } from "./JobChecklist";
import { TimeTracker } from "./TimeTracker";
import { WorkNoteSection } from "./WorkNoteSection";
import { WorkLineItemSection } from "./WorkLineItemSection";
import { useToggleChecklistItem } from "@/hooks/useJobs";
import { VALID_TRANSITIONS } from "@/lib/constants";
import type { JobWithRelations, JobStatus } from "@/types/models";

interface JobWorkTabProps {
  job: JobWithRelations;
  onStatusChange: (status: JobStatus) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
}

export function JobWorkTab({ job, onStatusChange, onStartTimer, onStopTimer }: JobWorkTabProps) {
  const toggleChecklist = useToggleChecklistItem();
  const allItems = job.checklist ?? [];
  const equipmentItems = allItems.filter((i) => i.itemType === "equipment");
  const checklistItems = allItems.filter((i) => i.itemType !== "equipment");

  const handleToggle = (itemId: string, completed: boolean) => {
    toggleChecklist.mutate({ jobId: job.id, itemId, completed });
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 pt-3 pb-8">
      {/* Time Tracker */}
      <View className="mb-3">
        <TimeTracker
          actualStart={job.actualStart}
          actualEnd={job.actualEnd}
          onStart={onStartTimer}
          onStop={onStopTimer}
        />
      </View>

      {/* Packing List (equipment items first) */}
      {equipmentItems.length > 0 && (
        <Card className="mb-3">
          <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
            Packing List
          </Text>
          <JobChecklist
            items={equipmentItems}
            onToggle={handleToggle}
            type="equipment"
          />
        </Card>
      )}

      {/* Checklist */}
      {checklistItems.length > 0 && (
        <Card className="mb-3">
          <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
            Checklist
          </Text>
          <JobChecklist
            items={checklistItems}
            onToggle={handleToggle}
          />
        </Card>
      )}

      {/* Line Items */}
      <WorkLineItemSection job={job} />

      {/* Notes */}
      <WorkNoteSection job={job} />

      {/* Status Transitions */}
      {VALID_TRANSITIONS[job.status].length > 0 && (
        <Card>
          <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
            Change Status
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {VALID_TRANSITIONS[job.status].map((status) => (
              <Pressable
                key={status}
                onPress={() => onStatusChange(status as JobStatus)}
                className="flex-row items-center gap-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3.5 min-h-[44px] active:bg-stone-50 dark:active:bg-stone-800"
              >
                <Text className="text-base text-stone-600 dark:text-stone-400">
                  {status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                </Text>
                <ChevronRight size={14} color="#A8A29E" />
              </Pressable>
            ))}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
