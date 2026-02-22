import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { createPortalServerClient } from "@/lib/portal-supabase";
import { customers, invoices } from "@fieldservice/shared/db/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: { message: "Payment processing not configured" } },
        { status: 503 }
      );
    }

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
      .select({ id: customers.id, tenantId: customers.tenantId })
      .from(customers)
      .where(eq(customers.supabaseUserId, user.id))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: { message: "Customer not found" } },
        { status: 404 }
      );
    }

    // Validate the invoice belongs to the customer and has a balance due
    const [invoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        balanceDue: invoices.balanceDue,
        tenantId: invoices.tenantId,
        customerId: invoices.customerId,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.customerId, customer.id),
          eq(invoices.tenantId, customer.tenantId)
        )
      )
      .limit(1);

    if (!invoice) {
      return NextResponse.json(
        { error: { message: "Invoice not found" } },
        { status: 404 }
      );
    }

    const balanceDue = parseFloat(invoice.balanceDue);
    if (balanceDue <= 0) {
      return NextResponse.json(
        { error: { message: "This invoice has no balance due." } },
        { status: 400 }
      );
    }

    // Create Stripe Checkout session
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3201";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
            },
            unit_amount: Math.round(balanceDue * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/portal/invoices/${id}?paid=true`,
      cancel_url: `${appUrl}/portal/invoices/${id}`,
      metadata: {
        invoiceId: invoice.id,
        customerId: customer.id,
        tenantId: customer.tenantId,
      },
    });

    return NextResponse.json({
      data: { url: session.url },
    });
  } catch (error) {
    console.error("Invoice checkout error:", error);
    return NextResponse.json(
      { error: { message: "Failed to create checkout session." } },
      { status: 500 }
    );
  }
}
