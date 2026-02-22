import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { listPricebookItems, createPricebookItem, getPricebookCategories } from "@/lib/services/pricebook";
import { handleApiError } from "@/lib/api/errors";

const createSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  sku: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  type: z.enum(["service", "material", "labor", "discount", "other"]).optional(),
  unitPrice: z.number().min(0),
  unit: z.string().max(50).optional(),
  costPrice: z.number().min(0).optional(),
  taxable: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const params = req.nextUrl.searchParams;

    // Special endpoint for categories
    if (params.get("_categories") === "true") {
      const categories = await getPricebookCategories(ctx);
      return NextResponse.json({ data: categories });
    }

    const result = await listPricebookItems(ctx, {
      page: params.get("page") ? parseInt(params.get("page")!) : undefined,
      pageSize: params.get("pageSize") ? parseInt(params.get("pageSize")!) : undefined,
      search: params.get("search") || undefined,
      category: params.get("category") || undefined,
      type: params.get("type") as "service" | "material" | "labor" | "discount" | "other" | undefined,
      isActive: params.get("isActive") ? params.get("isActive") === "true" : undefined,
      sort: params.get("sort") || undefined,
      order: (params.get("order") as "asc" | "desc") || undefined,
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
    const item = await createPricebookItem(ctx, input);
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
