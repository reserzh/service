import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { approveEstimate } from "@/lib/services/estimates";
import { handleApiError } from "@/lib/api/errors";

const approveSchema = z.object({
  optionId: z.string().uuid(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const { optionId } = approveSchema.parse(body);
    const data = await approveEstimate(ctx, id, optionId);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
