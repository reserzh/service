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
  addChecklistItemAction,
  toggleChecklistItemAction,
  deleteChecklistItemAction,
} from "@/actions/jobs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
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
  CheckSquare,
  Square,
  Plus,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AddLineItemForm } from "./add-line-item-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

// ---- Haversine distance in feet ----

function haversineDistanceFt(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 20902231; // Earth radius in feet
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- Status config ----

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-status-new" },
  scheduled: { label: "Scheduled", color: "bg-status-scheduled" },
  dispatched: { label: "Dispatched", color: "bg-status-dispatched" },
  en_route: { label: "En Route", color: "bg-status-en-route" },
  in_progress: { label: "In Progress", color: "bg-status-in-progress" },
  completed: { label: "Completed", color: "bg-status-completed" },
  canceled: { label: "Canceled", color: "bg-status-canceled" },
};

const statusSteps = ["new", "scheduled", "dispatched", "en_route", "in_progress", "completed"];

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
}

export function JobDetailContent({ job, userRole }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [noteText, setNoteText] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [showChecklistInput, setShowChecklistInput] = useState(false);

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
        showToast.created("Note");
        setNoteText("");
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

  function handleAddChecklistItem() {
    if (!newChecklistLabel.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("label", newChecklistLabel.trim());
      const result = await addChecklistItemAction(job.id, fd);
      if (result.error) {
        showToast.error("Action failed", result.error);
      } else {
        showToast.created("Checklist item");
        setNewChecklistLabel("");
        setShowChecklistInput(false);
        router.refresh();
      }
    });
  }

  function handleToggleChecklistItem(itemId: string, completed: boolean) {
    startTransition(async () => {
      const result = await toggleChecklistItemAction(job.id, itemId, completed);
      if (result.error) {
        showToast.error("Action failed", result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleDeleteChecklistItem(itemId: string) {
    startTransition(async () => {
      const result = await deleteChecklistItemAction(job.id, itemId);
      if (result.error) {
        showToast.error("Action failed", result.error);
      } else {
        showToast.deleted("Checklist item");
        router.refresh();
      }
    });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  function getPhotoUrl(storagePath: string) {
    return `${supabaseUrl}/storage/v1/object/public/job-photos/${storagePath}`;
  }

  // Group photos by type
  const beforePhotos = job.photos.filter((p) => p.photoType === "before");
  const afterPhotos = job.photos.filter((p) => p.photoType === "after");
  const generalPhotos = job.photos.filter((p) => p.photoType === "general" || !p.photoType);

  const completedCount = job.checklist.filter((i) => i.completed).length;

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
      {job.status !== "canceled" && <div className="flex items-center gap-1">
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
      </div>}

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

        {/* Geofence distance warning */}
        {job.startLatitude && job.startLongitude && job.property.latitude && job.property.longitude && (() => {
          const dist = haversineDistanceFt(
            parseFloat(job.startLatitude), parseFloat(job.startLongitude),
            parseFloat(job.property.latitude), parseFloat(job.property.longitude)
          );
          if (dist > 500) {
            const miles = (dist / 5280).toFixed(1);
            return (
              <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Job started {miles} mi from property
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Technician was more than 500ft from the service location when they started this job.
                  </p>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

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

        {/* Crew */}
        {job.assignments.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-2">Crew</p>
              <div className="space-y-2">
                {job.assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback
                        className="text-[9px] text-white"
                        style={{ backgroundColor: a.user.color }}
                      >
                        {a.user.firstName[0]}{a.user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>{a.user.firstName} {a.user.lastName}</span>
                    <Badge variant={a.role === "lead" ? "default" : "secondary"} className="text-[10px] h-4">
                      {a.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          {job.checklist.length > 0 && (
            <Card>
              <CardContent className="pt-4">
                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${job.checklist.length > 0 ? (completedCount / job.checklist.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {completedCount}/{job.checklist.length}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  {job.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 group py-1.5">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) =>
                          handleToggleChecklistItem(item.id, checked === true)
                        }
                        disabled={isPending}
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add item */}
          {showChecklistInput ? (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={newChecklistLabel}
                    onChange={(e) => setNewChecklistLabel(e.target.value)}
                    placeholder="Enter checklist item..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddChecklistItem();
                      if (e.key === "Escape") {
                        setShowChecklistInput(false);
                        setNewChecklistLabel("");
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleAddChecklistItem}
                    disabled={isPending || !newChecklistLabel.trim()}
                  >
                    {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowChecklistInput(false);
                      setNewChecklistLabel("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChecklistInput(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Item
            </Button>
          )}

          {job.checklist.length === 0 && !showChecklistInput && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No checklist items yet.
            </p>
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
            <div className="space-y-6">
              {beforePhotos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">Before</h4>
                  <PhotoSection photos={beforePhotos} getPhotoUrl={getPhotoUrl} onSelect={setSelectedPhoto} />
                </div>
              )}
              {afterPhotos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-3">After</h4>
                  <PhotoSection photos={afterPhotos} getPhotoUrl={getPhotoUrl} onSelect={setSelectedPhoto} />
                </div>
              )}
              {generalPhotos.length > 0 && (
                <div>
                  {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
                    <h4 className="text-sm font-medium mb-3">General</h4>
                  )}
                  <PhotoSection photos={generalPhotos} getPhotoUrl={getPhotoUrl} onSelect={setSelectedPhoto} />
                </div>
              )}
            </div>
          )}

          {/* Lightbox modal */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
              onClick={() => setSelectedPhoto(null)}
            >
              <button
                className="absolute top-4 right-4 text-white hover:text-white/80"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-6 w-6" />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto}
                alt="Photo detail"
                className="max-h-[90vh] max-w-[90vw] object-contain rounded"
                onClick={(e) => e.stopPropagation()}
              />
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

// Photo grid section used within the Photos tab
function PhotoSection({
  photos,
  getPhotoUrl,
  onSelect,
}: {
  photos: { id: string; storagePath: string; caption: string | null; photoType: string; createdAt: Date }[];
  getPhotoUrl: (path: string) => string;
  onSelect: (url: string) => void;
}) {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <button
          key={photo.id}
          className="group relative rounded-lg overflow-hidden bg-muted aspect-square cursor-pointer border hover:ring-2 hover:ring-primary transition-all"
          onClick={() => onSelect(getPhotoUrl(photo.storagePath))}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPhotoUrl(photo.storagePath)}
            alt={photo.caption || "Job photo"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {photo.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-6">
              <p className="text-[11px] text-white truncate">{photo.caption}</p>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
