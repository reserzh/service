import type { UserRole, UserContext } from "./index";

type Action = "create" | "read" | "update" | "delete" | "manage";

type Resource =
  | "settings"
  | "users"
  | "customers"
  | "properties"
  | "equipment"
  | "jobs"
  | "schedule"
  | "estimates"
  | "invoices"
  | "payments"
  | "reports"
  | "website"
  | "pricebook"
  | "communications"
  | "agreements"
  | "portal"
  | "integrations"
  | "ai_assistant";

// Permission matrix: role -> resource -> allowed actions
const permissions: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  admin: {
    settings: ["create", "read", "update", "delete", "manage"],
    users: ["create", "read", "update", "delete", "manage"],
    customers: ["create", "read", "update", "delete"],
    properties: ["create", "read", "update", "delete"],
    equipment: ["create", "read", "update", "delete"],
    jobs: ["create", "read", "update", "delete"],
    schedule: ["create", "read", "update", "delete"],
    estimates: ["create", "read", "update", "delete"],
    invoices: ["create", "read", "update", "delete"],
    payments: ["create", "read", "update", "delete"],
    reports: ["read"],
    website: ["create", "read", "update", "delete"],
    pricebook: ["create", "read", "update", "delete"],
    communications: ["create", "read", "update", "delete"],
    agreements: ["create", "read", "update", "delete"],
    portal: ["create", "read", "update", "delete", "manage"],
    integrations: ["create", "read", "update", "delete", "manage"],
    ai_assistant: ["read"],
  },
  office_manager: {
    settings: ["read"],
    users: ["read"],
    customers: ["create", "read", "update", "delete"],
    properties: ["create", "read", "update", "delete"],
    equipment: ["create", "read", "update", "delete"],
    jobs: ["create", "read", "update", "delete"],
    schedule: ["create", "read", "update", "delete"],
    estimates: ["create", "read", "update", "delete"],
    invoices: ["create", "read", "update", "delete"],
    payments: ["create", "read", "update", "delete"],
    reports: ["read"],
    website: ["create", "read", "update", "delete"],
    pricebook: ["create", "read", "update", "delete"],
    communications: ["create", "read", "update", "delete"],
    agreements: ["create", "read", "update", "delete"],
    portal: ["create", "read", "update", "delete", "manage"],
    integrations: ["read", "manage"],
    ai_assistant: ["read"],
  },
  dispatcher: {
    customers: ["read"],
    properties: ["read"],
    equipment: ["read"],
    jobs: ["create", "read", "update"],
    schedule: ["create", "read", "update", "delete"],
    estimates: ["read"],
    invoices: ["read"],
    reports: ["read"],
    pricebook: ["read"],
    communications: ["read"],
    agreements: ["read"],
  },
  csr: {
    customers: ["create", "read", "update"],
    properties: ["create", "read", "update"],
    equipment: ["create", "read", "update"],
    jobs: ["create", "read"],
    schedule: ["create", "read"],
    estimates: ["create", "read"],
    invoices: ["read"],
    pricebook: ["read"],
    communications: ["read"],
    agreements: ["read"],
  },
  technician: {
    customers: ["read"],
    properties: ["read"],
    equipment: ["read", "create", "update"],
    jobs: ["read", "update"],
    schedule: ["read"],
    estimates: ["read", "create"],
    payments: ["create"],
    pricebook: ["read"],
    agreements: ["read"],
  },
};

export function hasPermission(
  role: UserRole,
  resource: Resource,
  action: Action
): boolean {
  const rolePerms = permissions[role];
  if (!rolePerms) return false;

  const resourcePerms = rolePerms[resource];
  if (!resourcePerms) return false;

  return resourcePerms.includes(action) || resourcePerms.includes("manage");
}

export function assertPermission(
  ctx: UserContext,
  resource: Resource,
  action: Action
): void {
  if (!hasPermission(ctx.role, resource, action)) {
    throw new ForbiddenError();
  }
}

export class ForbiddenError extends Error {
  public statusCode = 403;
  public code = "FORBIDDEN";

  constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "ForbiddenError";
  }
}
