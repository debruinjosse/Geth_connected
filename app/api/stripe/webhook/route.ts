import Stripe from "stripe";
import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe, hasStripeWebhookConfig } from "@/lib/stripe/server";

export const runtime = "nodejs";

function toIso(value?: number | null) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

async function syncSubscription(subscription: Stripe.Subscription, fallbackCompanyId?: string | null) {
  const supabase = createSupabaseAdminClient();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const priceId = getSubscriptionPriceId(subscription);
  const companyId = subscription.metadata.company_id || fallbackCompanyId;

  const { data: plan } = priceId
    ? await supabase.from("plans").select("id, plan_key").eq("stripe_price_id", priceId).maybeSingle<{ id: string; plan_key: string }>()
    : { data: null };

  let resolvedCompanyId = companyId ?? null;

  if (!resolvedCompanyId) {
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("company_id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle<{ company_id: string }>();
    resolvedCompanyId = existingSubscription?.company_id ?? null;
  }

  if (!resolvedCompanyId) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle<{ id: string }>();
    resolvedCompanyId = company?.id ?? null;
  }

  if (!resolvedCompanyId) {
    return;
  }

  const subscriptionAny = subscription as Stripe.Subscription & {
    current_period_start?: number | null;
    current_period_end?: number | null;
  };

  const payload = {
    company_id: resolvedCompanyId,
    plan_id: plan?.id ?? null,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    status: subscription.status,
    current_period_start: toIso(subscriptionAny.current_period_start),
    current_period_end: toIso(subscriptionAny.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: toIso(subscription.canceled_at),
    trial_end: toIso(subscription.trial_end)
  };

  await supabase.from("subscriptions").upsert(payload, { onConflict: "company_id" });
  await supabase
    .from("companies")
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_plan: plan?.plan_key ?? undefined,
      subscription_current_period_end: payload.current_period_end
    })
    .eq("id", resolvedCompanyId);
}

export async function POST(request: NextRequest) {
  if (!hasStripeWebhookConfig()) {
    return new Response("Stripe webhook is not configured.", { status: 501 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature.", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown webhook verification error";
    return new Response(`Webhook verification failed: ${message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription, session.metadata?.company_id ?? null);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown billing sync error";
    return new Response(`Billing sync failed: ${message}`, { status: 500 });
  }

  return Response.json({ received: true });
}
