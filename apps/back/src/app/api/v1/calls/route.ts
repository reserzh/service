import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { listCalls, initiateCall } from "@/lib/services/calls";
import { handleApiError } from "@/lib/api/errors";
import type { CallDirection, CallStatus } from "@fieldservice/api-types/enums";

const initiateSchema = z.object({
  toNumber: z.string().min(1).max(50),
  jobId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const url = req.nextUrl;

    const result = await listCalls(ctx, {
      page: url.searchParams.get("page") ? parseInt(url.searchParams.get("page")!, 10) : undefined,
      pageSize: url.searchParams.get("pageSize") ? parseInt(url.searchParams.get("pageSize")!, 10) : undefined,
      direction: (url.searchParams.get("direction") as CallDirection) || undefined,
      status: (url.searchParams.get("status") as CallStatus) || undefined,
      customerId: url.searchParams.get("customerId") || undefined,
      userId: url.searchParams.get("userId") || undefined,
      jobId: url.searchParams.get("jobId") || undefined,
      dateFrom: url.searchParams.get("dateFrom") || undefined,
      dateTo: url.searchParams.get("dateTo") || undefined,
      search: url.searchParams.get("search") || undefined,
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
    const input = initiateSchema.parse(body);
    const call = await initiateCall(ctx, input);
    return NextResponse.json({ data: call }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
