import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { listChecklistTemplates, createChecklistTemplate } from "@/lib/services/checklist-templates";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = new URL(req.url);

    const result = await listChecklistTemplates(ctx, {
      page: Number(url.searchParams.get("page") || 1),
      pageSize: Number(url.searchParams.get("pageSize") || 50),
      search: url.searchParams.get("search") || undefined,
      jobType: url.searchParams.get("jobType") || undefined,
      isActive: url.searchParams.has("isActive")
        ? url.searchParams.get("isActive") === "true"
        : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  jobType: z.string().max(100).optional(),
  items: z.array(z.string().min(1).max(500)),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const parsed = createSchema.parse(body);

    const template = await createChecklistTemplate(ctx, parsed);

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
