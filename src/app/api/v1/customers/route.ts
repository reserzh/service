import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { listCustomers, createCustomer } from "@/lib/services/customers";
import { handleApiError } from "@/lib/api/errors";

const createSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(50),
  altPhone: z.string().max(50).optional(),
  companyName: z.string().max(255).optional(),
  type: z.enum(["residential", "commercial"]).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().optional(),
  property: z
    .object({
      addressLine1: z.string().min(1),
      addressLine2: z.string().optional(),
      city: z.string().min(1),
      state: z.string().min(1),
      zip: z.string().min(1),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = req.nextUrl;

    const result = await listCustomers(ctx, {
      page: url.searchParams.get("page")
        ? parseInt(url.searchParams.get("page")!)
        : undefined,
      pageSize: url.searchParams.get("pageSize")
        ? parseInt(url.searchParams.get("pageSize")!)
        : undefined,
      search: url.searchParams.get("search") || undefined,
      type: (url.searchParams.get("type") as "residential" | "commercial") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: (url.searchParams.get("order") as "asc" | "desc") || undefined,
    });

    return NextResponse.json({ data: result.data, meta: result.meta });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = createSchema.parse(body);
    const customer = await createCustomer(ctx, input);
    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
