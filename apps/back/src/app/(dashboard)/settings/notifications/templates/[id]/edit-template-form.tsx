"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTemplateAction, deleteTemplateAction, type TemplateActionState } from "@/actions/communications";
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
import { Loader2, Trash2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import { COMMUNICATION_TRIGGER_LABELS } from "@fieldservice/api-types/constants";
import { TEMPLATE_VARIABLES } from "@/lib/email/templates";

interface Template {
  id: string;
  name: string;
  trigger: string | null;
  subject: string;
  body: string;
  isActive: boolean;
  isDefault: boolean;
}

const initialState: TemplateActionState = {};

export function EditTemplateForm({ template }: { template: Template }) {
  const [state, formAction, isPending] = useActionState(updateTemplateAction, initialState);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState(template.trigger || "");
  const router = useRouter();
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success ? `success-${Date.now()}` : state.error ? `error-${state.error}` : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success) {
      showToast.saved("Template");
      router.push("/settings/notifications");
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.error, router]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this template?")) return;
    setIsDeleting(true);
    const result = await deleteTemplateAction(template.id);
    if (result.success) {
      showToast.deleted("Template");
      router.push("/settings/notifications");
    } else if (result.error) {
      showToast.error("Error", result.error);
    }
    setIsDeleting(false);
  }

  const availableVars = selectedTrigger ? TEMPLATE_VARIABLES[selectedTrigger] || [] : TEMPLATE_VARIABLES.custom || [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Template</CardTitle>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete
          </Button>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={template.id} />

            {state.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input id="name" name="name" required defaultValue={template.name} />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input id="subject" name="subject" required defaultValue={template.subject} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Email Body (HTML) *</Label>
              <Textarea id="body" name="body" required rows={12} className="font-mono text-sm" defaultValue={template.body} />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Switch id="isActive" name="isActive" defaultChecked={template.isActive} />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="isDefault" name="isDefault" defaultChecked={template.isDefault} />
                <Label htmlFor="isDefault">Default for trigger</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
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
