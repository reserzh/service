"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCustomerAction, type CustomerActionState } from "@/actions/customers";
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
import Link from "next/link";

const initialState: CustomerActionState = {};

export function CreateCustomerForm() {
  const [state, formAction, isPending] = useActionState(createCustomerAction, initialState);
  const router = useRouter();

  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success ? `success-${state.customerId}` : state.error ? `error-${state.error}` : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success && state.customerId) {
      showToast.created("Customer");
      router.push(`/customers/${state.customerId}`);
    } else if (state.error) {
      showToast.error("Failed to create customer", state.error);
    }
  }, [state.success, state.customerId, state.error, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" name="firstName" required aria-describedby={state.fieldErrors?.firstName ? "firstName-error" : undefined} />
          {state.fieldErrors?.firstName && (
            <p id="firstName-error" className="text-xs text-destructive" role="alert">{state.fieldErrors.firstName[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input id="lastName" name="lastName" required aria-describedby={state.fieldErrors?.lastName ? "lastName-error" : undefined} />
          {state.fieldErrors?.lastName && (
            <p id="lastName-error" className="text-xs text-destructive" role="alert">{state.fieldErrors.lastName[0]}</p>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" name="phone" type="tel" required aria-describedby={state.fieldErrors?.phone ? "phone-error" : undefined} />
          {state.fieldErrors?.phone && (
            <p id="phone-error" className="text-xs text-destructive" role="alert">{state.fieldErrors.phone[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
      </div>

      {/* Type & Company */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue="residential">
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
          <Label htmlFor="companyName">Company</Label>
          <Input id="companyName" name="companyName" />
        </div>
      </div>

      {/* Property Address */}
      <fieldset className="space-y-3 rounded-md border p-3">
        <legend className="text-sm font-medium">Service Address</legend>
        <div className="space-y-2">
          <Label htmlFor="addressLine1" className="sr-only">Street address</Label>
          <Input id="addressLine1" name="addressLine1" placeholder="Street address" />
          <Label htmlFor="addressLine2" className="sr-only">Apt, suite, etc.</Label>
          <Input id="addressLine2" name="addressLine2" placeholder="Apt, suite, etc." />
          <div className="grid grid-cols-6 gap-2">
            <div className="col-span-3">
              <Label htmlFor="city" className="sr-only">City</Label>
              <Input id="city" name="city" placeholder="City" />
            </div>
            <div className="col-span-1">
              <Label htmlFor="state" className="sr-only">State</Label>
              <Input id="state" name="state" placeholder="State" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="zip" className="sr-only">ZIP code</Label>
              <Input id="zip" name="zip" placeholder="ZIP" />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Source & Notes */}
      <div className="space-y-2">
        <Label htmlFor="source">How did they find you?</Label>
        <Input id="source" name="source" placeholder="Google, referral, etc." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/customers">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Customer
        </Button>
      </div>
    </form>
  );
}
