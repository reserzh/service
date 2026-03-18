import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { createPortalServerClient } from "@/lib/portal-supabase";
import { customers, invoices } from "@fieldservice/shared/db/schema";

async function createCheckoutSession(
  req: NextRequest,
  id: string
) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { error: "Payment processing not configured", status: 503 };
  }

  // Get authenticated portal user
  const supabase = await createPortalServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  // Look up the customer by supabaseUserId
  const [customer] = await db
    .select({ id: customers.id, tenantId: customers.tenantId, portalAccessEnabled: customers.portalAccessEnabled })
    .from(customers)
    .where(eq(customers.supabaseUserId, user.id))
    .limit(1);

  if (!customer) {
    return { error: "Customer not found", status: 404 };
  }

  if (!customer.portalAccessEnabled) {
    return { error: "Portal access has been revoked", status: 403 };
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
    return { error: "Invoice not found", status: 404 };
  }

  const balanceDue = parseFloat(invoice.balanceDue);
  if (balanceDue <= 0) {
    return { error: "This invoice has no balance due.", status: 400 };
  }

  // Create Stripe Checkout session
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`;

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

  return { url: session.url };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await createCheckoutSession(req, id);

    if ("error" in result) {
      // Redirect back to invoice page with error for GET requests
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      return NextResponse.redirect(
        `${appUrl}/portal/invoices/${id}?error=${encodeURIComponent(result.error as string)}`
      );
    }

    return NextResponse.redirect(result.url!);
  } catch (error) {
    console.error("Invoice checkout error:", error);
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    try {
      const { id: invoiceId } = await params;
      return NextResponse.redirect(
        `${appUrl}/portal/invoices/${invoiceId}?error=Failed+to+create+checkout+session`
      );
    } catch {
      return NextResponse.redirect(`${appUrl}/portal/invoices?error=Failed+to+create+checkout+session`);
    }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await createCheckoutSession(req, id);

    if ("error" in result) {
      return NextResponse.json(
        { error: { message: result.error } },
        { status: result.status }
      );
    }

    return NextResponse.json({
      data: { url: result.url },
    });
  } catch (error) {
    console.error("Invoice checkout error:", error);
    return NextResponse.json(
      { error: { message: "Failed to create checkout session." } },
      { status: 500 }
    );
  }
}
