"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { showToast } from "@/lib/toast";
import {
  changeJobStatusAction,
  deleteLineItemAction,
} from "@/actions/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  PenLine,
  Loader2,
  CheckSquare,
} from "lucide-react";
import type { JobCostingResult } from "@/lib/services/job-costing";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { JobStatusBar } from "./job-status-bar";
import { JobInfoCards } from "./job-info-cards";
import { JobLineItemsTab } from "./job-line-items-tab";
import { JobNotesTab } from "./job-notes-tab";
import { JobChecklistTab } from "./job-checklist-tab";
import { JobPhotosTab } from "./job-photos-tab";
import { JobCostingCard } from "./job-costing-card";

// ---- Status config ----

const statusConfig: Record<string, { label: string }> = {
  new: { label: "New" },
  scheduled: { label: "Scheduled" },
  dispatched: { label: "Dispatched" },
  en_route: { label: "En Route" },
  in_progress: { label: "In Progress" },
  completed: { label: "Completed" },
  canceled: { label: "Canceled" },
};

const nextStatusMap: Record<string, { status: string; label: string } | null> = {
  new: { status: "scheduled", label: "Schedule" },
  scheduled: { status: "dispatched", label: "Dispatch" },
  dispatched: { status: "en_route", label: "En Route" },
  en_route: { status: "in_progress", label: "Start Work" },
  in_progress: { status: "completed", label: "Complete" },
  completed: null,
  canceled: { status: "new", label: "Reopen" },
};

// ---- Types ----

export interface JobData {
  id: string;
  jobNumber: string;
  status: string;
  priority: string;
  jobType: string;
  serviceType: string | null;
  summary: string;
  description: string | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  actualStart: Date | null;
  actualEnd: Date | null;
  completedAt: Date | null;
  dispatchedAt: Date | null;
  startLatitude: string | null;
  startLongitude: string | null;
  endLatitude: string | null;
  endLongitude: string | null;
  totalAmount: string | null;
  internalNotes: string | null;
  customerNotes: string | null;
  createdAt: Date;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
  property: {
    id: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    latitude: string | null;
    longitude: string | null;
    state: string;
    zip: string;
    lotSizeSqft: number | null;
    lawnAreaSqft: number | null;
    propertyMetadata: import("@fieldservice/api-types/constants").PropertyMetadata | null;
  };
  assignedUser: {
    id: string;
    firstName: string;
    lastName: string;
    color: string;
    phone: string | null;
  } | null;
  lineItems: {
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
    type: string;
    sortOrder: number;
  }[];
  notes: {
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: Date;
    userId: string;
    userFirstName: string | null;
    userLastName: string | null;
  }[];
  photos: { id: string; storagePath: string; caption: string | null; photoType: string; createdAt: Date }[];
  signatures: { id: string; signerName: string; signerRole: string; createdAt: Date }[];
  checklist: {
    id: string;
    label: string;
    completed: boolean;
    completedAt: Date | null;
    completedBy: string | null;
    groupName: string | null;
    groupSortOrder: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  assignments: {
    id: string;
    userId: string;
    role: string;
    user: { id: string; firstName: string; lastName: string; color: string };
  }[];
}

interface Props {
  job: JobData;
  userRole: string;
  costing?: JobCostingResult | null;
}

export function JobDetailContent({ job, userRole, costing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  const nextAction = nextStatusMap[job.status];
  const completedCount = job.checklist.filter((i) => i.completed).length;

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await changeJobStatusAction(
        job.id,
        newStatus as "new" | "scheduled" | "dispatched" | "en_route" | "in_progress" | "completed" | "canceled"
      );
      if (result.error) {
        showToast.error("Status change failed", result.error);
      } else {
        showToast.success(`Job ${statusConfig[newStatus]?.label ?? newStatus}`, "Status updated successfully");
        router.refresh();
      }
    });
  }

  function handleDeleteLineItem(itemId: string) {
    setDeleteItemId(itemId);
  }

  function confirmDeleteLineItem() {
    if (!deleteItemId) return;
    startTransition(async () => {
      const result = await deleteLineItemAction(job.id, deleteItemId);
      if (result.error) {
        showToast.error("Action failed", result.error);
      } else {
        showToast.deleted("Line item");
        router.refresh();
      }
      setDeleteItemId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <PageHeader
          title={job.summary}
          breadcrumbs={[
            { label: "Jobs", href: "/jobs" },
            { label: job.jobNumber },
          ]}
        >
          <StatusBadge type="priority" status={job.priority} />
          <StatusBadge type="job" status={job.status} />

          {/* Primary action */}
          {nextAction && job.status !== "canceled" && (
            <Button onClick={() => handleStatusChange(nextAction.status)} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {nextAction.label}
            </Button>
          )}

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {job.status !== "canceled" && job.status !== "completed" && (
                <DropdownMenuItem onClick={() => setConfirmCancel(true)} className="text-destructive">
                  Cancel Job
                </DropdownMenuItem>
              )}
              {job.status === "canceled" && (
                <DropdownMenuItem onClick={() => handleStatusChange("new")}>
                  Reopen Job
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </PageHeader>

        <p className="text-sm text-muted-foreground">
          {job.jobNumber} &middot; {job.jobType}
          {job.serviceType ? ` — ${job.serviceType}` : ""}
        </p>
      </div>

      {/* Status progress bar */}
      <JobStatusBar status={job.status} />

      {/* Info cards row */}
      <JobInfoCards job={job} />

      {/* Description */}
      {job.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm whitespace-pre-wrap">{job.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="line-items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="line-items">
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Line Items ({job.lineItems.length})
          </TabsTrigger>
          <TabsTrigger value="checklist">
            <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
            Checklist ({completedCount}/{job.checklist.length})
          </TabsTrigger>
          <TabsTrigger value="notes">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Notes ({job.notes.length})
          </TabsTrigger>
          <TabsTrigger value="photos">
            <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
            Photos ({job.photos.length})
          </TabsTrigger>
          <TabsTrigger value="signatures">
            <PenLine className="mr-1.5 h-3.5 w-3.5" />
            Signatures ({job.signatures.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="line-items">
          <JobLineItemsTab job={job} onDeleteItem={handleDeleteLineItem} isPending={isPending} />
        </TabsContent>

        <TabsContent value="checklist">
          <JobChecklistTab job={job} />
        </TabsContent>

        <TabsContent value="notes">
          <JobNotesTab job={job} />
        </TabsContent>

        <TabsContent value="photos">
          <JobPhotosTab job={job} />
        </TabsContent>

        {/* Signatures Tab */}
        <TabsContent value="signatures">
          {job.signatures.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <PenLine className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No signatures yet. Signatures can be captured from the mobile app.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {job.signatures.map((sig) => (
                <Card key={sig.id}>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="text-sm font-medium">{sig.signerName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{sig.signerRole}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sig.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Job Costing */}
      {costing && <JobCostingCard costing={costing} />}

      {/* Internal / Customer notes */}
      {(job.internalNotes || job.customerNotes) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {job.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{job.internalNotes}</p>
              </CardContent>
            </Card>
          )}
          {job.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{job.customerNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Timestamps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-muted-foreground">
            <span>Created {format(new Date(job.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
            {job.dispatchedAt && (
              <span>Dispatched {format(new Date(job.dispatchedAt), "MMM d, yyyy 'at' h:mm a")}</span>
            )}
            {job.actualStart && (
              <span>Started {format(new Date(job.actualStart), "MMM d, yyyy 'at' h:mm a")}</span>
            )}
            {job.completedAt && (
              <span>Completed {format(new Date(job.completedAt), "MMM d, yyyy 'at' h:mm a")}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialogs */}
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this job?"
        description="This will cancel the job and remove it from the schedule. You can reopen it later if needed."
        confirmLabel="Cancel Job"
        onConfirm={() => handleStatusChange("canceled")}
      />
      <ConfirmDialog
        open={deleteItemId !== null}
        onOpenChange={(open) => { if (!open) setDeleteItemId(null); }}
        title="Delete line item?"
        description="This line item will be permanently removed from the job."
        confirmLabel="Delete"
        onConfirm={confirmDeleteLineItem}
      />
    </div>
  );
}
