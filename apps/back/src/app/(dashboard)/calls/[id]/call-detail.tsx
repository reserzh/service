"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  User,
  Briefcase,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateCallNotesAction } from "@/actions/calls";
import { RecordingPlayer } from "./recording-player";
import {
  CALL_DIRECTION_LABELS,
  CALL_STATUS_LABELS,
} from "@fieldservice/api-types/constants";

interface Recording {
  id: string;
  recordingSid: string;
  duration: number | null;
  status: string;
  transcriptionText: string | null;
  transcriptionStatus: string;
  createdAt: Date | string;
}

interface CallData {
  id: string;
  callSid: string;
  direction: string;
  fromNumber: string;
  toNumber: string;
  status: string;
  duration: number | null;
  notes: string | null;
  startedAt: Date | string | null;
  endedAt: Date | string | null;
  createdAt: Date | string;
  customer: { id: string; firstName: string; lastName: string; phone: string } | null;
  user: { id: string; firstName: string; lastName: string } | null;
  job: { id: string; jobNumber: string; summary: string } | null;
  recordings: Recording[];
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(date: string | Date | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CallDetail({ call }: { call: CallData }) {
  const [notes, setNotes] = useState(call.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveNotes = async () => {
    setSaving(true);
    const result = await updateCallNotesAction(call.id, notes);
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Call Metadata */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {call.direction === "inbound" ? (
                <PhoneIncoming className="h-5 w-5 text-green-600" />
              ) : (
                <PhoneOutgoing className="h-5 w-5 text-blue-600" />
              )}
              <CardTitle className="text-lg">
                {CALL_DIRECTION_LABELS[call.direction as keyof typeof CALL_DIRECTION_LABELS]} Call
              </CardTitle>
              <Badge>
                {CALL_STATUS_LABELS[call.status as keyof typeof CALL_STATUS_LABELS] ?? call.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-sm font-medium">{call.fromNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="text-sm font-medium">{call.toNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-medium">{formatDuration(call.duration)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Call SID</p>
                <p className="text-sm font-mono text-muted-foreground">{call.callSid}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="text-sm">{formatDate(call.startedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ended</p>
                <p className="text-sm">{formatDate(call.endedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recordings */}
        {call.recordings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recordings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {call.recordings.map((rec) => (
                <RecordingPlayer
                  key={rec.id}
                  callId={call.id}
                  recording={rec}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this call..."
              rows={4}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={saving}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {saving ? "Saving..." : "Save Notes"}
              </Button>
              {saved && (
                <span className="text-sm text-green-600">Saved</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {call.customer ? (
              <Link
                href={`/customers/${call.customer.id}`}
                className="text-sm font-medium hover:underline"
              >
                {call.customer.firstName} {call.customer.lastName}
                <p className="text-xs text-muted-foreground font-normal">
                  {call.customer.phone}
                </p>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                No customer matched
              </p>
            )}
          </CardContent>
        </Card>

        {/* Job */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4" />
              Linked Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            {call.job ? (
              <Link
                href={`/jobs/${call.job.id}`}
                className="text-sm font-medium hover:underline"
              >
                #{call.job.jobNumber}
                <p className="text-xs text-muted-foreground font-normal">
                  {call.job.summary}
                </p>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                No job linked
              </p>
            )}
          </CardContent>
        </Card>

        {/* Staff */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Staff Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            {call.user ? (
              <p className="text-sm font-medium">
                {call.user.firstName} {call.user.lastName}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Unassigned</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
