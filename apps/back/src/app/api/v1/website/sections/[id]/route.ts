import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { updateSection, deleteSection } from "@/lib/services/website";

const updateSectionSchema = z.object({
  content: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  isVisible: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSectionSchema.parse(body);
    const section = await updateSection(ctx, id, parsed as Parameters<typeof updateSection>[2]);
    return NextResponse.json({ data: section });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    await deleteSection(ctx, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
