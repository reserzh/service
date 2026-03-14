import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { createDailyReport, listDailyReports } from "@/lib/services/daily-reports";

const createSchema = z.object({
  materialRequests: z.string().optional(),
  equipmentIssues: z.string().optional(),
  officeNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? undefined;
    const reports = await listDailyReports(ctx, date);
    return NextResponse.json({ data: reports });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const input = createSchema.parse(body);
    const report = await createDailyReport(ctx, input);
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
