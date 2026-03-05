import { NextRequest, NextResponse } from "next/server";
import { getTrackingSessionByToken } from "@/lib/tracking-queries";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { token } = await context.params;

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const session = await getTrackingSessionByToken(token);

  if (!session || session.status !== "active") {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      data: {
        currentLatitude: session.currentLatitude,
        currentLongitude: session.currentLongitude,
        destinationLatitude: session.destinationLatitude,
        destinationLongitude: session.destinationLongitude,
        etaMinutes: session.etaMinutes,
        lastLocationAt: session.lastLocationAt,
        techFirstName: session.techFirstName,
        companyName: session.companyName,
        jobNumber: session.jobNumber,
        propertyAddress: session.propertyAddress,
        propertyCity: session.propertyCity,
        propertyState: session.propertyState,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
