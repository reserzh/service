import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushTokens } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";
import { handleApiError } from "@/lib/api/errors";

const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = pushTokenSchema.parse(body);

    // Upsert: delete existing tokens for this user, then insert new one
    // This ensures each user has at most one active token per device
    await db
      .delete(pushTokens)
      .where(
        and(
          eq(pushTokens.userId, ctx.userId),
          eq(pushTokens.tenantId, ctx.tenantId),
          eq(pushTokens.token, input.token)
        )
      );

    const [token] = await db
      .insert(pushTokens)
      .values({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        token: input.token,
        platform: input.platform,
      })
      .returning();

    return NextResponse.json({ data: token }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);

    // Remove all push tokens for this user
    await db
      .delete(pushTokens)
      .where(
        and(
          eq(pushTokens.userId, ctx.userId),
          eq(pushTokens.tenantId, ctx.tenantId)
        )
      );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
