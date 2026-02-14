import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { listTeamMembers, createTeamMember } from "@/lib/services/team";
import { handleApiError } from "@/lib/api/errors";

const createSchema = z.object({
  supabaseUserId: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(["admin", "office_manager", "dispatcher", "csr", "technician"]),
  phone: z.string().max(50).optional(),
  hourlyRate: z.number().min(0).optional(),
  canBeDispatched: z.boolean().optional(),
  color: z.string().max(7).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = req.nextUrl;

    const result = await listTeamMembers(ctx, {
      page: Number(url.searchParams.get("page") || "1"),
      pageSize: Number(url.searchParams.get("pageSize") || "50"),
      search: url.searchParams.get("search") || undefined,
      role: url.searchParams.get("role") as any || undefined,
      includeInactive: url.searchParams.get("includeInactive") === "true",
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

    const user = await createTeamMember(ctx, input.supabaseUserId, {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      phone: input.phone,
      hourlyRate: input.hourlyRate,
      canBeDispatched: input.canBeDispatched,
      color: input.color,
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
