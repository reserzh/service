import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { addJobNote } from "@/lib/services/jobs";
import { handleApiError } from "@/lib/api/errors";

const noteSchema = z.object({
  content: z.string().min(1),
  isInternal: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const input = noteSchema.parse(body);
    const note = await addJobNote(ctx, id, input.content, input.isInternal ?? true);
    return NextResponse.json({ data: note }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
