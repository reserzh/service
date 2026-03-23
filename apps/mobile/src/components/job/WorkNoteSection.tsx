import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { Plus, Send, Mic } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PendingSyncBadge } from "@/components/ui/PendingSyncBadge";
import { useAddJobNote } from "@/hooks/useJobs";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useVoiceNote } from "@/hooks/useVoiceNote";
import type { JobWithRelations } from "@/types/models";

interface WorkNoteSectionProps {
  job: JobWithRelations;
}

export function WorkNoteSection({ job }: WorkNoteSectionProps) {
  const addNote = useAddJobNote();
  const { isOffline } = useNetworkStatus();
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const { startListening, isListening } = useVoiceNote({
    onResult: (text) => setNoteText((prev) => (prev ? `${prev} ${text}` : text)),
  });

  const pendingNotes = job.notes.filter((n) => n.id.startsWith("temp_")).length;

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

  return (
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
            <Pressable
              onPress={startListening}
              className={`absolute right-2 bottom-2 items-center justify-center rounded-full w-10 h-10 ${
                isListening ? "bg-red-500" : "bg-orange-600"
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
  );
}
