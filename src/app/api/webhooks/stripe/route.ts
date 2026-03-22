/**
 * Stripe webhook handler.
 * Processes subscription events to keep plan status in sync.
 */
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    // TODO: Verify webhook signature with Stripe
    // const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

    // Handle events:
    // - checkout.session.completed → activate subscription
    // - customer.subscription.updated → sync plan changes
    // - customer.subscription.deleted → downgrade to free
    // - invoice.payment_failed → flag for follow-up

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
