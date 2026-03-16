import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { calculateBOM } from "@/lib/services/bom-calculator";
import { handleApiError } from "@/lib/api/errors";

const bomSchema = z.object({
  jobType: z.string().min(1).max(100),
  areaSqft: z.number().positive().max(1000000).optional(),
  length: z.number().positive().max(10000).optional(),
  width: z.number().positive().max(10000).optional(),
  useAI: z.boolean().optional(),
  description: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = bomSchema.parse(body);

    const result = await calculateBOM(ctx, input);

    return NextResponse.json({ data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
