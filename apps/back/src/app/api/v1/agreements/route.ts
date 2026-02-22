import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { listAgreements, createAgreement } from "@/lib/services/agreements";
import { handleApiError } from "@/lib/api/errors";

const createSchema = z.object({
  customerId: z.string().uuid(),
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  billingFrequency: z.enum(["monthly", "quarterly", "semi_annual", "annual", "one_time"]),
  billingAmount: z.number().min(0),
  totalValue: z.number().min(0),
  visitsPerYear: z.number().int().min(0),
  autoRenew: z.boolean().optional(),
  renewalReminderDays: z.number().int().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  services: z.array(z.object({
    pricebookItemId: z.string().uuid().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().min(0),
    unitPrice: z.number().min(0),
  })).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const params = req.nextUrl.searchParams;

    const result = await listAgreements(ctx, {
      page: params.get("page") ? parseInt(params.get("page")!) : undefined,
      pageSize: params.get("pageSize") ? parseInt(params.get("pageSize")!) : undefined,
      search: params.get("search") || undefined,
      status: params.get("status") as any || undefined,
      customerId: params.get("customerId") || undefined,
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
    const agreement = await createAgreement(ctx, input);
    return NextResponse.json({ data: agreement }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
