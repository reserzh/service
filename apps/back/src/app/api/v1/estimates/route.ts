import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { listEstimates, createEstimate } from "@/lib/services/estimates";
import { handleApiError } from "@/lib/api/errors";

const createSchema = z.object({
  customerId: z.string().uuid(),
  propertyId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  summary: z.string().min(1).max(500),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  validUntil: z.string().optional(),
  options: z.array(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      isRecommended: z.boolean().optional(),
      items: z.array(
        z.object({
          description: z.string().min(1).max(500),
          quantity: z.number().min(0.01),
          unitPrice: z.number().min(0),
          type: z.enum(["service", "material", "labor", "discount", "other"]).optional(),
        })
      ).min(1),
    })
  ).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = req.nextUrl;

    const result = await listEstimates(ctx, {
      page: Number(url.searchParams.get("page") || "1"),
      pageSize: Number(url.searchParams.get("pageSize") || "25"),
      search: url.searchParams.get("search") || undefined,
      status: url.searchParams.get("status")?.split(",") as any || undefined,
      customerId: url.searchParams.get("customerId") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: (url.searchParams.get("order") as "asc" | "desc") || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = createSchema.parse(body);
    const estimate = await createEstimate(ctx, input);
    return NextResponse.json({ data: estimate }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
