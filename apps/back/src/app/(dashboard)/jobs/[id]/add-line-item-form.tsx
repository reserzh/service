"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addLineItemAction, type JobActionState } from "@/actions/jobs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  jobId: string;
}

const initialState: JobActionState = {};

export function AddLineItemForm({ jobId }: Props) {
  const boundAction = addLineItemAction.bind(null, jobId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Card>
      <CardContent className="pt-4">
        <form ref={formRef} action={formAction} className="space-y-3">
          <p className="text-sm font-medium">Add Line Item</p>

          {state.error && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}

          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 sm:col-span-4 space-y-1">
              <Label className="text-xs">Description</Label>
              <Input name="description" placeholder="Service or material" required />
            </div>
            <div className="col-span-4 sm:col-span-2 space-y-1">
              <Label className="text-xs">Type</Label>
              <Select name="type" defaultValue="service">
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 sm:col-span-2 space-y-1">
              <Label className="text-xs">Qty</Label>
              <Input name="quantity" type="number" step="0.01" min="0.01" defaultValue="1" required />
            </div>
            <div className="col-span-3 sm:col-span-2 space-y-1">
              <Label className="text-xs">Unit Price</Label>
              <Input name="unitPrice" type="number" step="0.01" min="0" placeholder="0.00" required />
            </div>
            <div className="col-span-2 sm:col-span-2">
              <Button type="submit" size="sm" className="w-full" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
