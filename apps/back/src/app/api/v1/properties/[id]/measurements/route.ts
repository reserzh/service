import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { properties } from "@fieldservice/shared/db/schema";
import { eq, and } from "drizzle-orm";

const serviceZoneSchema = z.object({
  name: z.string().max(100),
  areaSqft: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
});

const propertyMetadataSchema = z.object({
  serviceZones: z.array(serviceZoneSchema).max(20).optional(),
  irrigationType: z.enum(["none", "sprinkler", "drip", "manual"]).optional(),
  grassType: z.string().max(100).optional(),
  slope: z.enum(["flat", "slight", "moderate", "steep"]).optional(),
  gateCode: z.string().max(50).optional(),
  obstacles: z.array(z.string().max(100)).max(20).optional(),
});

const updateSchema = z.object({
  lotSizeSqft: z.number().int().positive().nullable().optional(),
  lawnAreaSqft: z.number().int().positive().nullable().optional(),
  propertyMetadata: propertyMetadataSchema.nullable().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    assertPermission(ctx, "customers", "read");

    const [property] = await db
      .select({
        lotSizeSqft: properties.lotSizeSqft,
        lawnAreaSqft: properties.lawnAreaSqft,
        propertyMetadata: properties.propertyMetadata,
      })
      .from(properties)
      .where(and(eq(properties.id, id), eq(properties.tenantId, ctx.tenantId)))
      .limit(1);

    if (!property) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Property not found" } }, { status: 404 });
    }

    return NextResponse.json({ data: property });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    assertPermission(ctx, "customers", "update");

    const body = await req.json();
    const input = updateSchema.parse(body);

    const [updated] = await db
      .update(properties)
      .set({
        ...(input.lotSizeSqft !== undefined && { lotSizeSqft: input.lotSizeSqft }),
        ...(input.lawnAreaSqft !== undefined && { lawnAreaSqft: input.lawnAreaSqft }),
        ...(input.propertyMetadata !== undefined && { propertyMetadata: input.propertyMetadata }),
        updatedAt: new Date(),
      })
      .where(and(eq(properties.id, id), eq(properties.tenantId, ctx.tenantId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Property not found" } }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        lotSizeSqft: updated.lotSizeSqft,
        lawnAreaSqft: updated.lawnAreaSqft,
        propertyMetadata: updated.propertyMetadata,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
