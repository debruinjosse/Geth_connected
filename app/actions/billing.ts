"use server";

import { redirect } from "next/navigation";
import {
  addDays,
  calculateVat,
  createInvoiceNumber,
  createInvoicePdf,
  formatMoney,
  getInvoiceConfig,
  getMissingInvoiceConfig,
  toDateOnly
} from "@/lib/billing/eu-invoice";
import { sendInvoiceEmail } from "@/lib/mail/nodemailer";
import { createPlatformAdminNotifications } from "@/lib/notifications";
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

function getBillingReturnUrl(locale: string, companyOwned: boolean) {
  return companyOwned ? `/${locale}/company/billing` : `/${locale}/admin/subscriptions`;
}

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

async function getPlatformBillingContext(companyId: string): Promise<CompanyBillingContext> {
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
    .select("id, email, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; email: string | null; role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/admin/subscriptions?billing=unauthorized");
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, company_name, billing_email, stripe_customer_id")
    .eq("id", companyId)
    .maybeSingle<{ id: string; company_name: string; billing_email: string | null; stripe_customer_id: string | null }>();

  if (companyError || !company) {
    redirect("/admin/subscriptions?billing=missing_company");
  }

  return {
    userId: user.id,
    companyId: company.id,
    companyName: company.company_name,
    adminEmail: company.billing_email || profile.email || "",
    stripeCustomerId: company.stripe_customer_id
  };
}

export async function requestInvoicePaymentAction(formData: FormData) {
  const planId = String(formData.get("planId") ?? "");
  const companyId = String(formData.get("companyId") ?? "").trim();
  const billingEmail = String(formData.get("billingEmail") ?? "").trim();
  const vatNumber = String(formData.get("vatNumber") ?? "").trim();
  const purchaseOrderNumber = String(formData.get("purchaseOrderNumber") ?? "").trim();
  const billingAddress = String(formData.get("billingAddress") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en").trim() || "en";
  const companyOwned = !companyId;
  const returnUrl = getBillingReturnUrl(locale, companyOwned);
  const context = companyId ? await getPlatformBillingContext(companyId) : await getCompanyBillingContext();
  const supabase = await createSupabaseServerClient();

  if (!companyId) {
    redirect(`/${locale}/company/billing?billing=owner_managed`);
  }

  if (!planId) {
    redirect(`${returnUrl}?billing=plan_not_found`);
  }

  const missingInvoiceConfig = getMissingInvoiceConfig();
  if (missingInvoiceConfig.length) {
    redirect(`${returnUrl}?billing=invoice_config_missing`);
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, plan_key, name, invoice_enabled, price_cents, currency, interval")
    .eq("id", planId)
    .eq("active", true)
    .maybeSingle<{
      id: string;
      plan_key: string;
      name: string;
      invoice_enabled: boolean | null;
      price_cents: number;
      currency: string;
      interval: string;
    }>();

  if (planError || !plan) {
    redirect(`${returnUrl}?billing=plan_not_found`);
  }

  if (plan.invoice_enabled === false) {
    redirect(`${returnUrl}?billing=invoice_not_enabled`);
  }

  const contactEmail = billingEmail || context.adminEmail;
  const adminSupabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const invoiceConfig = getInvoiceConfig();
  const issueDate = new Date();
  const dueDate = addDays(issueDate, invoiceConfig.paymentTermsDays);
  const subtotalCents = plan.price_cents ?? 0;
  const vatCents = calculateVat(subtotalCents, invoiceConfig.vatRateBps);
  const invoiceNumber = createInvoiceNumber();
  const referenceSource = purchaseOrderNumber || invoiceNumber;
  const paymentReference = invoiceConfig.paymentReferencePrefix
    ? `${invoiceConfig.paymentReferencePrefix}-${referenceSource}`
    : referenceSource;
  const paymentTerms = [invoiceConfig.paymentTerms, invoiceConfig.paymentBankName ? `Bank: ${invoiceConfig.paymentBankName}.` : ""]
    .filter(Boolean)
    .join(" ");

  const { data: invoiceRequest, error: requestError } = await adminSupabase
    .from("billing_invoice_requests")
    .insert({
      company_id: context.companyId,
      plan_id: plan.id,
      requested_by: context.userId,
      billing_email: contactEmail,
      vat_number: vatNumber || null,
      purchase_order_number: purchaseOrderNumber || null,
      billing_address: billingAddress || null,
      notes: notes || null,
      status: "generated"
    })
    .select("id")
    .single<{ id: string }>();

  if (requestError || !invoiceRequest) {
    redirect(`${returnUrl}?billing=invoice_request_failed`);
  }

  const { data: subscription } = await adminSupabase
    .from("subscriptions")
    .upsert(
      {
        company_id: context.companyId,
        plan_id: plan.id,
        payment_method: "invoice",
        invoice_status: "issued",
        invoice_requested_at: now,
        billing_contact_email: contactEmail,
        status: "invoice_issued",
        updated_at: now
      },
      { onConflict: "company_id" }
    )
    .select("id")
    .single<{ id: string }>();

  const invoicePayload = {
    company_id: context.companyId,
    subscription_id: subscription?.id ?? null,
    invoice_request_id: invoiceRequest.id,
    plan_id: plan.id,
    invoice_number: invoiceNumber,
    status: "issued",
    issue_date: toDateOnly(issueDate),
    due_date: toDateOnly(dueDate),
    currency: plan.currency ?? "eur",
    subtotal_cents: subtotalCents,
    vat_rate_bps: invoiceConfig.vatRateBps,
    vat_cents: vatCents,
    total_cents: subtotalCents + vatCents,
    billing_email: contactEmail,
    buyer_name: context.companyName,
    buyer_vat_number: vatNumber || null,
    buyer_billing_address: billingAddress || null,
    seller_legal_name: invoiceConfig.sellerLegalName,
    seller_vat_number: invoiceConfig.sellerVatNumber || null,
    seller_billing_address: invoiceConfig.sellerBillingAddress,
    seller_email: invoiceConfig.sellerEmail,
    payment_iban: invoiceConfig.paymentIban,
    payment_bic: invoiceConfig.paymentBic || null,
    payment_reference: paymentReference,
    payment_terms: paymentTerms,
    notes: notes || null,
    created_by: context.userId
  };

  const { data: invoice, error: invoiceError } = await adminSupabase
    .from("billing_invoices")
    .insert(invoicePayload)
    .select("id")
    .single<{ id: string }>();

  if (invoiceError || !invoice) {
    redirect(`${returnUrl}?billing=invoice_generation_failed`);
  }

  await adminSupabase
    .from("companies")
    .update({
      subscription_plan: plan.plan_key,
      subscription_status: "invoice_issued",
      billing_payment_method: "invoice",
      billing_email: contactEmail,
      billing_notes: notes || null
    })
    .eq("id", context.companyId);

  const invoiceUrl = `${getAppUrl()}/${locale}/company/billing/invoices/${invoice.id}/pdf`;

  try {
    const pdf = createInvoicePdf({
      ...invoicePayload,
      plan: { name: plan.name, plan_key: plan.plan_key },
      company: { company_name: context.companyName }
    });

    await sendInvoiceEmail({
      to: contactEmail,
      companyName: context.companyName,
      invoiceNumber,
      totalLabel: formatMoney(subtotalCents + vatCents, plan.currency ?? "eur"),
      dueDate: toDateOnly(dueDate),
      invoiceUrl,
      pdf
    });

    await adminSupabase
      .from("billing_invoices")
      .update({ email_sent_at: new Date().toISOString(), email_error: null })
      .eq("id", invoice.id);
  } catch (error) {
    await adminSupabase
      .from("billing_invoices")
      .update({ email_error: error instanceof Error ? error.message : "Invoice email failed" })
      .eq("id", invoice.id);

    await createPlatformAdminNotifications(adminSupabase, {
      companyId: context.companyId,
      type: "invoice_email_failed",
      title: "Invoice generated but email failed",
      body: `${invoiceNumber} was generated for ${context.companyName}, but SMTP delivery failed. Download and send the PDF manually or check get.pro SMTP settings.`,
      href: `/admin/subscriptions`
    });

    redirect(`${returnUrl}?billing=invoice_generated_email_failed&invoice=${invoice.id}`);
  }

  await createPlatformAdminNotifications(adminSupabase, {
    companyId: context.companyId,
    type: "invoice_issued",
    title: "Invoice issued",
    body: `${invoiceNumber} was generated for ${context.companyName}. After payment is confirmed, invite or activate the company admin.`,
    href: `/admin/subscriptions`
  });

  redirect(`${returnUrl}?billing=invoice_generated&invoice=${invoice.id}`);
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
