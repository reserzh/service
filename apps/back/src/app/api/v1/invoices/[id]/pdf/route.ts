import { NextRequest, NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth";
import { getInvoiceWithRelations } from "@/lib/services/invoices";
import { getCompanyProfile } from "@/lib/services/settings";
import { generateInvoicePdf } from "@/lib/pdf";
import { handleApiError, validateUUID } from "@/lib/api/errors";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const ctx = await requireApiAuth(req);
    const { id } = await context.params;
    validateUUID(id);

    const [invoice, company] = await Promise.all([
      getInvoiceWithRelations(ctx, id),
      getCompanyProfile(ctx),
    ]);

    const pdfBuffer = generateInvoicePdf(company, invoice);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
