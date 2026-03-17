import { View, Text, ScrollView, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { Plus, Send, DollarSign, ChevronRight, Mic } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PendingSyncBadge } from "@/components/ui/PendingSyncBadge";
import { JobChecklist } from "./JobChecklist";
import { TimeTracker } from "./TimeTracker";
import { useAddJobNote, useAddJobLineItem, useToggleChecklistItem } from "@/hooks/useJobs";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useVoiceNote } from "@/hooks/useVoiceNote";
import { formatCurrency } from "@/lib/format";
import { VALID_TRANSITIONS } from "@/lib/constants";
import type { JobWithRelations, JobStatus } from "@/types/models";

interface JobWorkTabProps {
  job: JobWithRelations;
  onStatusChange: (status: JobStatus) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
}

const LINE_ITEM_TYPES: { key: string; label: string }[] = [
  { key: "service", label: "Service" },
  { key: "material", label: "Material" },
  { key: "labor", label: "Labor" },
  { key: "other", label: "Other" },
];

export function JobWorkTab({ job, onStatusChange, onStartTimer, onStopTimer }: JobWorkTabProps) {
  const addNote = useAddJobNote();
  const addLineItem = useAddJobLineItem();
  const toggleChecklist = useToggleChecklistItem();
  const { isOffline } = useNetworkStatus();
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showLineItemInput, setShowLineItemInput] = useState(false);
  const [lineItemDesc, setLineItemDesc] = useState("");
  const [lineItemQty, setLineItemQty] = useState("1");
  const [lineItemPrice, setLineItemPrice] = useState("");
  const [lineItemType, setLineItemType] = useState("labor");
  const { startListening, isListening } = useVoiceNote({
    onResult: (text) => setNoteText((prev) => (prev ? `${prev} ${text}` : text)),
  });

  const lineItemTotal = job.lineItems.reduce(
    (sum, li) => sum + parseFloat(li.total),
    0
  );

  // Count pending (optimistic) items
  const pendingNotes = job.notes.filter((n) => n.id.startsWith("temp_")).length;
  const pendingLineItems = job.lineItems.filter((li) => li.id.startsWith("temp_")).length;

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addNote.mutateAsync({ id: job.id, content: noteText.trim() });
      setNoteText("");
      setShowNoteInput(false);
      Toast.show({
        type: "success",
        text1: isOffline ? "Note saved" : "Note added",
        text2: isOffline ? "Will sync when online" : undefined,
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to add note" });
    }
  };

  const checklistItems = job.checklist ?? [];

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
          <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
            Checklist
          </Text>
          <JobChecklist
            items={checklistItems}
            onToggle={(itemId, completed) => {
              toggleChecklist.mutate({ jobId: job.id, itemId, completed });
            }}
          />
        </Card>
      )}

      {/* Line Items */}
      <Card className="mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Line Items
            </Text>
            {pendingLineItems > 0 && (
              <PendingSyncBadge count={pendingLineItems} />
            )}
          </View>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <DollarSign size={14} color="#78716C" />
              <Text className="text-sm font-semibold text-stone-900 dark:text-white">
                {formatCurrency(lineItemTotal)}
              </Text>
            </View>
            <Pressable
              onPress={() => setShowLineItemInput(!showLineItemInput)}
              className="flex-row items-center gap-1"
            >
              <Plus size={14} color="#EA580C" />
              <Text className="text-sm font-medium text-orange-600 dark:text-orange-400">Add</Text>
            </Pressable>
          </View>
        </View>

        {showLineItemInput && (
          <View className="mb-3 gap-2 p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <TextInput
              value={lineItemDesc}
              onChangeText={setLineItemDesc}
              placeholder="Description"
              placeholderTextColor="#A8A29E"
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-base text-stone-900 dark:text-white"
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Text className="text-xs text-stone-400 mb-0.5">Qty</Text>
                <TextInput
                  value={lineItemQty}
                  onChangeText={setLineItemQty}
                  placeholder="1"
                  placeholderTextColor="#A8A29E"
                  keyboardType="decimal-pad"
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-base text-stone-900 dark:text-white"
                />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-stone-400 mb-0.5">Unit Price</Text>
                <TextInput
                  value={lineItemPrice}
                  onChangeText={setLineItemPrice}
                  placeholder="0.00"
                  placeholderTextColor="#A8A29E"
                  keyboardType="decimal-pad"
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 text-base text-stone-900 dark:text-white"
                />
              </View>
            </View>
            <View className="flex-row gap-1.5">
              {LINE_ITEM_TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setLineItemType(t.key)}
                  className={`px-2.5 py-1 rounded-full ${
                    lineItemType === t.key
                      ? "bg-orange-600"
                      : "bg-stone-200 dark:bg-stone-700"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      lineItemType === t.key
                        ? "text-white"
                        : "text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row justify-end gap-2">
              <Button
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => {
                  setShowLineItemInput(false);
                  setLineItemDesc("");
                  setLineItemQty("1");
                  setLineItemPrice("");
                  setLineItemType("labor");
                }}
              />
              <Button
                title="Save"
                size="sm"
                onPress={async () => {
                  if (!lineItemDesc.trim() || !lineItemPrice) return;
                  try {
                    await addLineItem.mutateAsync({
                      id: job.id,
                      item: {
                        description: lineItemDesc.trim(),
                        quantity: parseFloat(lineItemQty) || 1,
                        unitPrice: parseFloat(lineItemPrice) || 0,
                        type: lineItemType as "service" | "material" | "labor" | "other",
                      },
                    });
                    Toast.show({
                      type: "success",
                      text1: isOffline ? "Line item saved" : "Line item added",
                      text2: isOffline ? "Will sync when online" : undefined,
                    });
                    setShowLineItemInput(false);
                    setLineItemDesc("");
                    setLineItemQty("1");
                    setLineItemPrice("");
                    setLineItemType("labor");
                  } catch {
                    Toast.show({ type: "error", text1: "Failed to add line item" });
                  }
                }}
                loading={addLineItem.isPending}
                disabled={!lineItemDesc.trim() || !lineItemPrice}
                icon={<Plus size={14} color="#fff" />}
              />
            </View>
          </View>
        )}

        {job.lineItems.length > 0 ? (
          job.lineItems.map((item) => (
            <View
              key={item.id}
              className="flex-row items-center justify-between py-2 border-b border-stone-100 dark:border-stone-700"
            >
              <View className="flex-1 mr-3">
                <Text className="text-base text-stone-900 dark:text-white" numberOfLines={1}>
                  {item.description}
                </Text>
                <Text className="text-xs text-stone-500">
                  {item.quantity} x {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-medium text-stone-900 dark:text-white">
                  {formatCurrency(item.total)}
                </Text>
                {item.id.startsWith("temp_") && (
                  <PendingSyncBadge count={1} compact />
                )}
              </View>
            </View>
          ))
        ) : (
          <Text className="text-base text-stone-400 italic">No line items yet</Text>
        )}
      </Card>

      {/* Notes */}
      <Card className="mb-3">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Notes ({job.notes.length})
            </Text>
            {pendingNotes > 0 && (
              <PendingSyncBadge count={pendingNotes} />
            )}
          </View>
          <Pressable
            onPress={() => setShowNoteInput(!showNoteInput)}
            className="flex-row items-center gap-1"
          >
            <Plus size={14} color="#EA580C" />
            <Text className="text-sm font-medium text-orange-600 dark:text-orange-400">Add</Text>
          </Pressable>
        </View>

        {showNoteInput && (
          <View className="mb-3 gap-2">
            <View className="relative">
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Write a note..."
                placeholderTextColor="#A8A29E"
                multiline
                className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-4 py-4 pr-14 text-base min-h-[100px] text-stone-900 dark:text-white"
                textAlignVertical="top"
              />
              {/* Voice-to-text button */}
              <Pressable
                onPress={startListening}
                className={`absolute right-2 bottom-2 items-center justify-center rounded-full w-10 h-10 ${
                  isListening ? "bg-red-500" : "bg-blue-500"
                }`}
                accessibilityLabel="Voice to text"
                accessibilityRole="button"
              >
                <Mic size={18} color="#fff" />
              </Pressable>
            </View>
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
                className="py-2 border-b border-stone-100 dark:border-stone-700"
              >
                <View className="flex-row items-start gap-2">
                  <Text className="text-base text-stone-700 dark:text-stone-300 flex-1" numberOfLines={2}>
                    {note.content}
                  </Text>
                  {note.id.startsWith("temp_") && (
                    <PendingSyncBadge count={1} compact />
                  )}
                </View>
                <Text className="text-xs text-stone-400 mt-0.5">
                  {note.user
                    ? `${note.user.firstName} ${note.user.lastName}`
                    : "Team"}
                </Text>
              </View>
            ))
          : !showNoteInput && (
              <Text className="text-base text-stone-400 italic">No notes yet</Text>
            )}
      </Card>

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
                className="flex-row items-center gap-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3.5 active:bg-stone-50 dark:active:bg-stone-800"
              >
                <Text className="text-base text-stone-600 dark:text-stone-400">
                  {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
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
