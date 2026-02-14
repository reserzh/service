import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    return NextResponse.json({
      data: {
        id: ctx.userId,
        tenantId: ctx.tenantId,
        email: ctx.email,
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        role: ctx.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
