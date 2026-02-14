import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { reorderSections } from "@/lib/services/website";

const reorderSchema = z.object({
  sectionIds: z.array(z.string().uuid()),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = reorderSchema.parse(body);
    await reorderSections(ctx, id, parsed.sectionIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
