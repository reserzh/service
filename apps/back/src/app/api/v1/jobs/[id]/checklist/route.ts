import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getJobChecklist, createChecklistItem } from "@/lib/services/jobs";
import { handleApiError, validateUUID } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);

    const items = await getJobChecklist(ctx, id);

    return NextResponse.json({ data: items });
  } catch (error) {
    return handleApiError(error);
  }
}

const createSchema = z.object({
  label: z.string().min(1).max(500),
});

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);

    const body = await req.json();
    const parsed = createSchema.parse(body);

    const item = await createChecklistItem(ctx, id, parsed.label);

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
