import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { listPages, createPage } from "@/lib/services/website";

const createPageSchema = z.object({
  slug: z.string().min(1).max(255),
  title: z.string().min(1).max(255),
  isHomepage: z.boolean().optional(),
  showInNav: z.boolean().optional(),
  navLabel: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const pages = await listPages(ctx);
    return NextResponse.json({ data: pages });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const parsed = createPageSchema.parse(body);
    const page = await createPage(ctx, parsed);
    return NextResponse.json({ data: page }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
