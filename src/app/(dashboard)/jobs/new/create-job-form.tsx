"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createJobAction, type JobActionState } from "@/actions/jobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

interface Props {
  customers: { id: string; name: string; phone: string }[];
  technicians: { id: string; name: string; color: string }[];
}

const jobTypes = [
  "Repair",
  "Install",
  "Maintenance",
  "Inspection",
  "Replacement",
  "Diagnostic",
  "Emergency",
  "Other",
];

const serviceTypes = ["HVAC", "Plumbing", "Electrical", "Appliance", "General"];

const initialState: JobActionState = {};

export function CreateJobForm({ customers, technicians }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createJobAction, initialState);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [properties, setProperties] = useState<{ id: string; address: string }[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  useEffect(() => {
    if (state.success && state.jobId) {
      showToast.created("Job");
      router.push(`/jobs/${state.jobId}`);
    }
  }, [state.success, state.jobId, router]);

  // Fetch properties when customer changes
  useEffect(() => {
    if (!selectedCustomer) {
      setProperties([]);
      return;
    }
    setLoadingProperties(true);
    fetch(`/api/v1/customers/${selectedCustomer}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.properties) {
          setProperties(
            data.data.properties.map((p: { id: string; addressLine1: string; city: string; state: string }) => ({
              id: p.id,
              address: `${p.addressLine1}, ${p.city}, ${p.state}`,
            }))
          );
        }
      })
      .catch(() => setProperties([]))
      .finally(() => setLoadingProperties(false));
  }, [selectedCustomer]);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Customer & Property */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer & Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId">Customer *</Label>
            <Select
              name="customerId"
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} — {c.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.customerId && (
              <p className="text-xs text-destructive">{state.fieldErrors.customerId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyId">Service Location *</Label>
            <Select name="propertyId" required disabled={!selectedCustomer || loadingProperties}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingProperties
                      ? "Loading..."
                      : !selectedCustomer
                        ? "Select a customer first"
                        : properties.length === 0
                          ? "No properties — add one to the customer first"
                          : "Select a property"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state.fieldErrors?.propertyId && (
              <p className="text-xs text-destructive">{state.fieldErrors.propertyId[0]}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Input
              id="summary"
              name="summary"
              placeholder="Brief description of the work needed"
              required
            />
            {state.fieldErrors?.summary && (
              <p className="text-xs text-destructive">{state.fieldErrors.summary[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type *</Label>
              <Select name="jobType" defaultValue="Repair" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceType">Service Type</Label>
              <Select name="serviceType">
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select name="priority" defaultValue="normal">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Detailed description, customer complaints, symptoms..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Scheduling & Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule & Assign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign Technician</Label>
            <Select name="assignedTo">
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback
                          className="text-[9px] text-white"
                          style={{ backgroundColor: t.color }}
                        >
                          {t.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Start Date & Time</Label>
              <Input
                id="scheduledStart"
                name="scheduledStart"
                type="datetime-local"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledEnd">End Date & Time</Label>
              <Input
                id="scheduledEnd"
                name="scheduledEnd"
                type="datetime-local"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              name="internalNotes"
              rows={2}
              placeholder="Visible to staff only"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerNotes">Customer Notes</Label>
            <Textarea
              id="customerNotes"
              name="customerNotes"
              rows={2}
              placeholder="Visible to the customer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Job
        </Button>
      </div>
    </form>
  );
}
