import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import {
  getPricebookItem,
  updatePricebookItem,
  deletePricebookItem,
} from "@/lib/services/pricebook";
import { handleApiError, validateUUID } from "@/lib/api/errors";

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  type: z.enum(["service", "material", "labor", "discount", "other"]).optional(),
  unitPrice: z.number().min(0).optional(),
  unit: z.string().max(50).nullable().optional(),
  costPrice: z.number().min(0).nullable().optional(),
  taxable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const item = await getPricebookItem(ctx, id);
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
    const item = await updatePricebookItem(ctx, id, input);
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
    await deletePricebookItem(ctx, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
