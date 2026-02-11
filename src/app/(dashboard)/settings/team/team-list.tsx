"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Pencil, UserX, UserCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  updateTeamMemberAction,
  deactivateTeamMemberAction,
  reactivateTeamMemberAction,
  type TeamActionState,
} from "@/actions/team";
import { showToast } from "@/lib/toast";

const roleLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", variant: "default" },
  office_manager: { label: "Office Manager", variant: "secondary" },
  dispatcher: { label: "Dispatcher", variant: "secondary" },
  csr: { label: "CSR", variant: "outline" },
  technician: { label: "Technician", variant: "outline" },
};

interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  color: string;
  hourlyRate: string | null;
  canBeDispatched: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

interface TeamListProps {
  members: TeamMember[];
  meta: { page: number; pageSize: number; total: number };
  searchQuery?: string;
  showInactive: boolean;
  currentUserId: string;
}

export function TeamList({ members, meta, searchQuery, showInactive, currentUserId }: TeamListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchQuery || "");
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  // Edit form state
  const [editRole, setEditRole] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRate, setEditRate] = useState("");
  const [editDispatch, setEditDispatch] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/settings/team?${params.toString()}`);
    },
    [router, searchParams]
  );

  function openEdit(member: TeamMember) {
    setEditMember(member);
    setEditRole(member.role);
    setEditPhone(member.phone ?? "");
    setEditRate(member.hourlyRate ?? "");
    setEditDispatch(member.canBeDispatched);
  }

  async function handleSaveEdit() {
    if (!editMember) return;
    setLoading("edit");

    const formData = new FormData();
    formData.set("role", editRole);
    formData.set("phone", editPhone);
    formData.set("hourlyRate", editRate);
    formData.set("canBeDispatched", editDispatch ? "true" : "false");

    const result = await updateTeamMemberAction(editMember.id, {} as TeamActionState, formData);
    setLoading(null);

    if (result.error) {
      showToast.error("Failed to update member", result.error);
    } else {
      showToast.saved("Team member");
      setEditMember(null);
      router.refresh();
    }
  }

  async function handleDeactivate(userId: string) {
    setLoading(userId);
    const result = await deactivateTeamMemberAction(userId);
    setLoading(null);
    if (result.error) {
      showToast.error("Failed to deactivate member", result.error);
    } else {
      showToast.success("Team member deactivated", "They will no longer have access.");
      router.refresh();
    }
  }

  async function handleReactivate(userId: string) {
    setLoading(userId);
    const result = await reactivateTeamMemberAction(userId);
    setLoading(null);
    if (result.error) {
      showToast.error("Failed to reactivate member", result.error);
    } else {
      showToast.success("Team member reactivated", "They can now access the system again.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParams({ search: search || undefined });
            }}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="showInactive"
            checked={showInactive}
            onCheckedChange={(checked) =>
              updateParams({ showInactive: checked ? "true" : undefined })
            }
          />
          <Label htmlFor="showInactive" className="text-sm">Show inactive</Label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">Dispatch</TableHead>
              <TableHead className="hidden lg:table-cell">Rate</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
                const rc = roleLabels[member.role] ?? { label: member.role, variant: "secondary" as const };
                const isCurrentUser = member.id === currentUserId;

                return (
                  <TableRow key={member.id} className={!member.isActive ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className="text-xs text-white"
                            style={{ backgroundColor: member.color }}
                          >
                            {member.firstName[0]}{member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {member.firstName} {member.lastName}
                            {isCurrentUser && <span className="text-muted-foreground ml-1">(you)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rc.variant}>{rc.label}</Badge>
                      {!member.isActive && (
                        <Badge variant="destructive" className="ml-1">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {member.phone || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {member.canBeDispatched ? (
                        <Badge variant="secondary">Dispatchable</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {member.hourlyRate
                        ? `$${Number(member.hourlyRate).toFixed(2)}/hr`
                        : <span className="text-muted-foreground">-</span>
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(member)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        {!isCurrentUser && member.isActive && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <UserX className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate {member.firstName}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  They will lose access to the system. You can reactivate them later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeactivate(member.id)}>
                                  Deactivate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}

                        {!isCurrentUser && !member.isActive && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            onClick={() => handleReactivate(member.id)}
                            disabled={loading === member.id}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">{meta.total} team member{meta.total !== 1 ? "s" : ""}</p>

      {/* Edit Dialog */}
      <Dialog open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              {editMember?.firstName} {editMember?.lastName} ({editMember?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editRole}
                onValueChange={setEditRole}
                disabled={editMember?.id === currentUserId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="office_manager">Office Manager</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="csr">CSR</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                </SelectContent>
              </Select>
              {editMember?.id === currentUserId && (
                <p className="text-xs text-muted-foreground">You cannot change your own role.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label>Hourly Rate ($)</Label>
              <Input
                type="number"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={editDispatch}
                onCheckedChange={setEditDispatch}
              />
              <Label className="text-sm font-normal">Can be dispatched to jobs</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={loading === "edit"}>
              {loading === "edit" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
