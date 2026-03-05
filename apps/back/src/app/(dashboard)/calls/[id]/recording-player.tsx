"use client";

import { Badge } from "@/components/ui/badge";

interface Recording {
  id: string;
  recordingSid: string;
  duration: number | null;
  status: string;
  transcriptionText: string | null;
  transcriptionStatus: string;
  createdAt: Date | string;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function RecordingPlayer({
  callId,
  recording,
}: {
  callId: string;
  recording: Recording;
}) {
  const audioUrl = `/api/v1/calls/${callId}/recordings/${recording.id}/audio`;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={recording.status === "completed" ? "default" : "secondary"}
          >
            {recording.status}
          </Badge>
          {recording.duration !== null && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(recording.duration)}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(recording.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>

      {recording.status === "completed" && (
        <audio controls preload="none" className="w-full h-10">
          <source src={audioUrl} type="audio/mpeg" />
          Your browser does not support audio playback.
        </audio>
      )}

      {recording.transcriptionText && (
        <div className="rounded-md bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Transcription
          </p>
          <p className="text-sm whitespace-pre-wrap">
            {recording.transcriptionText}
          </p>
        </div>
      )}

      {recording.transcriptionStatus === "processing" && (
        <p className="text-xs text-muted-foreground italic">
          Transcription in progress...
        </p>
      )}
    </div>
  );
}
