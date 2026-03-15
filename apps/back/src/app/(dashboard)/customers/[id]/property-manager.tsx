"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  createPropertyAction,
  updatePropertyAction,
  deletePropertyAction,
  type PropertyActionState,
} from "@/actions/properties";
import { showToast } from "@/lib/toast";

interface Property {
  id: string;
  name: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  accessNotes: string | null;
  isPrimary: boolean;
}

export function PropertyManager({
  customerId,
  properties,
}: {
  customerId: string;
  properties: Property[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const editProperty = editId ? properties.find((p) => p.id === editId) : null;

  async function handleDelete(propertyId: string) {
    setDeleting(propertyId);
    const result = await deletePropertyAction(customerId, propertyId);
    setDeleting(null);
    if (result.error) {
      showToast.error("Error", result.error);
    } else {
      showToast.deleted("Property");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">
          {properties.length} {properties.length === 1 ? "property" : "properties"}
        </h4>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Property
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Property</DialogTitle>
            </DialogHeader>
            <PropertyForm
              customerId={customerId}
              onSuccess={() => {
                setAddOpen(false);
                showToast.created("Property");
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No properties yet. Add a property to start scheduling jobs.
          </CardContent>
        </Card>
      ) : (
        properties.map((prop) => (
          <Card key={prop.id}>
            <CardContent className="flex items-start justify-between gap-3 pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  {prop.name && <p className="text-sm font-medium">{prop.name}</p>}
                  <p className="text-sm">
                    {prop.addressLine1}
                    {prop.addressLine2 && `, ${prop.addressLine2}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {prop.city}, {prop.state} {prop.zip}
                  </p>
                  {prop.accessNotes && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Access: {prop.accessNotes}
                    </p>
                  )}
                  {prop.isPrimary && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Dialog
                  open={editId === prop.id}
                  onOpenChange={(open) => setEditId(open ? prop.id : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Property</DialogTitle>
                    </DialogHeader>
                    {editProperty && (
                      <PropertyForm
                        customerId={customerId}
                        property={editProperty}
                        onSuccess={() => {
                          setEditId(null);
                          showToast.saved("Property");
                        }}
                      />
                    )}
                  </DialogContent>
                </Dialog>
                {!prop.isPrimary && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        disabled={deleting === prop.id}
                      >
                        {deleting === prop.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this property?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the property from this customer. Jobs linked to this property may be affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(prop.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function PropertyForm({
  customerId,
  property,
  onSuccess,
}: {
  customerId: string;
  property?: Property;
  onSuccess: () => void;
}) {
  const isEdit = !!property;
  const boundAction = isEdit
    ? updatePropertyAction.bind(null, customerId, property!.id)
    : createPropertyAction.bind(null, customerId);
  const [state, formAction, isPending] = useActionState<PropertyActionState, FormData>(boundAction, {});
  const lastProcessedRef = useRef<string | null>(null);

  useEffect(() => {
    const stateKey = state.success
      ? `success-${state.propertyId}`
      : state.error
        ? `error-${state.error}`
        : null;
    if (!stateKey || stateKey === lastProcessedRef.current) return;
    lastProcessedRef.current = stateKey;

    if (state.success) {
      onSuccess();
    } else if (state.error) {
      showToast.error("Error", state.error);
    }
  }, [state.success, state.error, state.propertyId, onSuccess]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Property Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={property?.name || ""}
          placeholder="e.g., Main Office, Warehouse"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine1">Address *</Label>
        <Input
          id="addressLine1"
          name="addressLine1"
          defaultValue={property?.addressLine1 || ""}
          required
        />
        {state.fieldErrors?.addressLine1 && (
          <p className="text-xs text-destructive">{state.fieldErrors.addressLine1[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="addressLine2">Address Line 2</Label>
        <Input
          id="addressLine2"
          name="addressLine2"
          defaultValue={property?.addressLine2 || ""}
          placeholder="Apt, suite, unit, etc."
        />
      </div>

      <div className="grid gap-4 grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input id="city" name="city" defaultValue={property?.city || ""} required />
          {state.fieldErrors?.city && (
            <p className="text-xs text-destructive">{state.fieldErrors.city[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input id="state" name="state" defaultValue={property?.state || ""} required />
          {state.fieldErrors?.state && (
            <p className="text-xs text-destructive">{state.fieldErrors.state[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP *</Label>
          <Input id="zip" name="zip" defaultValue={property?.zip || ""} required />
          {state.fieldErrors?.zip && (
            <p className="text-xs text-destructive">{state.fieldErrors.zip[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accessNotes">Access Notes</Label>
        <Textarea
          id="accessNotes"
          name="accessNotes"
          defaultValue={property?.accessNotes || ""}
          placeholder="Gate code, parking instructions, etc."
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? "Save Changes" : "Add Property"}
      </Button>
    </form>
  );
}
