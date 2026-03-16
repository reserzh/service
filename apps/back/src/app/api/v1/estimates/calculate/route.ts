import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { calculateAreaEstimate } from "@/lib/services/area-calculator";
import { handleApiError } from "@/lib/api/errors";

const calculateSchema = z.object({
  propertyId: z.string().uuid().optional(),
  areaSqft: z.number().positive().max(1000000),
  serviceCategories: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = calculateSchema.parse(body);

    const result = await calculateAreaEstimate(ctx, {
      areaSqft: input.areaSqft,
      serviceCategories: input.serviceCategories,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
