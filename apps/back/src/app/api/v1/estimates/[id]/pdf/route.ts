import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getEstimateWithRelations } from "@/lib/services/estimates";
import { getCompanyProfile } from "@/lib/services/settings";
import { generateEstimatePdf } from "@/lib/pdf";
import { handleApiError, validateUUID } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);

    const [estimate, company] = await Promise.all([
      getEstimateWithRelations(ctx, id),
      getCompanyProfile(ctx),
    ]);

    const pdfBuffer = generateEstimatePdf(company, estimate);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${estimate.estimateNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
