"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { createCustomerAction, type CustomerActionState } from "@/actions/customers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useEffect } from "react";
import { showToast } from "@/lib/toast";

const initialState: CustomerActionState = {};

export function CreateCustomerDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCustomerAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success && state.customerId) {
      showToast.created("Customer");
      setOpen(false);
      router.push(`/customers/${state.customerId}`);
    } else if (state.error) {
      showToast.error("Failed to create customer", state.error);
    }
  }, [state.success, state.customerId, state.error, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" name="firstName" required />
              {state.fieldErrors?.firstName && (
                <p className="text-xs text-destructive">{state.fieldErrors.firstName[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" name="lastName" required />
              {state.fieldErrors?.lastName && (
                <p className="text-xs text-destructive">{state.fieldErrors.lastName[0]}</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" type="tel" required />
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
          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">Service Address</p>
            <div className="space-y-2">
              <Input name="addressLine1" placeholder="Street address" />
              <Input name="addressLine2" placeholder="Apt, suite, etc." />
              <div className="grid grid-cols-6 gap-2">
                <Input name="city" placeholder="City" className="col-span-3" />
                <Input name="state" placeholder="State" className="col-span-1" />
                <Input name="zip" placeholder="ZIP" className="col-span-2" />
              </div>
            </div>
          </div>

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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
