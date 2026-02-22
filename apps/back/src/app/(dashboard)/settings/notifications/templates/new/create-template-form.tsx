"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTemplateAction, type TemplateActionState } from "@/actions/communications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { COMMUNICATION_TRIGGER_LABELS } from "@fieldservice/api-types/constants";
import { TEMPLATE_VARIABLES } from "@/lib/email/templates";

const initialState: TemplateActionState = {};

export function CreateTemplateForm() {
  const [state, formAction, isPending] = useActionState(createTemplateAction, initialState);
  const [selectedTrigger, setSelectedTrigger] = useState<string>("");
  const router = useRouter();
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success ? `success-${state.templateId}` : state.error ? `error-${state.error}` : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success) {
      showToast.created("Template");
      router.push("/settings/notifications");
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.templateId, state.error, router]);

  const availableVars = selectedTrigger ? TEMPLATE_VARIABLES[selectedTrigger] || [] : TEMPLATE_VARIABLES.custom || [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input id="name" name="name" required placeholder="e.g. Invoice Email" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger</Label>
              <Select name="trigger" value={selectedTrigger} onValueChange={setSelectedTrigger}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trigger (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COMMUNICATION_TRIGGER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When set, this template sends automatically when the trigger event occurs.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input id="subject" name="subject" required placeholder="e.g. Invoice {{invoiceNumber}} from {{companyName}}" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Email Body (HTML) *</Label>
              <Textarea id="body" name="body" required rows={12} className="font-mono text-sm" placeholder="<p>Hi {{customerFirstName}},</p>" />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch id="isActive" name="isActive" defaultChecked />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="isDefault" name="isDefault" />
                <Label htmlFor="isDefault">Default for trigger</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Template
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Variable Reference */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-sm">Available Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Use these in your subject and body with {"{{variableName}}"} syntax.
          </p>
          <div className="space-y-1">
            {availableVars.map((v) => (
              <code key={v} className="block text-xs bg-muted px-2 py-1 rounded">
                {`{{${v}}}`}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
