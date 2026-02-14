import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { addJobLineItem } from "@/lib/services/jobs";
import { handleApiError } from "@/lib/api/errors";

const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  type: z.enum(["service", "material", "labor", "discount", "other"]).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const input = lineItemSchema.parse(body);
    const item = await addJobLineItem(ctx, id, input);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
