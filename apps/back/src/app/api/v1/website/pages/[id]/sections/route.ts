import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { listSections, createSection } from "@/lib/services/website";

const createSectionSchema = z.object({
  type: z.string().min(1),
  content: z.record(z.string(), z.unknown()).optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const sections = await listSections(ctx, id);
    return NextResponse.json({ data: sections });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = createSectionSchema.parse(body);
    const section = await createSection(ctx, { pageId: id, ...parsed } as Parameters<typeof createSection>[1]);
    return NextResponse.json({ data: section }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
