import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// ---------- Types ----------

interface CompanyInfo {
  name: string;
  email: string;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  licenseNumber?: string | null;
  website?: string | null;
}

interface InvoiceLineItem {
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  type: string;
}

interface InvoicePayment {
  amount: string;
  method: string;
  status: string;
  processedAt: Date;
}

interface InvoicePdfData {
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
  createdAt: Date;
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
  } | null;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
}

interface EstimateOptionItem {
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  type: string;
}

interface EstimateOption {
  name: string;
  description: string | null;
  total: string;
  isRecommended: boolean;
  items: EstimateOptionItem[];
}

interface EstimatePdfData {
  estimateNumber: string;
  summary: string;
  status: string;
  notes: string | null;
  validUntil: string | null;
  totalAmount: string | null;
  createdAt: Date;
  customer: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string;
  } | null;
  property: {
    addressLine1: string;
    city: string;
    state: string;
    zip: string | null;
  } | null;
  options: EstimateOption[];
}

// ---------- Helpers ----------

const PRIMARY_COLOR: [number, number, number] = [15, 23, 42]; // slate-900
const ACCENT_COLOR: [number, number, number] = [59, 130, 246]; // blue-500
const MUTED_COLOR: [number, number, number] = [100, 116, 139]; // slate-500

function formatCurrency(value: string | number): string {
  return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function addCompanyHeader(doc: jsPDF, company: CompanyInfo): number {
  // Company name
  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(company.name, 14, 22);

  // Company details on right side
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED_COLOR);

  const rightX = 196;
  let rightY = 14;

  if (company.phone) {
    doc.text(company.phone, rightX, rightY, { align: "right" });
    rightY += 4;
  }
  doc.text(company.email, rightX, rightY, { align: "right" });
  rightY += 4;
  if (company.addressLine1) {
    doc.text(company.addressLine1, rightX, rightY, { align: "right" });
    rightY += 4;
  }
  if (company.city && company.state) {
    const cityLine = `${company.city}, ${company.state} ${company.zip || ""}`.trim();
    doc.text(cityLine, rightX, rightY, { align: "right" });
    rightY += 4;
  }
  if (company.licenseNumber) {
    doc.text(`License: ${company.licenseNumber}`, rightX, rightY, { align: "right" });
    rightY += 4;
  }

  // Divider line
  const dividerY = Math.max(30, rightY + 2);
  doc.setDrawColor(...ACCENT_COLOR);
  doc.setLineWidth(0.5);
  doc.line(14, dividerY, 196, dividerY);

  return dividerY + 6;
}

function addCustomerBlock(
  doc: jsPDF,
  customer: { firstName: string; lastName: string; email: string | null; phone: string } | null,
  startY: number,
  label: string = "Bill To"
): number {
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), 14, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...PRIMARY_COLOR);

  let y = startY + 5;
  if (customer) {
    doc.setFont("helvetica", "bold");
    doc.text(`${customer.firstName} ${customer.lastName}`, 14, y);
    doc.setFont("helvetica", "normal");
    y += 4.5;
    if (customer.email) {
      doc.setTextColor(...MUTED_COLOR);
      doc.text(customer.email, 14, y);
      y += 4.5;
    }
    doc.setTextColor(...MUTED_COLOR);
    doc.text(customer.phone, 14, y);
    y += 4.5;
  } else {
    doc.text("N/A", 14, y);
    y += 5;
  }

  return y + 2;
}

const paymentMethodLabels: Record<string, string> = {
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  ach: "ACH",
  cash: "Cash",
  check: "Check",
  other: "Other",
};

// ---------- Invoice PDF ----------

export function generateInvoicePdf(company: CompanyInfo, invoice: InvoicePdfData): ArrayBuffer {
  const doc = new jsPDF();

  // Header
  let y = addCompanyHeader(doc, company);

  // Invoice title + number block on right
  doc.setFontSize(22);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 196, y + 2, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED_COLOR);
  doc.text(invoice.invoiceNumber, 196, y + 8, { align: "right" });

  // Status
  const statusLabel = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
  doc.text(`Status: ${statusLabel}`, 196, y + 13, { align: "right" });

  // Customer info
  y = addCustomerBlock(doc, invoice.customer, y);

  // Invoice meta (dates)
  const metaStartY = y;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Date: ${format(new Date(invoice.createdAt), "MMM d, yyyy")}`, 14, metaStartY);
  doc.text(`Due Date: ${format(new Date(invoice.dueDate), "MMM d, yyyy")}`, 14, metaStartY + 5);
  y = metaStartY + 12;

  // Line items table
  autoTable(doc, {
    startY: y,
    head: [["Description", "Type", "Qty", "Unit Price", "Total"]],
    body: invoice.lineItems.map((item) => [
      item.description,
      item.type.charAt(0).toUpperCase() + item.type.slice(1),
      Number(item.quantity).toString(),
      formatCurrency(item.unitPrice),
      formatCurrency(item.total),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: ACCENT_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 25 },
      2: { cellWidth: 18, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
      4: { cellWidth: 30, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6;

  // Totals block (right-aligned)
  const totalsX = 140;
  const valuesX = 196;

  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", totalsX, y);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(formatCurrency(invoice.subtotal), valuesX, y, { align: "right" });
  y += 5;

  if (Number(invoice.taxRate) > 0) {
    doc.setTextColor(...MUTED_COLOR);
    doc.text(`Tax (${(Number(invoice.taxRate) * 100).toFixed(2)}%)`, totalsX, y);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(formatCurrency(invoice.taxAmount), valuesX, y, { align: "right" });
    y += 5;
  }

  // Total line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(totalsX, y, valuesX, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("Total", totalsX, y);
  doc.text(formatCurrency(invoice.total), valuesX, y, { align: "right" });
  y += 6;

  // Amount paid & balance due
  if (Number(invoice.amountPaid) > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED_COLOR);
    doc.text("Amount Paid", totalsX, y);
    doc.setTextColor(22, 163, 74); // green-600
    doc.text(`-${formatCurrency(invoice.amountPaid)}`, valuesX, y, { align: "right" });
    y += 5;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const balanceDue = Number(invoice.balanceDue);
  doc.setTextColor(balanceDue > 0 ? 220 : 22, balanceDue > 0 ? 38 : 163, balanceDue > 0 ? 38 : 74);
  doc.text("Balance Due", totalsX, y);
  doc.text(formatCurrency(invoice.balanceDue), valuesX, y, { align: "right" });
  y += 10;

  // Payment history
  if (invoice.payments.length > 0) {
    // Check for page break
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("Payment History", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Date", "Method", "Status", "Amount"]],
      body: invoice.payments.map((p) => [
        format(new Date(p.processedAt), "MMM d, yyyy"),
        paymentMethodLabels[p.method] ?? p.method,
        p.status.charAt(0).toUpperCase() + p.status.slice(1),
        formatCurrency(p.amount),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: [100, 116, 139], // slate
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        3: { halign: "right" },
      },
      margin: { left: 14, right: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Notes
  if (invoice.notes) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("Notes", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED_COLOR);
    const noteLines = doc.splitTextToSize(invoice.notes, 178);
    doc.text(noteLines, 14, y);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${company.name} | ${invoice.invoiceNumber} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  return doc.output("arraybuffer");
}

// ---------- Estimate PDF ----------

export function generateEstimatePdf(company: CompanyInfo, estimate: EstimatePdfData): ArrayBuffer {
  const doc = new jsPDF();

  // Header
  let y = addCompanyHeader(doc, company);

  // Estimate title on right
  doc.setFontSize(22);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFont("helvetica", "bold");
  doc.text("ESTIMATE", 196, y + 2, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED_COLOR);
  doc.text(estimate.estimateNumber, 196, y + 8, { align: "right" });

  const statusLabel = estimate.status.charAt(0).toUpperCase() + estimate.status.slice(1);
  doc.text(`Status: ${statusLabel}`, 196, y + 13, { align: "right" });

  // Customer info
  y = addCustomerBlock(doc, estimate.customer, y, "Prepared For");

  // Property
  if (estimate.property) {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont("helvetica", "bold");
    doc.text("PROPERTY", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(estimate.property.addressLine1, 14, y + 5);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(
      `${estimate.property.city}, ${estimate.property.state} ${estimate.property.zip || ""}`.trim(),
      14,
      y + 9.5
    );
    y += 16;
  }

  // Meta info
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Date: ${format(new Date(estimate.createdAt), "MMM d, yyyy")}`, 14, y);
  if (estimate.validUntil) {
    doc.text(`Valid Until: ${format(new Date(estimate.validUntil), "MMM d, yyyy")}`, 14, y + 5);
    y += 5;
  }
  y += 8;

  // Summary
  if (estimate.summary) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("Summary", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED_COLOR);
    const summaryLines = doc.splitTextToSize(estimate.summary, 178);
    doc.text(summaryLines, 14, y);
    y += summaryLines.length * 4.5 + 4;
  }

  // Options
  for (const option of estimate.options) {
    // Check for page break
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    // Option header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);

    let optionTitle = option.name;
    if (option.isRecommended) optionTitle += " (Recommended)";
    doc.text(optionTitle, 14, y);

    doc.setFontSize(12);
    doc.text(formatCurrency(option.total), 196, y, { align: "right" });
    y += 2;

    if (option.description) {
      y += 4;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED_COLOR);
      const descLines = doc.splitTextToSize(option.description, 178);
      doc.text(descLines, 14, y);
      y += descLines.length * 4 + 2;
    }

    // Items table
    autoTable(doc, {
      startY: y,
      head: [["Description", "Type", "Qty", "Unit Price", "Total"]],
      body: option.items.map((item) => [
        item.description,
        item.type.charAt(0).toUpperCase() + item.type.slice(1),
        Number(item.quantity).toString(),
        formatCurrency(item.unitPrice),
        formatCurrency(item.total),
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: {
        fillColor: ACCENT_COLOR,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: 25 },
        2: { cellWidth: 18, halign: "right" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
      margin: { left: 14, right: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 4;

    // Option total
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(`Option Total: ${formatCurrency(option.total)}`, 196, y, { align: "right" });
    y += 10;
  }

  // Notes
  if (estimate.notes) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("Notes", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED_COLOR);
    const noteLines = doc.splitTextToSize(estimate.notes, 178);
    doc.text(noteLines, 14, y);
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${company.name} | ${estimate.estimateNumber} | Page ${i} of ${pageCount}`,
      105,
      290,
      { align: "center" }
    );
  }

  return doc.output("arraybuffer");
}
