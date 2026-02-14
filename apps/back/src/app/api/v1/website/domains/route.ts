import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { listDomains, addDomain } from "@/lib/services/website";

const addDomainSchema = z.object({
  domain: z.string().min(1).max(255),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const domains = await listDomains(ctx);
    return NextResponse.json({ data: domains });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const parsed = addDomainSchema.parse(body);
    const domain = await addDomain(ctx, parsed.domain);
    return NextResponse.json({ data: domain }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
