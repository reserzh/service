import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError, validateUUID } from "@/lib/api/errors";
import {
  addMaintenanceLog,
  getMaintenanceLogs,
} from "@/lib/services/company-equipment";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const createSchema = z.object({
  type: z.string().min(1).max(100),
  description: z.string().optional(),
  cost: z.number().optional(),
  performedAt: z.string(),
  hoursAtService: z.number().int().optional(),
});

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const logs = await getMaintenanceLogs(ctx, id);
    return NextResponse.json({ data: logs });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const input = createSchema.parse(body);
    const log = await addMaintenanceLog(ctx, id, input);
    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
