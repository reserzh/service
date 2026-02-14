"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Send,
  Check,
  X,
  Star,
  User,
  MapPin,
  Calendar,
  Briefcase,
} from "lucide-react";
import { format } from "date-fns";
import {
  sendEstimateAction,
  approveEstimateAction,
  declineEstimateAction,
} from "@/actions/estimates";
import { showToast } from "@/lib/toast";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  declined: { label: "Declined", variant: "destructive" },
  expired: { label: "Expired", variant: "secondary" },
};

interface EstimateOption {
  id: string;
  name: string;
  description: string | null;
  total: string;
  isRecommended: boolean;
  sortOrder: number;
  items: {
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
    type: string;
  }[];
}

interface EstimateData {
  id: string;
  estimateNumber: string;
  summary: string;
  status: string;
  notes: string | null;
  internalNotes: string | null;
  validUntil: string | null;
  totalAmount: string | null;
  approvedOptionId: string | null;
  approvedAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  customer: { id: string; firstName: string; lastName: string; email: string | null; phone: string } | null;
  property: { id: string; addressLine1: string; city: string; state: string; zip: string | null } | null;
  createdByUser: { id: string; firstName: string; lastName: string } | null;
  options: EstimateOption[];
  linkedJob: { id: string; jobNumber: string; summary: string; status: string } | null;
}

export function EstimateDetailContent({ estimate }: { estimate: EstimateData }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const sc = statusConfig[estimate.status] ?? { label: estimate.status, variant: "secondary" as const };
  const isDraft = estimate.status === "draft";
  const canApprove = ["sent", "viewed"].includes(estimate.status);

  async function handleSend() {
    setLoading("send");
    const result = await sendEstimateAction(estimate.id);
    setLoading(null);
    if (result.error) {
      showToast.error("Failed to send estimate", result.error);
    } else {
      showToast.success("Estimate sent", "The customer will receive it shortly.");
      router.refresh();
    }
  }

  async function handleApprove(optionId: string) {
    setLoading("approve");
    const result = await approveEstimateAction(estimate.id, optionId);
    setLoading(null);
    if (result.error) {
      showToast.error("Failed to approve estimate", result.error);
    } else {
      showToast.success("Estimate approved", "You can now create a job from this estimate.");
      router.refresh();
    }
  }

  async function handleDecline() {
    setLoading("decline");
    const result = await declineEstimateAction(estimate.id);
    setLoading(null);
    if (result.error) {
      showToast.error("Failed to decline estimate", result.error);
    } else {
      showToast.success("Estimate declined", "The estimate has been marked as declined.");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title={estimate.estimateNumber}
          description={estimate.summary}
          breadcrumbs={[
            { label: "Estimates", href: "/estimates" },
            { label: estimate.estimateNumber },
          ]}
        >
          <div className="flex items-center gap-2">
            <Badge variant={sc.variant} className="text-sm">{sc.label}</Badge>

            {isDraft && (
              <Button size="sm" onClick={handleSend} disabled={loading === "send"}>
                <Send className="mr-2 h-3.5 w-3.5" />
                Send to Customer
              </Button>
            )}

            {canApprove && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" disabled={loading === "decline"}>
                    <X className="mr-2 h-3.5 w-3.5" />
                    Decline
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Decline this estimate?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the estimate as declined. You can still create a new estimate for this customer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDecline}>Decline</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </PageHeader>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Customer</p>
                {estimate.customer ? (
                  <>
                    <Link href={`/customers/${estimate.customer.id}`} className="text-sm text-primary hover:underline">
                      {estimate.customer.firstName} {estimate.customer.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{estimate.customer.phone}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Unknown</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Property</p>
                {estimate.property ? (
                  <>
                    <p className="text-sm">{estimate.property.addressLine1}</p>
                    <p className="text-xs text-muted-foreground">
                      {estimate.property.city}, {estimate.property.state} {estimate.property.zip}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Unknown</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Details</p>
                <p className="text-sm">Created {format(new Date(estimate.createdAt), "MMM d, yyyy")}</p>
                {estimate.validUntil && (
                  <p className="text-xs text-muted-foreground">
                    Valid until {format(new Date(estimate.validUntil), "MMM d, yyyy")}
                  </p>
                )}
                {estimate.sentAt && (
                  <p className="text-xs text-muted-foreground">
                    Sent {format(new Date(estimate.sentAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Linked Job */}
      {estimate.linkedJob && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Linked Job</p>
                <Link href={`/jobs/${estimate.linkedJob.id}`} className="text-sm text-primary hover:underline">
                  {estimate.linkedJob.jobNumber} - {estimate.linkedJob.summary}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Options</h3>

        {estimate.options.map((option) => {
          const isApproved = estimate.approvedOptionId === option.id;

          return (
            <Card key={option.id} className={isApproved ? "border-primary" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{option.name}</CardTitle>
                  {option.isRecommended && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" /> Recommended
                    </Badge>
                  )}
                  {isApproved && (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" /> Approved
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold">
                    ${Number(option.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  {canApprove && !isApproved && (
                    <Button size="sm" onClick={() => handleApprove(option.id)} disabled={loading === "approve"}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                </div>
              </CardHeader>
              {option.description && (
                <CardContent className="pt-0 pb-3">
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </CardContent>
              )}
              <CardContent className="pt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20">Type</TableHead>
                      <TableHead className="w-20 text-right">Qty</TableHead>
                      <TableHead className="w-28 text-right">Unit Price</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {option.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                        <TableCell className="text-right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">${Number(item.total).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes */}
      {(estimate.notes || estimate.internalNotes) && (
        <div className="grid gap-4 md:grid-cols-2">
          {estimate.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
              </CardContent>
            </Card>
          )}
          {estimate.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{estimate.internalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
