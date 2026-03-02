export type DashboardStats = {
  todaysJobs: number;
  todaysCompleted: number;
  revenueMTD: number;
  invoicesPaidMTD: number;
  openEstimates: number;
  openEstimatesValue: number;
  overdueInvoices: number;
  overdueValue: number;
};

export type UpcomingJob = {
  id: string;
  jobNumber: string | null;
  summary: string;
  status: string;
  priority: string | null;
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
  assignedFirstName: string | null;
  assignedLastName: string | null;
  assignedColor: string | null;
};

export type ActivityItem = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: Date;
  userId: string | null;
  userFirstName: string | null;
  userLastName: string | null;
};

export type DashboardData = {
  stats: DashboardStats;
  activity: ActivityItem[];
  upcoming: UpcomingJob[];
  firstName: string;
};

export type WidgetId = "stats" | "quick-actions" | "schedule" | "activity" | "chart" | "team";

export type DashboardLayoutProps = {
  data: DashboardData;
  hiddenWidgets: Set<WidgetId>;
};

export type DashboardPresetId =
  | "classic"
  | "blueprint"
  | "mission-control"
  | "glass"
  | "executive"
  | "arctic"
  | "ocean";

export type DashboardPreset = {
  id: DashboardPresetId;
  name: string;
  description: string;
  colors: [string, string, string];
  supportedWidgets: WidgetId[];
};

export const DASHBOARD_PRESETS: DashboardPreset[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Clean and familiar layout",
    colors: ["#ffffff", "#f8fafc", "#3b82f6"],
    supportedWidgets: ["stats", "quick-actions", "schedule", "activity"],
  },
  {
    id: "blueprint",
    name: "Blueprint Operations",
    description: "Hero greeting, gauges, and tech grid",
    colors: ["#1e3a5f", "#2563eb", "#f59e0b"],
    supportedWidgets: ["stats", "quick-actions", "schedule", "activity", "team"],
  },
  {
    id: "mission-control",
    name: "Mission Control",
    description: "Tactical operations view",
    colors: ["#0f172a", "#22d3ee", "#f43f5e"],
    supportedWidgets: ["stats", "quick-actions", "schedule", "activity", "chart"],
  },
  {
    id: "glass",
    name: "Glass Command Center",
    description: "Glassmorphism with ring charts",
    colors: ["#0c0a1d", "#8b5cf6", "#06b6d4"],
    supportedWidgets: ["stats", "quick-actions", "schedule", "activity", "chart"],
  },
  {
    id: "executive",
    name: "Executive Midnight",
    description: "Refined classic variant",
    colors: ["#030712", "#1f2937", "#6366f1"],
    supportedWidgets: ["stats", "quick-actions", "schedule", "activity"],
  },
  {
    id: "arctic",
    name: "Arctic Minimal",
    description: "Ultra-clean light design",
    colors: ["#ffffff", "#f1f5f9", "#64748b"],
    supportedWidgets: ["stats", "quick-actions", "schedule", "activity"],
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    description: "Blue-tinted calming layout",
    colors: ["#eff6ff", "#dbeafe", "#0369a1"],
    supportedWidgets: ["stats", "quick-actions", "schedule", "activity"],
  },
];

export const DEFAULT_PRESET: DashboardPresetId = "classic";
