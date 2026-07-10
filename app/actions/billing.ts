"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUrl, getStripe, hasStripeBillingConfig } from "@/lib/stripe/server";

type CompanyBillingContext = {
  userId: string;
  companyId: string;
  companyName: string;
  adminEmail: string;
  stripeCustomerId: string | null;
};

async function getCompanyBillingContext(): Promise<CompanyBillingContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, company_id, company:companies(id, company_name, stripe_customer_id)")
    .eq("id", user.id)
    .maybeSingle<{
      id: string;
      email: string;
      role: string;
      company_id: string | null;
      company:
        | { id: string; company_name: string; stripe_customer_id: string | null }
        | Array<{ id: string; company_name: string; stripe_customer_id: string | null }>
        | null;
    }>();

  if (profileError || !profile?.company_id || profile.role !== "company_admin") {
    redirect("/company/billing?billing=unauthorized");
  }

  const company = Array.isArray(profile.company) ? profile.company[0] : profile.company;

  if (!company) {
    redirect("/company/billing?billing=missing_company");
  }

  return {
    userId: user.id,
    companyId: profile.company_id,
    companyName: company.company_name,
    adminEmail: profile.email,
    stripeCustomerId: company.stripe_customer_id
  };
}

export async function startCheckoutSessionAction(formData: FormData) {
  if (!hasStripeBillingConfig()) {
    redirect("/company/billing?billing=stripe_not_configured");
  }

  const planId = String(formData.get("planId") ?? "");
  const context = await getCompanyBillingContext();
  const supabase = await createSupabaseServerClient();

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, plan_key, name, stripe_price_id")
    .eq("id", planId)
    .eq("active", true)
    .maybeSingle<{ id: string; plan_key: string; name: string; stripe_price_id: string | null }>();

  if (planError || !plan) {
    redirect("/company/billing?billing=plan_not_found");
  }

  if (!plan.stripe_price_id) {
    redirect("/company/billing?billing=price_not_configured");
  }

  const stripe = getStripe();
  let customerId = context.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: context.adminEmail,
      name: context.companyName,
      metadata: {
        company_id: context.companyId
      }
    });
    customerId = customer.id;

    const adminSupabase = createSupabaseAdminClient();
    await adminSupabase
      .from("companies")
      .update({ stripe_customer_id: customerId })
      .eq("id", context.companyId);
  }

  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${appUrl}/company/billing?billing=checkout_success`,
    cancel_url: `${appUrl}/company/billing?billing=checkout_cancelled`,
    metadata: {
      company_id: context.companyId,
      plan_id: plan.id,
      plan_key: plan.plan_key
    },
    subscription_data: {
      metadata: {
        company_id: context.companyId,
        plan_id: plan.id,
        plan_key: plan.plan_key
      }
    }
  });

  if (!session.url) {
    redirect("/company/billing?billing=checkout_failed");
  }

  redirect(session.url);
}

export async function openBillingPortalAction() {
  if (!hasStripeBillingConfig()) {
    redirect("/company/billing?billing=stripe_not_configured");
  }

  const context = await getCompanyBillingContext();

  if (!context.stripeCustomerId) {
    redirect("/company/billing?billing=no_customer");
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: context.stripeCustomerId,
    return_url: `${appUrl}/company/billing`
  });

  redirect(session.url);
}
