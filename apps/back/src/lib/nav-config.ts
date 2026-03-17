import {
  LayoutDashboard,
  CalendarDays,
  Radio,
  Users,
  Briefcase,
  FileText,
  Receipt,
  BarChart3,
  ClipboardCheck,
  PhoneCall,
  ClipboardList,
  Globe,
  Bot,
  Settings,
  Factory,
  Building2,
  Palette,
  Wrench,
  BookOpen,
  CheckSquare,
  FileStack,
  CalendarClock,
  Bell,
  Phone,
  ToggleLeft,
  Link2,
  CreditCard,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/auth";
import { hasPermission, type Resource } from "@/lib/auth/permissions";

// ---- Types ----

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  resource?: Resource;
  children?: NavItem[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface NavUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

// ---- Nav groups (sidebar) ----

export const navGroups: NavGroup[] = [
  {
    // Dashboard — always visible, no label
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Schedule", href: "/schedule", icon: CalendarDays, resource: "schedule" },
      { title: "Dispatch", href: "/dispatch", icon: Radio, resource: "schedule" },
      { title: "Jobs", href: "/jobs", icon: Briefcase, resource: "jobs" },
    ],
  },
  {
    label: "Customers",
    items: [
      { title: "Customers", href: "/customers", icon: Users, resource: "customers" },
      { title: "Calls", href: "/calls", icon: PhoneCall, resource: "calls" },
    ],
  },
  {
    label: "Financial",
    items: [
      { title: "Estimates", href: "/estimates", icon: FileText, resource: "estimates" },
      { title: "Invoices", href: "/invoices", icon: Receipt, resource: "invoices" },
      { title: "Agreements", href: "/agreements", icon: ClipboardList, resource: "agreements" },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: BarChart3,
        resource: "reports",
        children: [
          { title: "Daily Reports", href: "/daily-reports", icon: ClipboardCheck, resource: "reports" },
        ],
      },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Website", href: "/website", icon: Globe, resource: "website" },
      { title: "AI Assistant", href: "/ai-assistant", icon: Bot, resource: "ai_assistant" },
    ],
  },
];

export const settingsNavItem: NavItem = {
  title: "Settings",
  href: "/settings",
  icon: Settings,
  resource: "settings",
};

// ---- Filtering ----

function canAccess(role: UserRole, item: NavItem): boolean {
  if (!item.resource) return true;
  return hasPermission(role, item.resource, "read");
}

function filterItems(role: UserRole, items: NavItem[]): NavItem[] {
  return items
    .filter((item) => canAccess(role, item))
    .map((item) => {
      if (!item.children) return item;
      const filtered = item.children.filter((child) => canAccess(role, child));
      return { ...item, children: filtered.length > 0 ? filtered : undefined };
    });
}

export function getFilteredNavGroups(role: string): NavGroup[] {
  const r = role as UserRole;
  return navGroups
    .map((group) => ({ ...group, items: filterItems(r, group.items) }))
    .filter((group) => group.items.length > 0);
}

export function canAccessSettings(role: string): boolean {
  return hasPermission(role as UserRole, "settings", "read");
}

// ---- All nav items flat (for command palette) ----

function flattenGroups(groups: NavGroup[]): NavItem[] {
  const items: NavItem[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      items.push(item);
      if (item.children) {
        items.push(...item.children);
      }
    }
  }
  items.push(settingsNavItem);
  return items;
}

export function getAllNavItems(): NavItem[] {
  return flattenGroups(navGroups);
}

export function getFilteredNavItems(role: string): NavItem[] {
  const filtered = getFilteredNavGroups(role);
  const items = flattenGroups(filtered);
  if (canAccessSettings(role)) return items;
  return items.filter((i) => i.href !== "/settings");
}

// ---- Quick actions for command palette ----

export interface QuickAction {
  title: string;
  href: string;
  resource?: Resource;
  action?: "create";
}

export const quickActions: QuickAction[] = [
  { title: "New Customer", href: "/customers", resource: "customers", action: "create" },
  { title: "New Job", href: "/jobs/new", resource: "jobs", action: "create" },
  { title: "New Estimate", href: "/estimates/new", resource: "estimates", action: "create" },
  { title: "New Invoice", href: "/invoices/new", resource: "invoices", action: "create" },
];

export function getFilteredQuickActions(role: string): QuickAction[] {
  const r = role as UserRole;
  return quickActions.filter((a) => {
    if (!a.resource) return true;
    return hasPermission(r, a.resource, a.action ?? "create");
  });
}

// ---- Settings sub-nav ----

export interface SettingsNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  section: string;
}

export const settingsNavItems: SettingsNavItem[] = [
  // General
  { label: "Industry", href: "/settings/industry", icon: Factory, section: "General" },
  { label: "Company Profile", href: "/settings/company", icon: Building2, section: "General" },
  { label: "Site Theme", href: "/settings/theme", icon: Palette, section: "General" },
  // Services
  { label: "Services & Pricing", href: "/settings/services", icon: Wrench, section: "Services" },
  { label: "Pricebook", href: "/settings/pricebook", icon: BookOpen, section: "Services" },
  { label: "Checklist Templates", href: "/settings/checklists", icon: CheckSquare, section: "Services" },
  { label: "Estimate Templates", href: "/settings/estimate-templates", icon: FileStack, section: "Services" },
  { label: "Booking Availability", href: "/settings/booking-availability", icon: CalendarClock, section: "Services" },
  { label: "Equipment", href: "/settings/equipment", icon: Truck, section: "Services" },
  // Communications
  { label: "Notifications", href: "/settings/notifications", icon: Bell, section: "Communications" },
  { label: "Voice", href: "/settings/voice", icon: Phone, section: "Communications" },
  // System
  { label: "Features", href: "/settings/features", icon: ToggleLeft, section: "System" },
  { label: "Integrations", href: "/settings/integrations", icon: Link2, section: "System" },
  { label: "Team Members", href: "/settings/team", icon: Users, section: "System" },
  { label: "Billing", href: "/settings/billing", icon: CreditCard, section: "System" },
];
