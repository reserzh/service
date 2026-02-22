import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, payments } from "@fieldservice/shared/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const stripe = new (await import("stripe")).default(stripeSecretKey);
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoiceId;
      const customerId = session.metadata?.customerId;
      const tenantId = session.metadata?.tenantId;

      if (invoiceId && customerId && tenantId) {
        const amountPaid = (session.amount_total || 0) / 100;

        // Record the payment
        await db.insert(payments).values({
          tenantId,
          invoiceId,
          customerId,
          amount: String(amountPaid),
          method: "credit_card",
          status: "succeeded",
          referenceNumber: session.payment_intent as string || session.id,
          notes: "Paid via Customer Portal",
          processedAt: new Date(),
        });

        // Update invoice: add to amountPaid, recalculate balanceDue, update status
        const [invoice] = await db
          .select()
          .from(invoices)
          .where(and(eq(invoices.id, invoiceId), eq(invoices.tenantId, tenantId)))
          .limit(1);

        if (invoice) {
          const newAmountPaid = parseFloat(invoice.amountPaid) + amountPaid;
          const newBalanceDue = Math.max(0, parseFloat(invoice.total) - newAmountPaid);
          const newStatus = newBalanceDue <= 0 ? "paid" : "partial";

          await db
            .update(invoices)
            .set({
              amountPaid: String(newAmountPaid),
              balanceDue: String(newBalanceDue),
              status: newStatus,
              paidAt: newBalanceDue <= 0 ? new Date() : undefined,
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoiceId));
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
