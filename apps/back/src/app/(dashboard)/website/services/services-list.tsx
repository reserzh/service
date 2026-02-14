"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
} from "@/actions/website";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Service = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  priceDisplay: string | null;
  isBookable: boolean;
  isActive: boolean;
  sortOrder: number;
};

export function ServicesList({ initialServices }: { initialServices: Service[] }) {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [isBookable, setIsBookable] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setSlug("");
    setShortDescription("");
    setDescription("");
    setPriceDisplay("");
    setIsBookable(true);
    setEditingService(null);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setSlug(service.slug);
    setShortDescription(service.shortDescription ?? "");
    setDescription(service.description ?? "");
    setPriceDisplay(service.priceDisplay ?? "");
    setIsBookable(service.isBookable);
    setDialogOpen(true);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!editingService) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim()
      );
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    if (editingService) {
      const result = await updateServiceAction({
        id: editingService.id,
        name,
        slug,
        shortDescription: shortDescription || null,
        description: description || null,
        priceDisplay: priceDisplay || null,
        isBookable,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Service updated");
        setDialogOpen(false);
        resetForm();
        router.refresh();
      }
    } else {
      const result = await createServiceAction({
        name,
        slug,
        shortDescription: shortDescription || undefined,
        description: description || undefined,
        priceDisplay: priceDisplay || undefined,
        isBookable,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Service created");
        setDialogOpen(false);
        resetForm();
        router.refresh();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Delete this service?")) return;
    const result = await deleteServiceAction(serviceId);
    if (result.error) {
      toast.error(result.error);
    } else {
      setServices(services.filter((s) => s.id !== serviceId));
      toast.success("Service deleted");
    }
  };

  const handleToggleActive = async (service: Service) => {
    const result = await updateServiceAction({
      id: service.id,
      isActive: !service.isActive,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setServices(
        services.map((s) =>
          s.id === service.id ? { ...s, isActive: !s.isActive } : s
        )
      );
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-end mb-4">
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Add Service"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="svc-name">Service Name</Label>
                <Input
                  id="svc-name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., AC Repair"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-slug">URL Slug</Label>
                <Input
                  id="svc-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="ac-repair"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-short">Short Description</Label>
                <Input
                  id="svc-short"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brief summary for listings"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-desc">Full Description</Label>
                <Textarea
                  id="svc-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed service description..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-price">Price Display</Label>
                <Input
                  id="svc-price"
                  value={priceDisplay}
                  onChange={(e) => setPriceDisplay(e.target.value)}
                  placeholder="Starting at $89"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Online Booking</Label>
                <Switch checked={isBookable} onCheckedChange={setIsBookable} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSubmit} disabled={saving || !name || !slug}>
                  {saving ? "Saving..." : editingService ? "Update" : "Create"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Bookable</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No services yet. Add your first service.
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.shortDescription || `/${service.slug}`}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{service.priceDisplay || "—"}</TableCell>
                    <TableCell>
                      {service.isBookable ? (
                        <Badge variant="outline">Yes</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={() => handleToggleActive(service)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
