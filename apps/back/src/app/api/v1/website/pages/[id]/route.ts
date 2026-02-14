import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { getPage, updatePage, deletePage } from "@/lib/services/website";

const updatePageSchema = z.object({
  slug: z.string().min(1).max(255).optional(),
  title: z.string().min(1).max(255).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  isHomepage: z.boolean().optional(),
  showInNav: z.boolean().optional(),
  navLabel: z.string().max(100).nullable().optional(),
  sortOrder: z.number().int().optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    noIndex: z.boolean().optional(),
  }).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const page = await getPage(ctx, id);
    return NextResponse.json({ data: page });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePageSchema.parse(body);
    const page = await updatePage(ctx, { id, ...parsed });
    return NextResponse.json({ data: page });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    await deletePage(ctx, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
