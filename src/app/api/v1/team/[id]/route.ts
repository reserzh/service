import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { getTeamMember, updateTeamMember } from "@/lib/services/team";
import { handleApiError } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const data = await getTeamMember(ctx, id);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(["admin", "office_manager", "dispatcher", "csr", "technician"]).optional(),
  phone: z.string().max(50).nullable().optional(),
  hourlyRate: z.number().min(0).nullable().optional(),
  canBeDispatched: z.boolean().optional(),
  color: z.string().max(7).optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    const body = await req.json();
    const input = updateSchema.parse(body);
    const data = await updateTeamMember(ctx, id, input);
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
