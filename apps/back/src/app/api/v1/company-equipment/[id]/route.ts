import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import {
  getCompanyEquipmentItem,
  updateCompanyEquipmentItem,
  deleteCompanyEquipmentItem,
} from "@/lib/services/company-equipment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.string().min(1).max(100).optional(),
  serialNumber: z.string().max(100).nullable().optional(),
  brand: z.string().max(100).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
  purchaseCost: z.number().nullable().optional(),
  lastServiceDate: z.string().nullable().optional(),
  nextServiceDue: z.string().nullable().optional(),
  hoursUsed: z.number().int().min(0).optional(),
  status: z.string().max(50).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const item = await getCompanyEquipmentItem(ctx, id);
    return NextResponse.json({ data: item });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const input = updateSchema.parse(body);
    const item = await updateCompanyEquipmentItem(ctx, id, input);
    return NextResponse.json({ data: item });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    await deleteCompanyEquipmentItem(ctx, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
