import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import {
  listCompanyEquipment,
  createCompanyEquipmentItem,
} from "@/lib/services/company-equipment";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().min(1).max(100),
  serialNumber: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.number().optional(),
  assignedTo: z.string().uuid().optional(),
  notes: z.string().optional(),
  serviceIntervalDays: z.number().int().min(1).optional(),
  serviceIntervalHours: z.number().int().min(1).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const data = await listCompanyEquipment(ctx, { search, status });
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = createSchema.parse(body);
    const item = await createCompanyEquipmentItem(ctx, input);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
