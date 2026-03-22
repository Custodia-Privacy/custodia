/**
 * Stripe webhook handler.
 * Processes subscription events to keep plan status in sync.
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia" as any,
});

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_STARTER_PRICE_ID ?? ""]: "starter",
  [process.env.STRIPE_PRO_PRICE_ID ?? ""]: "pro",
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        const plan = session.metadata?.plan;
        if (!orgId || !plan) break;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        await db.organization.update({
          where: { id: orgId },
          data: {
            plan: plan as any,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId ?? null,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await db.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!org) break;

        // Determine plan from the subscription's price
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? PRICE_TO_PLAN[priceId] : undefined;

        if (plan) {
          await db.organization.update({
            where: { id: org.id },
            data: { plan: plan as any },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const org = await db.organization.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!org) break;

        await db.organization.update({
          where: { id: org.id },
          data: {
            plan: "free",
            stripeSubscriptionId: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const org = await db.organization.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!org) break;

        // Create an alert for payment failure
        const sites = await db.site.findMany({
          where: { orgId: org.id, deletedAt: null },
          take: 1,
        });
        if (sites[0]) {
          await db.alert.create({
            data: {
              siteId: sites[0].id,
              orgId: org.id,
              type: "scan_failed",
              title: "Payment Failed",
              message:
                "Your latest payment failed. Please update your payment method to avoid service interruption.",
              severity: "critical",
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook processing error:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
