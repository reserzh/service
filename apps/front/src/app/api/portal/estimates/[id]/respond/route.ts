import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { createPortalServerClient } from "@/lib/portal-supabase";
import { customers, estimates, estimateOptions } from "@fieldservice/shared/db/schema";

const respondSchema = z.object({
  action: z.enum(["approve", "decline"]),
  optionId: z.string().uuid().optional(),
  note: z.string().max(2000).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();
    const parsed = respondSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request data", issues: parsed.error.issues } },
        { status: 400 }
      );
    }

    const { action, optionId, note } = parsed.data;

    // Get authenticated portal user
    const supabase = await createPortalServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Look up the customer by supabaseUserId
    const [customer] = await db
      .select({ id: customers.id, tenantId: customers.tenantId, portalAccessEnabled: customers.portalAccessEnabled })
      .from(customers)
      .where(eq(customers.supabaseUserId, user.id))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: { message: "Customer not found" } },
        { status: 404 }
      );
    }

    if (!customer.portalAccessEnabled) {
      return NextResponse.json(
        { error: { message: "Portal access has been revoked" } },
        { status: 403 }
      );
    }

    // Validate the estimate belongs to the customer and tenant
    const [estimate] = await db
      .select({
        id: estimates.id,
        status: estimates.status,
        tenantId: estimates.tenantId,
        customerId: estimates.customerId,
      })
      .from(estimates)
      .where(
        and(
          eq(estimates.id, id),
          eq(estimates.customerId, customer.id),
          eq(estimates.tenantId, customer.tenantId)
        )
      )
      .limit(1);

    if (!estimate) {
      return NextResponse.json(
        { error: { message: "Estimate not found" } },
        { status: 404 }
      );
    }

    // Validate status allows responding
    if (estimate.status !== "sent" && estimate.status !== "viewed") {
      return NextResponse.json(
        { error: { message: "This estimate can no longer be responded to." } },
        { status: 400 }
      );
    }

    // If approving, validate optionId is provided and belongs to the estimate
    let selectedOptionTotal: string | null = null;
    if (action === "approve") {
      if (!optionId) {
        return NextResponse.json(
          { error: { message: "An option must be selected to approve the estimate." } },
          { status: 400 }
        );
      }

      const [option] = await db
        .select({ id: estimateOptions.id, total: estimateOptions.total })
        .from(estimateOptions)
        .where(
          and(
            eq(estimateOptions.id, optionId),
            eq(estimateOptions.estimateId, estimate.id),
            eq(estimateOptions.tenantId, customer.tenantId)
          )
        )
        .limit(1);

      if (!option) {
        return NextResponse.json(
          { error: { message: "Invalid option selected." } },
          { status: 400 }
        );
      }
      selectedOptionTotal = option.total;
    }

    // Build customer note (append to existing notes to avoid data loss)
    const now = new Date();
    let updatedNotes: string | undefined;
    if (note) {
      const existing = await db
        .select({ notes: estimates.notes })
        .from(estimates)
        .where(and(eq(estimates.id, estimate.id), eq(estimates.tenantId, customer.tenantId)))
        .limit(1)
        .then((r) => r[0]?.notes);
      const timestamp = now.toISOString().split("T")[0];
      const customerNote = `--- Customer modification request (${timestamp}) ---\n${note}`;
      updatedNotes = existing ? `${existing}\n\n${customerNote}` : customerNote;
    }

    // Update the estimate
    await db
      .update(estimates)
      .set({
        status: action === "approve" ? "approved" : "declined",
        ...(action === "approve" && {
          approvedAt: now,
          approvedOptionId: optionId,
          totalAmount: selectedOptionTotal,
        }),
        ...(updatedNotes && { notes: updatedNotes }),
        updatedAt: now,
      })
      .where(and(eq(estimates.id, estimate.id), eq(estimates.tenantId, customer.tenantId)));

    return NextResponse.json({
      data: {
        id: estimate.id,
        status: action === "approve" ? "approved" : "declined",
      },
    });
  } catch (error) {
    console.error("Estimate respond error:", error);
    return NextResponse.json(
      { error: { message: "Failed to process estimate response." } },
      { status: 500 }
    );
  }
}
