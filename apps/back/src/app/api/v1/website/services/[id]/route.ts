import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { getService, updateService, deleteService } from "@/lib/services/service-catalog";

const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  shortDescription: z.string().max(500).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  priceDisplay: z.string().max(100).nullable().optional(),
  isBookable: z.boolean().optional(),
  estimatedDuration: z.number().int().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const service = await getService(ctx, id);
    return NextResponse.json({ data: service });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = updateServiceSchema.parse(body);
    const service = await updateService(ctx, { id, ...parsed });
    return NextResponse.json({ data: service });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    await deleteService(ctx, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
