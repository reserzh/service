import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serviceCatalog } from "@fieldservice/shared/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { handleApiError } from "@/lib/api/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    const services = await db
      .select({
        id: serviceCatalog.id,
        name: serviceCatalog.name,
        slug: serviceCatalog.slug,
        description: serviceCatalog.description,
        shortDescription: serviceCatalog.shortDescription,
        icon: serviceCatalog.icon,
        imageUrl: serviceCatalog.imageUrl,
        priceDisplay: serviceCatalog.priceDisplay,
        isBookable: serviceCatalog.isBookable,
        estimatedDuration: serviceCatalog.estimatedDuration,
        sortOrder: serviceCatalog.sortOrder,
      })
      .from(serviceCatalog)
      .where(and(eq(serviceCatalog.tenantId, tenantId), eq(serviceCatalog.isActive, true)))
      .orderBy(asc(serviceCatalog.sortOrder));

    return NextResponse.json({ data: services }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
