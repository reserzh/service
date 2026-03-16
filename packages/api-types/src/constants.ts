import type {
  JobStatus,
  JobPriority,
  EstimateStatus,
  InvoiceStatus,
  LineItemType,
  CommunicationTrigger,
  AgreementStatus,
  BillingFrequency,
  AgreementVisitStatus,
  CallDirection,
  CallStatus,
} from "./enums";

// Valid status transitions (authoritative — backend is source of truth)
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  new: ["scheduled", "canceled"],
  scheduled: ["dispatched", "new", "canceled"],
  dispatched: ["en_route", "in_progress", "scheduled", "canceled"],
  en_route: ["in_progress", "dispatched", "canceled"],
  in_progress: ["completed", "dispatched", "canceled"],
  completed: [],
  canceled: ["new"],
};

// For technicians, the primary action for each status
export const PRIMARY_NEXT_STATUS: Partial<Record<JobStatus, JobStatus>> = {
  dispatched: "en_route",
  en_route: "in_progress",
  in_progress: "completed",
};

// Status display labels
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  dispatched: "Dispatched",
  en_route: "En Route",
  in_progress: "In Progress",
  completed: "Completed",
  canceled: "Canceled",
};

export const JOB_PRIORITY_LABELS: Record<JobPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  emergency: "Emergency",
};

export const ESTIMATE_STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  partial: "Partial",
  overdue: "Overdue",
  void: "Void",
};

// Primary action button labels for technicians
export const STATUS_ACTION_LABELS: Partial<Record<JobStatus, string>> = {
  dispatched: "On My Way",
  en_route: "Start Job",
  in_progress: "Complete Job",
};

// Line item type labels
export const LINE_ITEM_TYPE_LABELS: Record<LineItemType, string> = {
  service: "Service",
  material: "Material",
  labor: "Labor",
  discount: "Discount",
  other: "Other",
};

// Communication trigger labels
export const COMMUNICATION_TRIGGER_LABELS: Record<CommunicationTrigger, string> = {
  invoice_sent: "Invoice Sent",
  estimate_sent: "Estimate Sent",
  job_scheduled: "Job Scheduled",
  job_dispatched: "Job Dispatched",
  tech_en_route: "Tech En Route",
  job_completed: "Job Completed",
  appointment_reminder: "Appointment Reminder",
  custom: "Custom",
};

// Agreement status labels
export const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  canceled: "Canceled",
};

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
  one_time: "One Time",
};

export const AGREEMENT_VISIT_STATUS_LABELS: Record<AgreementVisitStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  skipped: "Skipped",
  canceled: "Canceled",
};

// Call labels
export const CALL_DIRECTION_LABELS: Record<CallDirection, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
};

export const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  initiated: "Initiated",
  ringing: "Ringing",
  in_progress: "In Progress",
  completed: "Completed",
  busy: "Busy",
  no_answer: "No Answer",
  failed: "Failed",
  canceled: "Canceled",
};

// ---- Trade types ----

export const TRADE_TYPES = ["landscaping", "hvac", "plumbing", "electrical", "general"] as const;
export type TradeType = (typeof TRADE_TYPES)[number];

export const TRADE_TYPE_LABELS: Record<TradeType, string> = {
  landscaping: "Landscaping",
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  general: "General / Other",
};

// ---- Seasons & landscaping templates ----

export const SEASONS = ["spring", "summer", "fall", "winter"] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_LABELS: Record<Season, string> = {
  spring: "Spring (Mar–May)",
  summer: "Summer (Jun–Aug)",
  fall: "Fall (Sep–Nov)",
  winter: "Winter (Dec–Feb)",
};

export const SEASON_MONTHS: Record<Season, [number, number]> = {
  spring: [3, 5],
  summer: [6, 8],
  fall: [9, 11],
  winter: [12, 2],
};

export interface SeasonalVisitTemplate {
  season: Season;
  services: string[];
  frequency: "weekly" | "bi-weekly" | "monthly" | "as-needed";
  visitsPerSeason: number;
}

export const LANDSCAPING_SEASONAL_TEMPLATES: SeasonalVisitTemplate[] = [
  {
    season: "spring",
    services: ["Weekly Mowing", "Spring Cleanup", "Fertilization"],
    frequency: "weekly",
    visitsPerSeason: 12,
  },
  {
    season: "summer",
    services: ["Weekly Mowing", "Edging", "Irrigation Check"],
    frequency: "weekly",
    visitsPerSeason: 12,
  },
  {
    season: "fall",
    services: ["Bi-Weekly Mowing", "Leaf Removal", "Aeration"],
    frequency: "bi-weekly",
    visitsPerSeason: 6,
  },
  {
    season: "winter",
    services: ["Snow Removal", "Equipment Maintenance"],
    frequency: "as-needed",
    visitsPerSeason: 4,
  },
];

// ---- Property metadata types ----

export type IrrigationType = "none" | "sprinkler" | "drip" | "manual";
export type SlopeType = "flat" | "slight" | "moderate" | "steep";
export type MeasurementUnit = "sqft" | "acre";

export interface ServiceZone {
  name: string;
  areaSqft?: number;
  notes?: string;
}

export interface PropertyMetadata {
  serviceZones?: ServiceZone[];
  irrigationType?: IrrigationType;
  grassType?: string;
  slope?: SlopeType;
  gateCode?: string;
  obstacles?: string[];
}

export const DEFAULT_SERVICE_ZONES = [
  "Front Yard",
  "Back Yard",
  "Side Yard (Left)",
  "Side Yard (Right)",
  "Garden Beds",
  "Driveway Edge",
];

export const IRRIGATION_TYPES: IrrigationType[] = ["none", "sprinkler", "drip", "manual"];
export const IRRIGATION_TYPE_LABELS: Record<IrrigationType, string> = {
  none: "None",
  sprinkler: "Sprinkler System",
  drip: "Drip Irrigation",
  manual: "Manual Watering",
};

export const SLOPE_TYPES: SlopeType[] = ["flat", "slight", "moderate", "steep"];
export const SLOPE_TYPE_LABELS: Record<SlopeType, string> = {
  flat: "Flat",
  slight: "Slight",
  moderate: "Moderate",
  steep: "Steep",
};

export const COMMON_OBSTACLES = ["Pool", "Trampoline", "Shed", "Patio", "Deck", "Playground", "Garden", "Fence"];

// ---- Equipment types ----

export const EQUIPMENT_TYPES = [
  "mower",
  "trimmer",
  "blower",
  "edger",
  "chainsaw",
  "spreader",
  "compactor",
  "vehicle",
  "trailer",
  "dump_trailer",
  "skid_steer",
  "other",
] as const;
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number];

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  mower: "Mower",
  trimmer: "Trimmer",
  blower: "Blower",
  edger: "Edger",
  chainsaw: "Chainsaw",
  spreader: "Spreader",
  compactor: "Compactor",
  vehicle: "Vehicle",
  trailer: "Trailer",
  dump_trailer: "Dump Trailer",
  skid_steer: "Skid Steer",
  other: "Other",
};

// Valid agreement status transitions
export const VALID_AGREEMENT_TRANSITIONS: Record<AgreementStatus, AgreementStatus[]> = {
  draft: ["active", "canceled"],
  active: ["paused", "completed", "canceled"],
  paused: ["active", "canceled"],
  completed: [],
  canceled: ["draft"],
};
