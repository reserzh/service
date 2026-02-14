import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { listServices, createService } from "@/lib/services/service-catalog";

const createServiceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  imageUrl: z.string().optional(),
  priceDisplay: z.string().max(100).optional(),
  isBookable: z.boolean().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const services = await listServices(ctx);
    return NextResponse.json({ data: services });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const parsed = createServiceSchema.parse(body);
    const service = await createService(ctx, parsed);
    return NextResponse.json({ data: service }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
