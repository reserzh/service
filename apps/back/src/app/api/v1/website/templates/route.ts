import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api/errors";
import { applyTemplate, listTemplates } from "@/lib/services/template-applicator";

export async function GET() {
  try {
    const templateList = listTemplates();
    return NextResponse.json({ data: templateList });
  } catch (error) {
    return handleApiError(error);
  }
}

const applyTemplateSchema = z.object({
  templateId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireApiAuth(req);
    const body = await req.json();
    const { templateId } = applyTemplateSchema.parse(body);
    const result = await applyTemplate(ctx, templateId);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
