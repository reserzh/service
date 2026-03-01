// ---------------------------------------------------------------------------
// QuickBooks Online REST API types
// ---------------------------------------------------------------------------

/** QBO API response wrapper */
export interface QBQueryResponse<T> {
  startPosition?: number;
  maxResults?: number;
  totalCount?: number;
}

export type QBResponse<T> = {
  QueryResponse?: QBQueryResponse<T> & Record<string, T[] | number | undefined>;
} & Record<string, unknown>;

/** QBO reference type used in many entities */
export interface QBRef {
  value: string;
  name?: string;
}

/** QBO physical address */
export interface QBAddr {
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
  Country?: string;
}

/** QBO email */
export interface QBEmailAddr {
  Address: string;
}

/** QBO phone */
export interface QBPhoneNumber {
  FreeFormNumber: string;
}

// ---------------------------------------------------------------------------
// Customer
// ---------------------------------------------------------------------------
export interface QBCustomer {
  Id?: string;
  SyncToken?: string;
  DisplayName: string;
  GivenName?: string;
  FamilyName?: string;
  CompanyName?: string;
  PrimaryEmailAddr?: QBEmailAddr;
  PrimaryPhone?: QBPhoneNumber;
  BillAddr?: QBAddr;
  Active?: boolean;
}

// ---------------------------------------------------------------------------
// Item (pricebook)
// ---------------------------------------------------------------------------
export interface QBItem {
  Id?: string;
  SyncToken?: string;
  Name: string;
  Sku?: string;
  Description?: string;
  Type: "Service" | "NonInventory" | "Inventory";
  UnitPrice?: number;
  IncomeAccountRef?: QBRef;
  ExpenseAccountRef?: QBRef;
  Active?: boolean;
}

// ---------------------------------------------------------------------------
// Invoice
// ---------------------------------------------------------------------------
export interface QBInvoiceLine {
  Amount: number;
  DetailType: "SalesItemLineDetail" | "SubTotalLineDetail" | "DescriptionOnly";
  Description?: string;
  SalesItemLineDetail?: {
    ItemRef: QBRef;
    UnitPrice?: number;
    Qty?: number;
  };
}

export interface QBInvoice {
  Id?: string;
  SyncToken?: string;
  DocNumber?: string;
  CustomerRef: QBRef;
  Line: QBInvoiceLine[];
  DueDate?: string;
  TxnDate?: string;
  BillEmail?: QBEmailAddr;
  EmailStatus?: "NotSet" | "NeedToSend" | "EmailSent";
}

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------
export interface QBPaymentLine {
  Amount: number;
  LinkedTxn: Array<{
    TxnId: string;
    TxnType: "Invoice";
  }>;
}

export interface QBPayment {
  Id?: string;
  SyncToken?: string;
  TotalAmt: number;
  CustomerRef: QBRef;
  Line: QBPaymentLine[];
  PaymentMethodRef?: QBRef;
  TxnDate?: string;
}

// ---------------------------------------------------------------------------
// Estimate
// ---------------------------------------------------------------------------
export interface QBEstimate {
  Id?: string;
  SyncToken?: string;
  DocNumber?: string;
  CustomerRef: QBRef;
  Line: QBInvoiceLine[];
  TxnDate?: string;
  ExpirationDate?: string;
  TxnStatus?: "Pending" | "Accepted" | "Closed" | "Rejected";
}

// ---------------------------------------------------------------------------
// Account (for settings dropdowns)
// ---------------------------------------------------------------------------
export interface QBAccount {
  Id: string;
  Name: string;
  AccountType: string;
  AccountSubType?: string;
  Active: boolean;
  CurrentBalance?: number;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------
export interface QBErrorDetail {
  Message: string;
  Detail?: string;
  code?: string;
  element?: string;
}

export interface QBErrorResponse {
  Fault?: {
    Error: QBErrorDetail[];
    type: string;
  };
}
