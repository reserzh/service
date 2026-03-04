import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import {
  getConversation,
  updateConversationTitle,
  deleteConversation,
} from "@/lib/services/ai";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    validateUUID(id);

    const conversation = await getConversation(ctx, id);
    return NextResponse.json({ data: conversation });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  title: z.string().min(1).max(100),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    validateUUID(id);

    const body = await req.json();
    const { title } = updateSchema.parse(body);

    const conversation = await updateConversationTitle(ctx, id, title);
    return NextResponse.json({ data: conversation });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await params;
    validateUUID(id);

    await deleteConversation(ctx, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
