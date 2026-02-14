"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { showToast } from "@/lib/toast";
import {
  changeJobStatusAction,
  assignJobAction,
  addJobNoteAction,
  deleteLineItemAction,
} from "@/actions/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Clock,
  ChevronDown,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  PenLine,
  Trash2,
  Loader2,
} from "lucide-react";
import { AddLineItemForm } from "./add-line-item-form";

// ---- Status config ----

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  new: { label: "New", variant: "secondary", color: "bg-gray-400" },
  scheduled: { label: "Scheduled", variant: "default", color: "bg-blue-500" },
  dispatched: { label: "Dispatched", variant: "default", color: "bg-purple-500" },
  in_progress: { label: "In Progress", variant: "outline", color: "bg-amber-500" },
  completed: { label: "Completed", variant: "secondary", color: "bg-green-500" },
  canceled: { label: "Canceled", variant: "destructive", color: "bg-red-500" },
};

const priorityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Low", variant: "secondary" },
  normal: { label: "Normal", variant: "outline" },
  high: { label: "High", variant: "default" },
  emergency: { label: "Emergency", variant: "destructive" },
};

const statusSteps = ["new", "scheduled", "dispatched", "in_progress", "completed"];

const nextStatusMap: Record<string, { status: string; label: string } | null> = {
  new: { status: "scheduled", label: "Schedule" },
  scheduled: { status: "dispatched", label: "Dispatch" },
  dispatched: { status: "in_progress", label: "Start Work" },
  in_progress: { status: "completed", label: "Complete" },
  completed: null,
  canceled: { status: "new", label: "Reopen" },
};

// ---- Types ----

interface JobData {
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
    state: string;
    zip: string;
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
  photos: { id: string; storagePath: string; caption: string | null; createdAt: Date }[];
  signatures: { id: string; signerName: string; signerRole: string; createdAt: Date }[];
}

interface Props {
  job: JobData;
  userRole: string;
}

export function JobDetailContent({ job, userRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [noteText, setNoteText] = useState("");

  const sc = statusConfig[job.status] ?? statusConfig.new;
  const pc = priorityConfig[job.priority] ?? priorityConfig.normal;
  const nextAction = nextStatusMap[job.status];
  const currentStepIdx = statusSteps.indexOf(job.status);

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await changeJobStatusAction(
        job.id,
        newStatus as "new" | "scheduled" | "dispatched" | "in_progress" | "completed" | "canceled"
      );
      if (result.error) {
        showToast.error("Status change failed", result.error);
      } else {
        showToast.success(`Job ${statusConfig[newStatus]?.label ?? newStatus}`, "Status updated successfully");
        router.refresh();
      }
    });
  }

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
        setNoteText("");
        router.refresh();
      }
    });
  }

  function handleDeleteLineItem(itemId: string) {
    startTransition(async () => {
      const result = await deleteLineItemAction(job.id, itemId);
      if (result.error) {
        showToast.error("Action failed", result.error);
      } else {
        router.refresh();
      }
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
          <Badge variant={pc.variant}>{pc.label} priority</Badge>
          <Badge variant={sc.variant}>{sc.label}</Badge>

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
                <DropdownMenuItem onClick={() => handleStatusChange("canceled")} className="text-destructive">
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
      <div className="flex items-center gap-1">
        {statusSteps.map((step, idx) => {
          const isComplete = idx < currentStepIdx;
          const isCurrent = idx === currentStepIdx;
          const stepSc = statusConfig[step];
          return (
            <div key={step} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full ${
                  isComplete || isCurrent
                    ? stepSc.color
                    : "bg-muted"
                }`}
              />
              <span
                className={`text-[10px] ${
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {stepSc.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Info cards row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Customer */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Customer</p>
            <Link href={`/customers/${job.customer.id}`} className="font-medium hover:underline text-sm">
              {job.customer.firstName} {job.customer.lastName}
            </Link>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3" />
                {job.customer.phone}
              </div>
              {job.customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  {job.customer.email}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Service Location</p>
            <div className="flex items-start gap-1.5 text-sm">
              <MapPin className="mt-0.5 h-3 w-3 text-muted-foreground shrink-0" />
              <div>
                <p>{job.property.addressLine1}</p>
                {job.property.addressLine2 && <p>{job.property.addressLine2}</p>}
                <p className="text-muted-foreground">
                  {job.property.city}, {job.property.state} {job.property.zip}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Tech */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-2">Schedule & Technician</p>
            {job.scheduledStart ? (
              <div className="flex items-center gap-1.5 text-sm mb-2">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                {format(new Date(job.scheduledStart), "MMM d, yyyy 'at' h:mm a")}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-2">Not scheduled</p>
            )}
            {job.assignedUser ? (
              <div className="flex items-center gap-2 text-sm">
                <Avatar className="h-5 w-5">
                  <AvatarFallback
                    className="text-[9px] text-white"
                    style={{ backgroundColor: job.assignedUser.color }}
                  >
                    {job.assignedUser.firstName[0]}{job.assignedUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                {job.assignedUser.firstName} {job.assignedUser.lastName}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Unassigned</p>
            )}
          </CardContent>
        </Card>
      </div>

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

        {/* Line Items Tab */}
        <TabsContent value="line-items" className="space-y-4">
          {job.lineItems.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-20 text-right">Qty</TableHead>
                    <TableHead className="w-28 text-right">Unit Price</TableHead>
                    <TableHead className="w-28 text-right">Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {job.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="text-sm">{item.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                      </TableCell>
                      <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                      <TableCell className="text-right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">${Number(item.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDeleteLineItem(item.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-medium">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${job.totalAmount ? Number(job.totalAmount).toFixed(2) : "0.00"}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}

          <AddLineItemForm jobId={job.id} />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
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
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          {job.photos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No photos yet. Photos can be added from the mobile app.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {job.photos.map((photo) => (
                <Card key={photo.id}>
                  <CardContent className="pt-4 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                    {photo.caption && (
                      <p className="mt-2 text-xs text-muted-foreground">{photo.caption}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
    </div>
  );
}
