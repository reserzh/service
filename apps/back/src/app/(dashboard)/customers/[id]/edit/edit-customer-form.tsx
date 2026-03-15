"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerAction, type CustomerActionState } from "@/actions/customers";
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
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

interface CustomerData {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  altPhone: string | null;
  companyName: string | null;
  type: string;
  source: string | null;
  notes: string | null;
  doNotContact: boolean | null;
}

export function EditCustomerForm({ customer }: { customer: CustomerData }) {
  const router = useRouter();
  const boundAction = updateCustomerAction.bind(null, customer.id);
  const [state, formAction, isPending] = useActionState<CustomerActionState, FormData>(boundAction, {});
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success
      ? `success-${state.customerId}`
      : state.error
        ? `error-${state.error}`
        : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success) {
      showToast.saved("Customer");
      router.push(`/customers/${customer.id}`);
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.error, state.customerId, customer.id, router]);

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Customer Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {state.error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={customer.firstName}
                required
              />
              {state.fieldErrors?.firstName && (
                <p className="text-xs text-destructive">{state.fieldErrors.firstName[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={customer.lastName}
                required
              />
              {state.fieldErrors?.lastName && (
                <p className="text-xs text-destructive">{state.fieldErrors.lastName[0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer.email || ""}
              />
              {state.fieldErrors?.email && (
                <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={customer.phone}
                required
              />
              {state.fieldErrors?.phone && (
                <p className="text-xs text-destructive">{state.fieldErrors.phone[0]}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="altPhone">Alt Phone</Label>
              <Input
                id="altPhone"
                name="altPhone"
                defaultValue={customer.altPhone || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={customer.companyName || ""}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={customer.type}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                defaultValue={customer.source || ""}
                placeholder="Referral, Google, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={customer.notes || ""}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
