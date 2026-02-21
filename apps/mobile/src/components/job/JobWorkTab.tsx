import { View, Text, ScrollView, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { Plus, Send, DollarSign, ChevronRight } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { JobChecklist } from "./JobChecklist";
import { TimeTracker } from "./TimeTracker";
import { useAddJobNote } from "@/hooks/useJobs";
import { formatCurrency } from "@/lib/format";
import { VALID_TRANSITIONS } from "@/lib/constants";
import type { JobWithRelations, JobStatus, JobChecklistItem } from "@/types/models";

interface JobWorkTabProps {
  job: JobWithRelations;
  onStatusChange: (status: JobStatus) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
}

export function JobWorkTab({ job, onStatusChange, onStartTimer, onStopTimer }: JobWorkTabProps) {
  const addNote = useAddJobNote();
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const lineItemTotal = job.lineItems.reduce(
    (sum, li) => sum + parseFloat(li.total),
    0
  );

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addNote.mutateAsync({ id: job.id, content: noteText.trim() });
      setNoteText("");
      setShowNoteInput(false);
      Toast.show({ type: "success", text1: "Note added" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to add note" });
    }
  };

  const checklistItems: JobChecklistItem[] = job.checklist ?? [];

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

      {/* Checklist */}
      {checklistItems.length > 0 && (
        <Card className="mb-3">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Checklist
          </Text>
          <JobChecklist
            items={checklistItems}
            onToggle={() => {}}
          />
        </Card>
      )}

      {/* Line Items */}
      <Card className="mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Line Items
          </Text>
          <View className="flex-row items-center gap-1">
            <DollarSign size={14} color="#64748b" />
            <Text className="text-sm font-semibold text-slate-900 dark:text-white">
              {formatCurrency(lineItemTotal)}
            </Text>
          </View>
        </View>
        {job.lineItems.length > 0 ? (
          job.lineItems.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800"
            >
              <View className="flex-1 mr-3">
                <Text className="text-sm text-slate-900 dark:text-white" numberOfLines={1}>
                  {item.description}
                </Text>
                <Text className="text-xs text-slate-500">
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <Text className="text-sm font-medium text-slate-900 dark:text-white">
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-sm text-slate-400 italic">No line items yet</Text>
        )}
      </Card>

      {/* Notes */}
      <Card className="mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Notes ({job.notes.length})
          </Text>
          <Pressable
            onPress={() => setShowNoteInput(!showNoteInput)}
            className="flex-row items-center gap-1"
          >
            <Plus size={14} color="#3b82f6" />
            <Text className="text-sm font-medium text-blue-600">Add</Text>
          </Pressable>
        </View>

        {showNoteInput && (
          <View className="mb-3 gap-2">
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Write a note..."
              placeholderTextColor="#94a3b8"
              multiline
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white min-h-[80px]"
              textAlignVertical="top"
            />
            <View className="flex-row justify-end gap-2">
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setShowNoteInput(false);
                  setNoteText("");
                }}
              />
              <Button
                title="Save"
                size="sm"
                onPress={handleAddNote}
                loading={addNote.isPending}
                disabled={!noteText.trim()}
                icon={<Send size={14} color="#fff" />}
              />
            </View>
          </View>
        )}

        {job.notes.length > 0
          ? job.notes.slice(0, 3).map((note) => (
              <View
                key={note.id}
                className="py-2 border-b border-slate-100 dark:border-slate-800"
              >
                <Text className="text-sm text-slate-700 dark:text-slate-300" numberOfLines={2}>
                  {note.content}
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  {note.user
                    ? `${note.user.firstName} ${note.user.lastName}`
                    : "Team"}
                </Text>
              </View>
            ))
          : !showNoteInput && (
              <Text className="text-sm text-slate-400 italic">No notes yet</Text>
            )}
      </Card>

      {/* Status Transitions */}
      {VALID_TRANSITIONS[job.status].length > 0 && (
        <Card>
          <Text className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Change Status
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {VALID_TRANSITIONS[job.status].map((status) => (
              <Pressable
                key={status}
                onPress={() => onStatusChange(status as JobStatus)}
                className="flex-row items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 active:bg-slate-50 dark:active:bg-slate-800"
              >
                <Text className="text-sm text-slate-600 dark:text-slate-400">
                  {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
                <ChevronRight size={14} color="#94a3b8" />
              </Pressable>
            ))}
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
