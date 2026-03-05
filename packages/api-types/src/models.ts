import type {
  UserRole,
  CustomerType,
  JobStatus,
  JobPriority,
  LineItemType,
  EstimateStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  SignerRole,
  PhotoType,
  TimeEntryType,
  JobAssignmentRole,
  CommunicationType,
  CommunicationStatus,
  CommunicationTrigger,
  AgreementStatus,
  BillingFrequency,
  AgreementVisitStatus,
  CallDirection,
  CallStatus,
  RecordingStatus,
  TranscriptionStatus,
} from "./enums";

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
  startLatitude: string | null;
  startLongitude: string | null;
  endLatitude: string | null;
  endLongitude: string | null;
  isRecurring: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobChecklistItem {
  id: string;
  jobId: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
  completedBy: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobAssignment {
  id: string;
  jobId: string;
  userId: string;
  role: JobAssignmentRole;
  assignedAt: string;
  assignedBy: string;
  user?: Pick<User, "id" | "firstName" | "lastName" | "color">;
}

export interface JobWithRelations extends Job {
  customer: Customer;
  property: Property;
  assignedUser: Pick<User, "id" | "firstName" | "lastName" | "color" | "phone"> | null;
  lineItems: JobLineItem[];
  notes: JobNote[];
  photos: JobPhoto[];
  signatures: JobSignature[];
  checklist: JobChecklistItem[];
  assignments: JobAssignment[];
}

export interface JobLineItem {
  id: string;
  jobId: string;
  pricebookItemId: string | null;
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
  photoType: PhotoType;
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
  pricebookItemId: string | null;
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

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  pricebookItemId: string | null;
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

// ---- Pricebook Models ----

export interface PricebookItem {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  type: LineItemType;
  unitPrice: string;
  unit: string | null;
  costPrice: string | null;
  taxable: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Communication Models ----

export interface CommunicationTemplate {
  id: string;
  tenantId: string;
  name: string;
  type: CommunicationType;
  trigger: CommunicationTrigger | null;
  subject: string;
  body: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationLogEntry {
  id: string;
  tenantId: string;
  templateId: string | null;
  recipientEmail: string;
  recipientPhone: string | null;
  recipientName: string;
  subject: string;
  channel: CommunicationType;
  status: CommunicationStatus;
  entityType: string | null;
  entityId: string | null;
  sentBy: string;
  resendMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

// ---- Agreement Models ----

export interface Agreement {
  id: string;
  tenantId: string;
  agreementNumber: string;
  customerId: string;
  propertyId: string;
  status: AgreementStatus;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  billingFrequency: BillingFrequency;
  billingAmount: string;
  totalValue: string;
  visitsPerYear: number;
  autoRenew: boolean;
  renewalReminderDays: number;
  notes: string | null;
  internalNotes: string | null;
  createdBy: string;
  activatedAt: string | null;
  pausedAt: string | null;
  canceledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementService {
  id: string;
  tenantId: string;
  agreementId: string;
  pricebookItemId: string | null;
  name: string;
  description: string | null;
  quantity: string;
  unitPrice: string;
  sortOrder: number;
}

export interface AgreementVisit {
  id: string;
  tenantId: string;
  agreementId: string;
  visitNumber: number;
  status: AgreementVisitStatus;
  scheduledDate: string | null;
  completedDate: string | null;
  jobId: string | null;
  invoiceId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementWithRelations extends Agreement {
  customer: Customer;
  property: Property;
  services: AgreementService[];
  visits: AgreementVisit[];
}

// ---- Time Tracking Models ----

export interface TimeEntry {
  id: string;
  tenantId: string;
  userId: string;
  type: TimeEntryType;
  timestamp: string;
  latitude: string | null;
  longitude: string | null;
  jobId: string | null;
  notes: string | null;
  createdAt: string;
}

// ---- Call / Voice Models ----

export interface Call {
  id: string;
  tenantId: string;
  callSid: string;
  direction: CallDirection;
  fromNumber: string;
  toNumber: string;
  status: CallStatus;
  duration: number | null;
  customerId: string | null;
  jobId: string | null;
  userId: string | null;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CallRecording {
  id: string;
  tenantId: string;
  callId: string;
  recordingSid: string;
  duration: number | null;
  recordingUrl: string | null;
  status: RecordingStatus;
  transcriptionText: string | null;
  transcriptionStatus: TranscriptionStatus;
  createdAt: string;
}

export interface CallWithRelations extends Call {
  customer: Pick<Customer, "id" | "firstName" | "lastName" | "phone"> | null;
  job: Pick<Job, "id" | "jobNumber" | "summary"> | null;
  user: Pick<User, "id" | "firstName" | "lastName"> | null;
  recordings: CallRecording[];
}

// ---- Customer Portal Models ----

export interface CustomerPortalContext {
  customerId: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
}
