import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { listTemplates, createTemplate } from "@/lib/services/communications";
import { handleApiError } from "@/lib/api/errors";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  trigger: z.string().max(100).optional(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const params = req.nextUrl.searchParams;

    const result = await listTemplates(ctx, {
      page: params.get("page") ? parseInt(params.get("page")!) : undefined,
      pageSize: params.get("pageSize") ? parseInt(params.get("pageSize")!) : undefined,
      search: params.get("search") || undefined,
      trigger: params.get("trigger") || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = createSchema.parse(body);
    const template = await createTemplate(ctx, input);
    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
