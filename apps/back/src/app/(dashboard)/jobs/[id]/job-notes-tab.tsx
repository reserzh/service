"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { showToast } from "@/lib/toast";
import { addJobNoteAction } from "@/actions/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { JobData } from "./job-detail-content";

interface JobNotesTabProps {
  job: JobData;
}

export function JobNotesTab({ job }: JobNotesTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [noteText, setNoteText] = useState("");

  function handleAddNote() {
    if (!noteText.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("content", noteText);
      fd.set("isInternal", "true");
      const result = await addJobNoteAction(job.id, fd);
      if (result.error) {
        showToast.error("Action failed", result.error);
      } else {
        showToast.created("Note");
        setNoteText("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Add note form */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Textarea
            placeholder="Add a note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={isPending || !noteText.trim()}
            >
              {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {job.notes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No notes yet.
        </p>
      ) : (
        <div className="space-y-3">
          {job.notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">
                    {note.userFirstName} {note.userLastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  {note.isInternal && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Internal
                    </Badge>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
