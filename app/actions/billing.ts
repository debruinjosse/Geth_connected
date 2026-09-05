"use server";

import { redirect } from "next/navigation";
import {
  addDays,
  calculateVat,
  createInvoiceNumber,
  createInvoicePdf,
  formatMoney,
  toDateOnly
} from "@/lib/billing/eu-invoice";
import { getInvoiceConfig, getMissingInvoiceConfig } from "@/lib/billing/platform-settings";
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

type BillingInterval = "monthly" | "yearly";

const YEARLY_BILLING_MULTIPLIER = 0.8;

function getBillingReturnUrl(locale: string, companyOwned: boolean) {
  return companyOwned ? `/${locale}/company/billing` : `/${locale}/admin/subscriptions`;
}

function getBillingInterval(value: FormDataEntryValue | null): BillingInterval | null {
  if (value === "monthly" || value === "yearly") return value;
  return null;
}

function parseSeatCount(value: FormDataEntryValue | null) {
  const seatCount = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(seatCount) && seatCount > 0 ? seatCount : null;
}

function parseEuroAmountCents(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) return null;

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  return Math.round(amount * 100);
}

function isCustomPlan(plan: { plan_key: string; price_cents: number | null }) {
  return plan.plan_key === "enterprise";
}

function usesCustomPricing(
  plan: { plan_key: string; price_cents: number | null },
  useCustomPrice: boolean
) {
  return isCustomPlan(plan) || useCustomPrice;
}

const PLAN_PRICE_FALLBACK_CENTS: Record<string, number> = {
  growth: 1199,
  starter: 1900
};

function resolvePlanPriceCents(plan: { plan_key: string; price_cents: number | null }): number {
  if (plan.plan_key === "enterprise") return plan.price_cents ?? 0;
  if (plan.price_cents && plan.price_cents > 0) return plan.price_cents;
  return PLAN_PRICE_FALLBACK_CENTS[plan.plan_key] ?? plan.price_cents ?? 0;
}

function calculateInvoiceSubtotalCents({
  billingInterval,
  customAmountCents,
  plan,
  seatCount,
  useCustomPrice
}: {
  billingInterval: BillingInterval;
  customAmountCents: number | null;
  plan: { plan_key: string; price_cents: number | null };
  seatCount: number;
  useCustomPrice: boolean;
}) {
  if (usesCustomPricing(plan, useCustomPrice)) {
    return customAmountCents ?? 0;
  }

  const monthlySubtotal = resolvePlanPriceCents(plan) * seatCount;

  if (billingInterval === "yearly") {
    return Math.round(monthlySubtotal * 12 * YEARLY_BILLING_MULTIPLIER);
  }

  return monthlySubtotal;
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

/**
 * Role: `company_admin` for their own company, or `platform_admin`/`super_admin` acting on a
 * company's behalf via `companyId`. Generates a manual EU invoice (VAT calculation, PDF, invoice
 * number), emails it to the billing contact, and marks the company/subscription as invoice-issued.
 * Notifies platform admins on success or if the invoice email fails to send.
 */
export async function requestInvoicePaymentAction(formData: FormData) {
  const planId = String(formData.get("planId") ?? "");
  const companyId = String(formData.get("companyId") ?? "").trim();
  const billingInterval = getBillingInterval(formData.get("billingInterval"));
  const seatCount = parseSeatCount(formData.get("seatCount"));
  const customAmountCents = parseEuroAmountCents(formData.get("customAmount"));
  const useCustomPrice = String(formData.get("useCustomPrice") ?? "").trim() === "true";
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

  if (!billingInterval || !seatCount) {
    redirect(`${returnUrl}?billing=invalid_invoice_inputs`);
  }

  const adminSupabase = createSupabaseAdminClient();
  const missingInvoiceConfig = await getMissingInvoiceConfig(adminSupabase);
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
      price_cents: number | null;
      currency: string;
      interval: string;
    }>();

  if (planError || !plan) {
    redirect(`${returnUrl}?billing=plan_not_found`);
  }

  if (plan.invoice_enabled === false) {
    redirect(`${returnUrl}?billing=invoice_not_enabled`);
  }

  const customPricing = usesCustomPricing(plan, useCustomPrice);

  if (customPricing && !customAmountCents) {
    redirect(`${returnUrl}?billing=custom_amount_required`);
  }

  const contactEmail = billingEmail || context.adminEmail;
  const now = new Date().toISOString();
  const invoiceConfig = await getInvoiceConfig(adminSupabase);
  const issueDate = new Date();
  const dueDate = addDays(issueDate, invoiceConfig.paymentTermsDays);
  const subtotalCents = calculateInvoiceSubtotalCents({
    billingInterval,
    customAmountCents,
    plan,
    seatCount,
    useCustomPrice
  });
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
      billing_interval: billingInterval,
      seat_count: seatCount,
      custom_amount_cents: customPricing ? customAmountCents : null,
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
        current_period_end: billingInterval === "yearly" ? addDays(issueDate, 365).toISOString() : addDays(issueDate, 30).toISOString(),
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
    billing_interval: billingInterval,
    seat_count: seatCount,
    unit_price_cents: customPricing ? null : resolvePlanPriceCents(plan),
    custom_amount_cents: customPricing ? customAmountCents : null,
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

/** Role: `company_admin`. Creates (or reuses) a Stripe customer and starts a Stripe Checkout subscription session. */
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

/** Role: `company_admin`. Opens the Stripe customer billing portal for the caller's company. */
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

async function requirePlatformAdminForBilling() {
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
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  return { supabase, user };
}

/**
 * Role: `platform_admin`/`super_admin` only. Updates the platform-wide invoicing details (seller
 * legal/VAT info, IBAN/BIC, payment terms, VAT rate) that `requestInvoicePaymentAction` reads.
 */
export async function updatePlatformBillingSettingsAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en").trim() || "en";
  const returnTo = `/${locale}/admin/settings`;
  const { user } = await requirePlatformAdminForBilling();
  const adminSupabase = createSupabaseAdminClient();

  const sellerLegalName = String(formData.get("sellerLegalName") ?? "").trim();
  const sellerVatNumber = String(formData.get("sellerVatNumber") ?? "").trim();
  const sellerBillingAddress = String(formData.get("sellerBillingAddress") ?? "").trim();
  const sellerEmail = String(formData.get("sellerEmail") ?? "").trim();
  const paymentIban = String(formData.get("paymentIban") ?? "").trim();
  const paymentBic = String(formData.get("paymentBic") ?? "").trim();
  const paymentBankName = String(formData.get("paymentBankName") ?? "").trim();
  const paymentReferencePrefix = String(formData.get("paymentReferencePrefix") ?? "GETH").trim() || "GETH";
  const paymentTerms = String(formData.get("paymentTerms") ?? "").trim();
  const paymentTermsDays = Number.parseInt(String(formData.get("paymentTermsDays") ?? "14"), 10);
  const vatRatePercent = Number.parseFloat(String(formData.get("vatRatePercent") ?? "21").replace(",", "."));

  if (!sellerLegalName || !sellerBillingAddress || !sellerEmail || !paymentIban) {
    redirect(`${returnTo}?settings=billing-missing-required`);
  }

  const payload = {
    seller_legal_name: sellerLegalName,
    seller_vat_number: sellerVatNumber || null,
    seller_billing_address: sellerBillingAddress,
    seller_email: sellerEmail,
    payment_iban: paymentIban,
    payment_bic: paymentBic || null,
    payment_bank_name: paymentBankName || null,
    payment_reference_prefix: paymentReferencePrefix,
    payment_terms: paymentTerms || `Payment due within ${paymentTermsDays} days by bank transfer.`,
    payment_terms_days: Number.isFinite(paymentTermsDays) && paymentTermsDays > 0 ? paymentTermsDays : 14,
    vat_rate_percent: Number.isFinite(vatRatePercent) && vatRatePercent >= 0 ? vatRatePercent : 21,
    updated_by: user.id
  };

  const { data: existing } = await adminSupabase.from("platform_billing_settings").select("id").limit(1).maybeSingle<{ id: string }>();

  if (existing?.id) {
    const { error } = await adminSupabase.from("platform_billing_settings").update(payload).eq("id", existing.id);
    if (error) {
      redirect(`${returnTo}?settings=billing-save-failed`);
    }
  } else {
    const { error } = await adminSupabase.from("platform_billing_settings").insert(payload);
    if (error) {
      redirect(`${returnTo}?settings=billing-save-failed`);
    }
  }

  redirect(`${returnTo}?settings=billing-saved`);
}
