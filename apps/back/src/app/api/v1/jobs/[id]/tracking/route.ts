import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { updateTrackingLocation, getActiveTrackingSession } from "@/lib/services/tracking";
import { handleApiError, validateUUID } from "@/lib/api/errors";

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const body = await req.json();
    const { latitude, longitude } = locationSchema.parse(body);
    const session = await updateTrackingLocation(ctx, id, latitude, longitude);
    return NextResponse.json({ data: session });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);
    const session = await getActiveTrackingSession(ctx, id);
    return NextResponse.json({ data: session });
  } catch (error) {
    return handleApiError(error);
  }
}
