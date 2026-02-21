"use server";

import { requireAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import {
  customers,
  jobs,
  estimates,
  invoices,
} from "@fieldservice/shared/db/schema";
import { eq, and, or, ilike, isNull, desc } from "drizzle-orm";
import { escapeLike } from "@/lib/utils";

export interface SearchResult {
  id: string;
  type: "customer" | "job" | "estimate" | "invoice";
  title: string;
  subtitle: string;
  href: string;
}

export async function globalSearchAction(
  query: string
): Promise<SearchResult[]> {
  const trimmed = query?.trim() ?? "";
  if (trimmed.length < 2 || trimmed.length > 100) return [];

  const ctx = await requireAuth();
  const term = `%${escapeLike(trimmed)}%`;
  const results: SearchResult[] = [];

  try {
    const queries: Promise<void>[] = [];

    // Only search entities the user has read access to
    let customerResults: Array<{
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string | null;
      companyName: string | null;
    }> = [];
    let jobResults: Array<{
      id: string;
      jobNumber: string;
      summary: string;
      status: string;
    }> = [];
    let estimateResults: Array<{
      id: string;
      estimateNumber: string;
      summary: string;
      status: string;
    }> = [];
    let invoiceResults: Array<{
      id: string;
      invoiceNumber: string;
      status: string;
      total: string;
    }> = [];

    if (hasPermission(ctx.role, "customers", "read")) {
      queries.push(
        db
          .select({
            id: customers.id,
            firstName: customers.firstName,
            lastName: customers.lastName,
            phone: customers.phone,
            email: customers.email,
            companyName: customers.companyName,
          })
          .from(customers)
          .where(
            and(
              eq(customers.tenantId, ctx.tenantId),
              isNull(customers.deletedAt),
              or(
                ilike(customers.firstName, term),
                ilike(customers.lastName, term),
                ilike(customers.email, term),
                ilike(customers.phone, term),
                ilike(customers.companyName, term)
              )
            )
          )
          .orderBy(desc(customers.updatedAt))
          .limit(5)
          .then((rows) => {
            customerResults = rows;
          })
      );
    }

    if (hasPermission(ctx.role, "jobs", "read")) {
      const jobConditions = [
        eq(jobs.tenantId, ctx.tenantId),
        or(
          ilike(jobs.jobNumber, term),
          ilike(jobs.summary, term)
        ),
      ];
      // Technicians should only see jobs assigned to them
      if (ctx.role === "technician") {
        jobConditions.push(eq(jobs.assignedTo, ctx.userId));
      }
      queries.push(
        db
          .select({
            id: jobs.id,
            jobNumber: jobs.jobNumber,
            summary: jobs.summary,
            status: jobs.status,
          })
          .from(jobs)
          .where(and(...jobConditions))
          .orderBy(desc(jobs.updatedAt))
          .limit(5)
          .then((rows) => {
            jobResults = rows;
          })
      );
    }

    if (hasPermission(ctx.role, "estimates", "read")) {
      queries.push(
        db
          .select({
            id: estimates.id,
            estimateNumber: estimates.estimateNumber,
            summary: estimates.summary,
            status: estimates.status,
          })
          .from(estimates)
          .where(
            and(
              eq(estimates.tenantId, ctx.tenantId),
              or(
                ilike(estimates.estimateNumber, term),
                ilike(estimates.summary, term)
              )
            )
          )
          .orderBy(desc(estimates.updatedAt))
          .limit(5)
          .then((rows) => {
            estimateResults = rows;
          })
      );
    }

    if (hasPermission(ctx.role, "invoices", "read")) {
      queries.push(
        db
          .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            status: invoices.status,
            total: invoices.total,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.tenantId, ctx.tenantId),
              ilike(invoices.invoiceNumber, term)
            )
          )
          .orderBy(desc(invoices.updatedAt))
          .limit(5)
          .then((rows) => {
            invoiceResults = rows;
          })
      );
    }

    await Promise.all(queries);

    for (const c of customerResults) {
      results.push({
        id: c.id,
        type: "customer",
        title: `${c.firstName} ${c.lastName}`,
        subtitle: c.companyName || c.phone,
        href: `/customers/${c.id}`,
      });
    }

    for (const j of jobResults) {
      results.push({
        id: j.id,
        type: "job",
        title: j.jobNumber,
        subtitle: j.summary,
        href: `/jobs/${j.id}`,
      });
    }

    for (const e of estimateResults) {
      results.push({
        id: e.id,
        type: "estimate",
        title: e.estimateNumber,
        subtitle: e.summary,
        href: `/estimates/${e.id}`,
      });
    }

    for (const inv of invoiceResults) {
      results.push({
        id: inv.id,
        type: "invoice",
        title: inv.invoiceNumber,
        subtitle: `${inv.status} - $${inv.total}`,
        href: `/invoices/${inv.id}`,
      });
    }
  } catch {
    return [];
  }

  return results;
}
