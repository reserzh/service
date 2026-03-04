import type { UserContext } from "@/lib/auth";
import { listCustomers, getCustomer } from "@/lib/services/customers";
import { listJobs, getJob } from "@/lib/services/jobs";
import { listInvoices, getInvoice } from "@/lib/services/invoices";
import { listEstimates, getEstimate } from "@/lib/services/estimates";
import { listAgreements } from "@/lib/services/agreements";
import {
  getDashboardStats,
  getRevenueReport,
  getJobsReport,
  getInvoiceReport,
  getTechnicianReport,
} from "@/lib/services/reports";
import { listTeamMembers } from "@/lib/services/team";
import { listPricebookItems } from "@/lib/services/pricebook";

const MAX_PAGE_SIZE = 25;
const MAX_RESULT_LENGTH = 4096;

function truncateResult(data: unknown): string {
  const json = JSON.stringify(data);
  if (json.length <= MAX_RESULT_LENGTH) return json;
  return json.slice(0, MAX_RESULT_LENGTH) + '..."truncated"';
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function executeTool(
  toolName: string,
  input: Record<string, any>,
  ctx: UserContext
): Promise<string> {
  try {
    const result = await executeToolInner(toolName, input, ctx);
    return truncateResult(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return JSON.stringify({ error: message });
  }
}

async function executeToolInner(
  toolName: string,
  input: Record<string, any>,
  ctx: UserContext
): Promise<unknown> {
  switch (toolName) {
    // ==================== Customers ====================
    case "search_customers":
      return listCustomers(ctx, {
        search: input.search,
        type: input.type,
        page: input.page ?? 1,
        pageSize: MAX_PAGE_SIZE,
      });

    case "get_customer":
      return getCustomer(ctx, input.customer_id);

    // ==================== Jobs ====================
    case "search_jobs":
      return listJobs(ctx, {
        search: input.search,
        status: input.status,
        priority: input.priority,
        assignedTo: input.assigned_to,
        from: input.from,
        to: input.to,
        page: input.page ?? 1,
        pageSize: MAX_PAGE_SIZE,
      });

    case "get_job":
      return getJob(ctx, input.job_id);

    // ==================== Invoices ====================
    case "search_invoices":
      return listInvoices(ctx, {
        search: input.search,
        status: input.status,
        customerId: input.customer_id,
        from: input.from,
        to: input.to,
        page: input.page ?? 1,
        pageSize: MAX_PAGE_SIZE,
      });

    case "get_invoice":
      return getInvoice(ctx, input.invoice_id);

    // ==================== Estimates ====================
    case "search_estimates":
      return listEstimates(ctx, {
        search: input.search,
        status: input.status,
        customerId: input.customer_id,
        page: input.page ?? 1,
        pageSize: MAX_PAGE_SIZE,
      });

    case "get_estimate":
      return getEstimate(ctx, input.estimate_id);

    // ==================== Agreements ====================
    case "search_agreements":
      return listAgreements(ctx, {
        search: input.search,
        status: input.status,
        page: input.page ?? 1,
        pageSize: MAX_PAGE_SIZE,
      });

    // ==================== Reports ====================
    case "get_dashboard_stats":
      return getDashboardStats(ctx);

    case "get_revenue_report":
      return getRevenueReport(ctx, {
        from: input.from,
        to: input.to,
        groupBy: input.group_by,
      });

    case "get_jobs_report":
      return getJobsReport(ctx, {
        from: input.from,
        to: input.to,
      });

    case "get_invoice_report":
      return getInvoiceReport(ctx, {
        from: input.from,
        to: input.to,
      });

    case "get_technician_report":
      return getTechnicianReport(ctx, {
        from: input.from,
        to: input.to,
      });

    // ==================== Team ====================
    case "get_team_members":
      return listTeamMembers(ctx, {
        search: input.search,
        role: input.role,
        pageSize: MAX_PAGE_SIZE,
      });

    // ==================== Pricebook ====================
    case "get_pricebook_items":
      return listPricebookItems(ctx, {
        search: input.search,
        category: input.category,
        type: input.type,
        pageSize: MAX_PAGE_SIZE,
      });

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
