import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import {
  getCustomerWithRelations,
  updateCustomer,
  deleteCustomer,
} from "@/lib/services/customers";
import { handleApiError } from "@/lib/api/errors";

const updateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(1).max(50).optional(),
  altPhone: z.string().max(50).nullable().optional(),
  companyName: z.string().max(255).nullable().optional(),
  type: z.enum(["residential", "commercial"]).optional(),
  source: z.string().max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  doNotContact: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const customer = await getCustomerWithRelations(ctx, id);
    return NextResponse.json({ data: customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const input = updateSchema.parse(body);
    const customer = await updateCustomer(ctx, id, input);
    return NextResponse.json({ data: customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    await deleteCustomer(ctx, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
