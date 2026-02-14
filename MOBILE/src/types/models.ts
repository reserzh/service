// ---- Enums ----

export type UserRole = "admin" | "office_manager" | "dispatcher" | "csr" | "technician";
export type CustomerType = "residential" | "commercial";
export type JobStatus = "new" | "scheduled" | "dispatched" | "in_progress" | "completed" | "canceled";
export type JobPriority = "low" | "normal" | "high" | "emergency";
export type LineItemType = "service" | "material" | "labor" | "discount" | "other";
export type EstimateStatus = "draft" | "sent" | "viewed" | "approved" | "declined" | "expired";
export type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "partial" | "overdue" | "void";
export type PaymentMethod = "credit_card" | "debit_card" | "ach" | "cash" | "check" | "other";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type SignerRole = "customer" | "technician";

// ---- Core Models ----

export interface UserContext {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  color: string;
  hourlyRate: string | null;
  canBeDispatched: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  altPhone: string | null;
  companyName: string | null;
  type: CustomerType;
  source: string | null;
  tags: string[] | null;
  notes: string | null;
  doNotContact: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  tenantId: string;
  customerId: string;
  name: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  latitude: string | null;
  longitude: string | null;
  accessNotes: string | null;
  isPrimary: boolean;
}

export interface Equipment {
  id: string;
  tenantId: string;
  propertyId: string;
  customerId: string;
  type: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  installDate: string | null;
  warrantyExpiry: string | null;
  locationInProperty: string | null;
  notes: string | null;
}

// ---- Job Models ----

export interface Job {
  id: string;
  tenantId: string;
  jobNumber: string;
  customerId: string;
  propertyId: string;
  estimateId: string | null;
  assignedTo: string | null;
  status: JobStatus;
  priority: JobPriority;
  jobType: string;
  serviceType: string | null;
  summary: string;
  description: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  dispatchedAt: string | null;
  completedAt: string | null;
  tags: string[] | null;
  internalNotes: string | null;
  customerNotes: string | null;
  totalAmount: string | null;
  isRecurring: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobWithRelations extends Job {
  customer: Customer;
  property: Property;
  assignedUser: Pick<User, "id" | "firstName" | "lastName" | "color" | "phone"> | null;
  lineItems: JobLineItem[];
  notes: JobNote[];
  photos: JobPhoto[];
  signatures: JobSignature[];
}

export interface JobLineItem {
  id: string;
  jobId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  type: LineItemType;
  sortOrder: number;
  createdAt: string;
}

export interface JobNote {
  id: string;
  jobId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user?: Pick<User, "id" | "firstName" | "lastName">;
}

export interface JobPhoto {
  id: string;
  jobId: string;
  userId: string;
  storagePath: string;
  caption: string | null;
  takenAt: string | null;
  createdAt: string;
}

export interface JobSignature {
  id: string;
  jobId: string;
  signerName: string;
  signerRole: SignerRole;
  storagePath: string;
  signedAt: string;
  createdAt: string;
}

// ---- Estimate Models ----

export interface Estimate {
  id: string;
  tenantId: string;
  estimateNumber: string;
  customerId: string;
  propertyId: string;
  jobId: string | null;
  createdBy: string;
  status: EstimateStatus;
  summary: string;
  notes: string | null;
  internalNotes: string | null;
  validUntil: string | null;
  approvedAt: string | null;
  approvedOptionId: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  totalAmount: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateWithRelations extends Estimate {
  customer: Customer;
  property: Property;
  options: EstimateOption[];
}

export interface EstimateOption {
  id: string;
  estimateId: string;
  name: string;
  description: string | null;
  total: string;
  isRecommended: boolean;
  sortOrder: number;
  items: EstimateOptionItem[];
}

export interface EstimateOptionItem {
  id: string;
  optionId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  type: LineItemType;
  sortOrder: number;
}

// ---- Invoice Models ----

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  customerId: string;
  jobId: string | null;
  estimateId: string | null;
  createdBy: string;
  status: InvoiceStatus;
  dueDate: string;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  balanceDue: string;
  notes: string | null;
  internalNotes: string | null;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---- Invoice Relation Models ----

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
  type: LineItemType;
  sortOrder: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  referenceNumber: string | null;
  notes: string | null;
  processedAt: string;
  createdAt: string;
}

export interface InvoiceWithRelations extends Invoice {
  customer: Customer;
  createdByUser: Pick<User, "id" | "firstName" | "lastName">;
  lineItems: InvoiceLineItem[];
  payments: Payment[];
  linkedJob: Pick<Job, "id" | "jobNumber" | "summary" | "status"> | null;
  linkedEstimate: Pick<Estimate, "id" | "estimateNumber" | "summary" | "status"> | null;
}

export interface InvoiceListItem extends Invoice {
  customerFirstName: string;
  customerLastName: string;
}

export interface CustomerWithRelations extends Customer {
  properties: Property[];
  equipment: Equipment[];
}

// ---- API Response Types ----

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}
