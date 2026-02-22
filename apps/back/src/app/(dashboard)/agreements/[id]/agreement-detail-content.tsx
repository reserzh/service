"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  DollarSign,
  Users,
  MapPin,
  Pencil,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Briefcase,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  AGREEMENT_STATUS_LABELS,
  BILLING_FREQUENCY_LABELS,
  AGREEMENT_VISIT_STATUS_LABELS,
  VALID_AGREEMENT_TRANSITIONS,
} from "@fieldservice/api-types/constants";
import { changeAgreementStatusAction } from "@/actions/agreements";
import { showToast } from "@/lib/toast";
import type { AgreementStatus } from "@fieldservice/api-types/enums";

interface AgreementDetailProps {
  agreement: {
    id: string;
    agreementNumber: string;
    name: string;
    description: string | null;
    status: string;
    startDate: string;
    endDate: string;
    billingFrequency: string;
    billingAmount: string;
    totalValue: string;
    visitsPerYear: number;
    autoRenew: boolean;
    renewalReminderDays: number;
    notes: string | null;
    internalNotes: string | null;
    customer: { id: string; firstName: string; lastName: string; email: string | null; phone: string };
    property: { id: string; addressLine1: string; city: string; state: string; zip: string };
    services: { id: string; name: string; quantity: string; unitPrice: string; sortOrder: number }[];
    visits: { id: string; visitNumber: number; status: string; scheduledDate: string | null; completedDate: string | null; jobId: string | null; invoiceId: string | null }[];
  };
}

const statusIcons: Record<string, React.ReactNode> = {
  active: <Play className="h-3.5 w-3.5" />,
  paused: <Pause className="h-3.5 w-3.5" />,
  completed: <CheckCircle className="h-3.5 w-3.5" />,
  canceled: <XCircle className="h-3.5 w-3.5" />,
};

export function AgreementDetailContent({ agreement }: AgreementDetailProps) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const allowedTransitions = VALID_AGREEMENT_TRANSITIONS[agreement.status as AgreementStatus] || [];

  async function handleStatusChange(newStatus: string) {
    setIsTransitioning(true);
    const result = await changeAgreementStatusAction(agreement.id, newStatus);
    if (result.success) {
      showToast.saved("Agreement status");
      router.refresh();
    } else if (result.error) {
      showToast.error("Error", result.error);
    }
    setIsTransitioning(false);
  }

  return (
    <div className="space-y-6">
      {/* Status + Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge type="agreement" status={agreement.status} />
        {allowedTransitions.map((status) => (
          <Button
            key={status}
            variant="outline"
            size="sm"
            disabled={isTransitioning}
            onClick={() => handleStatusChange(status)}
          >
            {isTransitioning ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : statusIcons[status]}
            <span className="ml-1">{AGREEMENT_STATUS_LABELS[status]}</span>
          </Button>
        ))}
        {agreement.status === "draft" && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/agreements/${agreement.id}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md bg-muted p-2">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                <Link href={`/customers/${agreement.customer.id}`} className="hover:underline">
                  {agreement.customer.firstName} {agreement.customer.lastName}
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">{agreement.customer.phone}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md bg-muted p-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{agreement.property.addressLine1}</p>
              <p className="text-xs text-muted-foreground">
                {agreement.property.city}, {agreement.property.state} {agreement.property.zip}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-md bg-muted p-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                ${parseFloat(agreement.billingAmount).toFixed(2)} /{" "}
                {BILLING_FREQUENCY_LABELS[agreement.billingFrequency as keyof typeof BILLING_FREQUENCY_LABELS]}
              </p>
              <p className="text-xs text-muted-foreground">
                Total: ${parseFloat(agreement.totalValue).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period */}
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <div className="rounded-md bg-muted p-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Start:</span> {agreement.startDate}
            </div>
            <div>
              <span className="text-muted-foreground">End:</span> {agreement.endDate}
            </div>
            <div>
              <span className="text-muted-foreground">Visits/Year:</span> {agreement.visitsPerYear}
            </div>
            <div>
              <span className="text-muted-foreground">Auto-renew:</span> {agreement.autoRenew ? "Yes" : "No"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Services + Visits */}
      <Tabs defaultValue="visits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visits">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            Visits ({agreement.visits.length})
          </TabsTrigger>
          <TabsTrigger value="services">
            <Briefcase className="mr-1.5 h-3.5 w-3.5" />
            Services ({agreement.services.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visits">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreement.visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">Visit {visit.visitNumber}</TableCell>
                      <TableCell>
                        <StatusBadge type="job" status={visit.status === "skipped" ? "canceled" : visit.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{visit.scheduledDate || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{visit.completedDate || "—"}</TableCell>
                      <TableCell>
                        {visit.jobId ? (
                          <Link href={`/jobs/${visit.jobId}`} className="text-sm text-primary hover:underline">
                            View Job
                          </Link>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {visit.invoiceId ? (
                          <Link href={`/invoices/${visit.invoiceId}`} className="text-sm text-primary hover:underline">
                            View Invoice
                          </Link>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreement.services.map((svc) => (
                    <TableRow key={svc.id}>
                      <TableCell className="font-medium">{svc.name}</TableCell>
                      <TableCell className="text-right">{parseFloat(svc.quantity).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${parseFloat(svc.unitPrice).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${(parseFloat(svc.quantity) * parseFloat(svc.unitPrice)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      {agreement.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{agreement.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
