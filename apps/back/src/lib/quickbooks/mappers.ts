import type {
  QBCustomer,
  QBItem,
  QBInvoice,
  QBInvoiceLine,
  QBPayment,
  QBEstimate,
} from "./types";

// ---------------------------------------------------------------------------
// Tax strategy options passed to invoice/estimate mappers
// ---------------------------------------------------------------------------
export interface TaxMappingOptions {
  taxStrategy: "none" | "global" | "per_line";
  /** Global tax rate as a percentage (e.g. 8.25 for 8.25%). Used when taxStrategy === "global". */
  globalTaxRate?: number;
}

// ---------------------------------------------------------------------------
// Customer → QBCustomer
// ---------------------------------------------------------------------------
export function mapCustomerToQB(customer: {
  firstName: string;
  lastName: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  id: string;
}, address?: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
} | null, syncToken?: string): QBCustomer {
  // DisplayName must be unique in QB — use "FirstName LastName" with ID suffix fallback
  const displayName = customer.companyName
    ? customer.companyName
    : `${customer.firstName} ${customer.lastName}`;

  const qbCustomer: QBCustomer = {
    DisplayName: displayName,
    GivenName: customer.firstName,
    FamilyName: customer.lastName,
    ...(customer.companyName ? { CompanyName: customer.companyName } : {}),
    ...(customer.email ? { PrimaryEmailAddr: { Address: customer.email } } : {}),
    ...(customer.phone ? { PrimaryPhone: { FreeFormNumber: customer.phone } } : {}),
    Active: true,
  };

  if (address) {
    qbCustomer.BillAddr = {
      ...(address.addressLine1 ? { Line1: address.addressLine1 } : {}),
      ...(address.addressLine2 ? { Line2: address.addressLine2 } : {}),
      ...(address.city ? { City: address.city } : {}),
      ...(address.state ? { CountrySubDivisionCode: address.state } : {}),
      ...(address.zip ? { PostalCode: address.zip } : {}),
    };
  }

  if (syncToken) {
    qbCustomer.SyncToken = syncToken;
  }

  return qbCustomer;
}

// ---------------------------------------------------------------------------
// PricebookItem → QBItem
// ---------------------------------------------------------------------------
export function mapPricebookItemToQB(
  item: {
    name: string;
    sku?: string | null;
    description?: string | null;
    type: string;
    unitPrice: string;
  },
  incomeAccountRef?: { value: string; name?: string },
  expenseAccountRef?: { value: string; name?: string },
  syncToken?: string
): QBItem {
  const qbItem: QBItem = {
    Name: item.name.slice(0, 100), // QB max 100 chars
    ...(item.sku ? { Sku: item.sku } : {}),
    ...(item.description ? { Description: item.description } : {}),
    Type: item.type === "material" ? "NonInventory" : "Service",
    UnitPrice: parseFloat(item.unitPrice),
    Active: true,
  };

  if (incomeAccountRef) {
    qbItem.IncomeAccountRef = incomeAccountRef;
  }
  if (expenseAccountRef) {
    qbItem.ExpenseAccountRef = expenseAccountRef;
  }
  if (syncToken) {
    qbItem.SyncToken = syncToken;
  }

  return qbItem;
}

// ---------------------------------------------------------------------------
// Invoice → QBInvoice
// ---------------------------------------------------------------------------
export function mapInvoiceToQB(
  invoice: {
    invoiceNumber: string;
    dueDate?: Date | null;
    createdAt: Date;
  },
  customerQBId: string,
  lineItems: Array<{
    description?: string | null;
    quantity: number | string;
    unitPrice: string;
    total: string;
    pricebookItemId?: string | null;
    taxable?: boolean;
  }>,
  itemMappings: Map<string, string>, // localId → qbItemId
  syncToken?: string,
  taxOptions?: TaxMappingOptions
): QBInvoice {
  const strategy = taxOptions?.taxStrategy ?? "none";

  const lines: QBInvoiceLine[] = lineItems.map((li) => {
    const qty = typeof li.quantity === "string" ? parseFloat(li.quantity) : li.quantity;
    const unitPrice = parseFloat(li.unitPrice);

    // If a pricebook item is mapped to QB, use its reference
    const qbItemId = li.pricebookItemId ? itemMappings.get(li.pricebookItemId) : undefined;

    const taxCodeRef =
      strategy === "per_line"
        ? { value: li.taxable !== false ? "TAX" : "NON" }
        : undefined;

    if (qbItemId) {
      return {
        Amount: parseFloat(li.total),
        DetailType: "SalesItemLineDetail" as const,
        Description: li.description ?? undefined,
        SalesItemLineDetail: {
          ItemRef: { value: qbItemId },
          UnitPrice: unitPrice,
          Qty: qty,
          ...(taxCodeRef ? { TaxCodeRef: taxCodeRef } : {}),
        },
      };
    }

    // Ad-hoc line items — use description-only line
    return {
      Amount: parseFloat(li.total),
      DetailType: "SalesItemLineDetail" as const,
      Description: li.description ?? "Service",
      SalesItemLineDetail: {
        ItemRef: { value: "1" }, // default "Services" item in QB
        UnitPrice: unitPrice,
        Qty: qty,
        ...(taxCodeRef ? { TaxCodeRef: taxCodeRef } : {}),
      },
    };
  });

  const qbInvoice: QBInvoice = {
    DocNumber: invoice.invoiceNumber,
    CustomerRef: { value: customerQBId },
    Line: lines,
    TxnDate: formatDate(invoice.createdAt),
    ...(invoice.dueDate ? { DueDate: formatDate(invoice.dueDate) } : {}),
  };

  // Apply global tax if configured
  if (strategy === "global" && taxOptions?.globalTaxRate) {
    const subtotal = lines.reduce((sum, l) => sum + l.Amount, 0);
    const totalTax = Math.round(subtotal * (taxOptions.globalTaxRate / 100) * 100) / 100;
    qbInvoice.TxnTaxDetail = {
      TotalTax: totalTax,
    };
  }

  if (syncToken) {
    qbInvoice.SyncToken = syncToken;
  }

  return qbInvoice;
}

// ---------------------------------------------------------------------------
// Payment → QBPayment
// ---------------------------------------------------------------------------
export function mapPaymentToQB(
  payment: {
    amount: string;
    createdAt: Date;
  },
  customerQBId: string,
  invoiceQBId: string,
  syncToken?: string
): QBPayment {
  const qbPayment: QBPayment = {
    TotalAmt: parseFloat(payment.amount),
    CustomerRef: { value: customerQBId },
    Line: [
      {
        Amount: parseFloat(payment.amount),
        LinkedTxn: [{ TxnId: invoiceQBId, TxnType: "Invoice" }],
      },
    ],
    TxnDate: formatDate(payment.createdAt),
  };

  if (syncToken) {
    qbPayment.SyncToken = syncToken;
  }

  return qbPayment;
}

// ---------------------------------------------------------------------------
// Estimate → QBEstimate
// ---------------------------------------------------------------------------
export function mapEstimateToQB(
  estimate: {
    estimateNumber: string;
    createdAt: Date;
    validUntil?: Date | null;
  },
  customerQBId: string,
  lineItems: Array<{
    description?: string | null;
    quantity: number | string;
    unitPrice: string;
    total: string;
    pricebookItemId?: string | null;
    taxable?: boolean;
  }>,
  itemMappings: Map<string, string>,
  syncToken?: string,
  taxOptions?: TaxMappingOptions
): QBEstimate {
  const strategy = taxOptions?.taxStrategy ?? "none";

  const lines: QBInvoiceLine[] = lineItems.map((li) => {
    const qty = typeof li.quantity === "string" ? parseFloat(li.quantity) : li.quantity;
    const unitPrice = parseFloat(li.unitPrice);
    const qbItemId = li.pricebookItemId ? itemMappings.get(li.pricebookItemId) : undefined;

    const taxCodeRef =
      strategy === "per_line"
        ? { value: li.taxable !== false ? "TAX" : "NON" }
        : undefined;

    return {
      Amount: parseFloat(li.total),
      DetailType: "SalesItemLineDetail" as const,
      Description: li.description ?? undefined,
      SalesItemLineDetail: {
        ItemRef: { value: qbItemId ?? "1" },
        UnitPrice: unitPrice,
        Qty: qty,
        ...(taxCodeRef ? { TaxCodeRef: taxCodeRef } : {}),
      },
    };
  });

  const qbEstimate: QBEstimate = {
    DocNumber: estimate.estimateNumber,
    CustomerRef: { value: customerQBId },
    Line: lines,
    TxnDate: formatDate(estimate.createdAt),
    ...(estimate.validUntil ? { ExpirationDate: formatDate(estimate.validUntil) } : {}),
  };

  // Apply global tax if configured
  if (strategy === "global" && taxOptions?.globalTaxRate) {
    const subtotal = lines.reduce((sum, l) => sum + l.Amount, 0);
    const totalTax = Math.round(subtotal * (taxOptions.globalTaxRate / 100) * 100) / 100;
    qbEstimate.TxnTaxDetail = {
      TotalTax: totalTax,
    };
  }

  if (syncToken) {
    qbEstimate.SyncToken = syncToken;
  }

  return qbEstimate;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
