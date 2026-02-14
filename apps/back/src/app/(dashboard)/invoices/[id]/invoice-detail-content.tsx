"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Send,
  Ban,
  DollarSign,
  User,
  Calendar,
  Briefcase,
  FileText,
  CreditCard,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import {
  sendInvoiceAction,
  voidInvoiceAction,
  recordPaymentAction,
} from "@/actions/invoices";
import { showToast } from "@/lib/toast";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  partial: { label: "Partial", variant: "outline" },
  overdue: { label: "Overdue", variant: "destructive" },
  void: { label: "Void", variant: "secondary" },
};

const paymentMethodLabels: Record<string, string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  ach: "ACH",
  cash: "Cash",
  check: "Check",
  other: "Other",
};

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  status: string;
  dueDate: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  notes: string | null;
  internalNotes: string | null;
  sentAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  customer: { id: string; firstName: string; lastName: string; email: string | null; phone: string } | null;
  createdByUser: { id: string; firstName: string; lastName: string } | null;
  lineItems: {
    id: string;
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
    type: string;
  }[];
  payments: {
    id: string;
    amount: string;
    method: string;
    status: string;
    referenceNumber: string | null;
    notes: string | null;
    processedAt: Date;
    createdAt: Date;
  }[];
  linkedJob: { id: string; jobNumber: string; summary: string; status: string } | null;
  linkedEstimate: { id: string; estimateNumber: string; summary: string; status: string } | null;
}

export function InvoiceDetailContent({ invoice }: { invoice: InvoiceData }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(invoice.balanceDue);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentRef, setPaymentRef] = useState("");

  const sc = statusConfig[invoice.status] ?? { label: invoice.status, variant: "secondary" as const };
  const isDraft = invoice.status === "draft";
  const canRecordPayment = !["void", "paid"].includes(invoice.status);
  const canVoid = !["void", "paid"].includes(invoice.status);

  async function handleSend() {
    setLoading("send");
    const result = await sendInvoiceAction(invoice.id);
    setLoading(null);
    if (result.error) {
      showToast.error("Failed to send invoice", result.error);
    } else {
      showToast.success("Invoice sent", "The customer will receive it shortly.");
      router.refresh();
    }
  }

  async function handleVoid() {
    setLoading("void");
    const result = await voidInvoiceAction(invoice.id);
    setLoading(null);
    if (result.error) {
      showToast.error("Failed to void invoice", result.error);
    } else {
      showToast.success("Invoice voided", "This invoice has been voided.");
      router.refresh();
    }
  }

  async function handleRecordPayment() {
    setLoading("payment");
    const result = await recordPaymentAction(invoice.id, {
      amount: Number(paymentAmount),
      method: paymentMethod as any,
      referenceNumber: paymentRef || undefined,
    });
    setLoading(null);
    if (result.error) {
      showToast.error("Failed to record payment", result.error);
    } else {
      showToast.success("Payment recorded", `$${Number(paymentAmount).toFixed(2)} received.`);
      setPaymentOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeader
          title={invoice.invoiceNumber}
          description={`Due ${format(new Date(invoice.dueDate), "MMM d, yyyy")}`}
          breadcrumbs={[
            { label: "Invoices", href: "/invoices" },
            { label: invoice.invoiceNumber },
          ]}
        >
          <div className="flex items-center gap-2">
            <Badge variant={sc.variant} className="text-sm">{sc.label}</Badge>

            {isDraft && (
              <Button size="sm" onClick={handleSend} disabled={loading === "send"}>
                <Send className="mr-2 h-3.5 w-3.5" />
                Send
              </Button>
            )}

            {canRecordPayment && (
              <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="default">
                    <DollarSign className="mr-2 h-3.5 w-3.5" />
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Balance due: ${Number(invoice.balanceDue).toFixed(2)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Amount *</Label>
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        min={0.01}
                        step={0.01}
                        max={Number(invoice.balanceDue)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method *</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="debit_card">Debit Card</SelectItem>
                          <SelectItem value="ach">ACH</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reference Number</Label>
                      <Input
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="Check #, transaction ID, etc."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                    <Button onClick={handleRecordPayment} disabled={loading === "payment" || !paymentAmount}>
                      {loading === "payment" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Record Payment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {canVoid && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-destructive">
                    <Ban className="mr-2 h-3.5 w-3.5" />
                    Void
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Void this invoice?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently void the invoice. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleVoid}>Void Invoice</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </PageHeader>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">
              ${Number(invoice.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-green-600">
              ${Number(invoice.amountPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Balance Due</p>
            <p className={`text-2xl font-bold ${Number(invoice.balanceDue) > 0 ? "text-destructive" : ""}`}>
              ${Number(invoice.balanceDue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="text-2xl font-bold">{format(new Date(invoice.dueDate), "MMM d")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer & Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Customer</p>
                {invoice.customer ? (
                  <>
                    <Link href={`/customers/${invoice.customer.id}`} className="text-sm text-primary hover:underline">
                      {invoice.customer.firstName} {invoice.customer.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{invoice.customer.email}</p>
                    <p className="text-xs text-muted-foreground">{invoice.customer.phone}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Unknown</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {invoice.linkedJob && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Linked Job</p>
                  <Link href={`/jobs/${invoice.linkedJob.id}`} className="text-sm text-primary hover:underline">
                    {invoice.linkedJob.jobNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">{invoice.linkedJob.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {invoice.linkedEstimate && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Linked Estimate</p>
                  <Link href={`/estimates/${invoice.linkedEstimate.id}`} className="text-sm text-primary hover:underline">
                    {invoice.linkedEstimate.estimateNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">{invoice.linkedEstimate.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent>
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
              {invoice.lineItems.map((item) => (
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

          <Separator className="my-4" />

          <div className="space-y-1 text-right">
            <div className="flex justify-end gap-8 text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="w-28">${Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.taxRate) > 0 && (
              <div className="flex justify-end gap-8 text-sm">
                <span className="text-muted-foreground">
                  Tax ({(Number(invoice.taxRate) * 100).toFixed(2)}%)
                </span>
                <span className="w-28">${Number(invoice.taxAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-end gap-8 text-base font-semibold">
              <span>Total</span>
              <span className="w-28">${Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{format(new Date(payment.processedAt), "MMM d, yyyy h:mm a")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                        {paymentMethodLabels[payment.method] ?? payment.method}
                      </div>
                    </TableCell>
                    <TableCell>{payment.referenceNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "succeeded" ? "default" : "secondary"} className="capitalize">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(payment.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {(invoice.notes || invoice.internalNotes) && (
        <div className="grid gap-4 md:grid-cols-2">
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
          {invoice.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.internalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
