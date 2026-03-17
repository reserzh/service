import { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  getCompanyEquipmentItem,
  getMaintenanceLogs,
} from "@/lib/services/company-equipment";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { MaintenanceLogForm } from "./maintenance-log-form";
import { DeleteEquipmentButton } from "./delete-equipment-button";

export const metadata: Metadata = { title: "Equipment Detail" };

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  in_use: "In Use",
  maintenance: "Maintenance",
  retired: "Retired",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  available: "default",
  in_use: "secondary",
  maintenance: "outline",
  retired: "destructive",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString();
}

function formatCurrency(value: string | null | undefined): string {
  if (!value) return "\u2014";
  return `$${parseFloat(value).toFixed(2)}`;
}

export default async function EquipmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const ctx = await requireAuth();

  let item;
  try {
    item = await getCompanyEquipmentItem(ctx, id);
  } catch {
    notFound();
  }

  const logs = await getMaintenanceLogs(ctx, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        breadcrumbs={[
          { label: "Settings", href: "/settings" },
          { label: "Equipment", href: "/settings/equipment" },
          { label: item.name },
        ]}
      >
        <DeleteEquipmentButton itemId={item.id} />
        <Button asChild>
          <Link href={`/settings/equipment/${item.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </PageHeader>

      {/* Equipment Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline">{item.type}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={STATUS_VARIANTS[item.status] || "secondary"}>
                {STATUS_LABELS[item.status] || item.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Brand</span>
              <span>{item.brand || "\u2014"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span>{item.model || "\u2014"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial Number</span>
              <span className="font-mono text-xs">{item.serialNumber || "\u2014"}</span>
            </div>
            {item.notes && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Notes</span>
                <p className="mt-1">{item.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Service & Financials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Date</span>
              <span>{formatDate(item.purchaseDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Purchase Cost</span>
              <span>{formatCurrency(item.purchaseCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hours Used</span>
              <span>{item.hoursUsed ?? 0}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Service</span>
              <span>{formatDate(item.lastServiceDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Service Due</span>
              <span
                className={
                  item.nextServiceDue && new Date(item.nextServiceDue) < new Date()
                    ? "font-medium text-destructive"
                    : ""
                }
              >
                {formatDate(item.nextServiceDue)}
                {item.nextServiceDue && new Date(item.nextServiceDue) < new Date() && " (overdue)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Interval</span>
              <span>
                {item.serviceIntervalDays
                  ? `Every ${item.serviceIntervalDays} days`
                  : item.serviceIntervalHours
                    ? `Every ${item.serviceIntervalHours} hours`
                    : "\u2014"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Maintenance Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MaintenanceLogForm equipmentId={item.id} />

          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No maintenance records yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{formatDate(log.performedAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[300px] truncate">
                      {log.description || "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.performedByFirstName && log.performedByLastName
                        ? `${log.performedByFirstName} ${log.performedByLastName}`
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.hoursAtService != null ? `${log.hoursAtService}h` : "\u2014"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(log.cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
