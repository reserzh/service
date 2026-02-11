import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { tenants, users } from "@/lib/db/schema";
import { initializeSequences } from "@/lib/services/sequences";
import { handleApiError } from "@/lib/api/errors";

const registerSchema = z.object({
  userId: z.string().uuid(),
  companyName: z.string().min(1).max(255),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = registerSchema.parse(body);

    // Generate slug from company name
    const slug = input.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100);

    // Create tenant and user in a transaction
    const result = await db.transaction(async (tx) => {
      // Create tenant
      const [tenant] = await tx
        .insert(tenants)
        .values({
          name: input.companyName,
          slug: `${slug}-${Date.now().toString(36)}`,
          email: input.email,
        })
        .returning();

      // Create admin user
      const [user] = await tx
        .insert(users)
        .values({
          id: input.userId,
          tenantId: tenant.id,
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          role: "admin",
          canBeDispatched: false,
        })
        .returning();

      // Initialize sequences
      await initializeSequences(tenant.id);

      return { tenant, user };
    });

    return NextResponse.json(
      { data: { tenantId: result.tenant.id, userId: result.user.id } },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
