import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { listJobs, createJob } from "@/lib/services/jobs";
import { handleApiError } from "@/lib/api/errors";

const createSchema = z.object({
  customerId: z.string().uuid(),
  propertyId: z.string().uuid(),
  jobType: z.string().min(1).max(100),
  serviceType: z.string().max(100).optional(),
  summary: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "emergency"]).optional(),
  assignedTo: z.string().uuid().optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  internalNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().min(0.01),
        unitPrice: z.number().min(0),
        type: z.enum(["service", "material", "labor", "discount", "other"]).optional(),
      })
    )
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = req.nextUrl;

    const statusParam = url.searchParams.get("status");
    const status = statusParam
      ? (statusParam.split(",") as ("new" | "scheduled" | "dispatched" | "in_progress" | "completed" | "canceled")[])
      : undefined;

    const result = await listJobs(ctx, {
      page: url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!) : undefined,
      pageSize: url.searchParams.get("pageSize") ? parseInt(url.searchParams.get("pageSize")!) : undefined,
      search: url.searchParams.get("search") || undefined,
      status,
      priority: (url.searchParams.get("priority") as "low" | "normal" | "high" | "emergency") || undefined,
      assignedTo: url.searchParams.get("assignedTo") || undefined,
      customerId: url.searchParams.get("customerId") || undefined,
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: (url.searchParams.get("order") as "asc" | "desc") || undefined,
    });

    return NextResponse.json({ data: result.data, meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = createSchema.parse(body);
    const job = await createJob(ctx, input);
    return NextResponse.json({ data: job }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
