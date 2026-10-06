"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FieldGrid, Input, Select, Textarea } from "@/components/ui/Fields";
import { FileText } from "lucide-react";
import { requestInvoicePaymentAction } from "@/app/actions/billing";

type CompanyOption = {
  id: string;
  company_name: string;
};

type PlanOption = {
  id: string;
  plan_key: string;
  name: string;
  price_cents: number | null;
  currency: string;
  interval: string;
  invoice_enabled: boolean | null;
};

type BillingInterval = "monthly" | "yearly";
type PricingMode = "standard" | "custom";

const YEARLY_BILLING_MULTIPLIER = 0.8;

function formatCurrency(cents: number | null, currency = "eur") {
  if (!cents || cents <= 0) return "Custom";

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(cents / 100);
}

function isEnterprisePlan(plan: PlanOption | undefined) {
  return plan?.plan_key === "enterprise";
}

const PLAN_PRICE_FALLBACK_CENTS: Record<string, number> = {
  growth: 1199,
  starter: 1900
};

function resolvePlanPriceCents(plan: PlanOption) {
  if (isEnterprisePlan(plan)) return plan.price_cents;
  if (plan.price_cents && plan.price_cents > 0) return plan.price_cents;
  return PLAN_PRICE_FALLBACK_CENTS[plan.plan_key] ?? plan.price_cents;
}

function formatPlanOption(plan: PlanOption) {
  if (isEnterprisePlan(plan)) return `${plan.name} - Custom pricing`;
  const priceCents = resolvePlanPriceCents(plan);
  return `${plan.name} - ${formatCurrency(priceCents, plan.currency)} / user / month`;
}

function calculateSubtotal(
  plan: PlanOption | undefined,
  pricingMode: PricingMode,
  billingInterval: BillingInterval,
  seatCount: number,
  customAmount: string
) {
  if (!plan) return null;

  if (pricingMode === "custom" || isEnterprisePlan(plan)) {
    const amount = Number(customAmount.replace(",", "."));
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
  }

  const monthlySubtotal = (resolvePlanPriceCents(plan) ?? 0) * seatCount;
  return billingInterval === "yearly" ? Math.round(monthlySubtotal * 12 * YEARLY_BILLING_MULTIPLIER) : monthlySubtotal;
}

export function AdminInvoiceForm({
  companies,
  locale,
  plans
}: {
  companies: CompanyOption[];
  locale: string;
  plans: PlanOption[];
}) {
  const [planId, setPlanId] = useState("");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [seatCount, setSeatCount] = useState("1");
  const [pricingMode, setPricingMode] = useState<PricingMode>("standard");
  const [customAmount, setCustomAmount] = useState("");

  const billablePlans = plans.filter(
    (plan) => plan.plan_key === "growth" || plan.plan_key === "enterprise" || plan.plan_key === "starter"
  );
  const selectedPlan = billablePlans.find((plan) => plan.id === planId);
  const enterpriseSelected = isEnterprisePlan(selectedPlan);
  const customPricingActive = enterpriseSelected || pricingMode === "custom";
  const parsedSeatCount = Math.max(1, Number.parseInt(seatCount, 10) || 1);
  const effectivePricingMode: PricingMode = customPricingActive ? "custom" : "standard";
  const subtotal = calculateSubtotal(selectedPlan, effectivePricingMode, billingInterval, parsedSeatCount, customAmount);
  const previewCurrency = selectedPlan?.currency ?? "eur";

  useEffect(() => {
    if (enterpriseSelected) {
      setPricingMode("custom");
    }
  }, [enterpriseSelected]);

  return (
    <form action={requestInvoicePaymentAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="useCustomPrice" value={customPricingActive ? "true" : "false"} />

      <FieldGrid>
        <Field label="Company" htmlFor="companyId" required>
          <Select id="companyId" name="companyId" required>
            <option value="">Choose company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.company_name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Plan" htmlFor="planId" required hint="Growth uses €11.99 per employee/month. Custom/Enterprise always uses your custom amount.">
          <Select id="planId" name="planId" required value={planId} onChange={(event) => setPlanId(event.target.value)}>
            <option value="">Choose plan</option>
            {billablePlans.map((plan) => (
              <option key={plan.id} value={plan.id} disabled={plan.invoice_enabled === false}>
                {formatPlanOption(plan)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Billing period" htmlFor="billingInterval" required>
          <Select id="billingInterval" name="billingInterval" required value={billingInterval} onChange={(event) => setBillingInterval(event.target.value as BillingInterval)}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly - 20% yearly saving</option>
          </Select>
        </Field>

        <Field label="Users on invoice" htmlFor="seatCount" required hint="Shown on the invoice line item. Used to calculate standard plan pricing.">
          <Input id="seatCount" name="seatCount" type="number" min="1" step="1" value={seatCount} onChange={(event) => setSeatCount(event.target.value)} required />
        </Field>

        <div className="lp-field lp-span-2">
          <span className="lp-label">Pricing method</span>
          <div className="lp-radio-tiles" role="radiogroup" aria-label="Pricing method">
            <label className="lp-radio-tile">
              <input type="radio" name="pricingModeUi" value="standard" checked={!customPricingActive} disabled={enterpriseSelected} onChange={() => setPricingMode("standard")} />
              <span>
                <strong>Standard plan pricing</strong>
                <small>Calculate from plan rate, users, and billing period.</small>
              </span>
            </label>
            <label className="lp-radio-tile">
              <input type="radio" name="pricingModeUi" value="custom" checked={customPricingActive} onChange={() => setPricingMode("custom")} />
              <span>
                <strong>Custom invoice amount</strong>
                <small>Enter an agreed subtotal before VAT.</small>
              </span>
            </label>
          </div>
        </div>

        {customPricingActive ? (
          <Field label="Custom invoice amount (€)" htmlFor="customAmount" required hint="Subtotal before VAT. The invoice PDF and email use this exact amount." className="lp-span-2">
            <Input id="customAmount" name="customAmount" type="number" min="0" step="0.01" placeholder="e.g. 1250.00" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} required />
          </Field>
        ) : null}

        <div className="lp-subtotal lp-span-2">
          <div>
            <small>Invoice subtotal</small>
            <p>
              {customPricingActive
                ? "Custom amount before VAT."
                : `${parsedSeatCount} user${parsedSeatCount === 1 ? "" : "s"} × ${selectedPlan ? formatCurrency(resolvePlanPriceCents(selectedPlan), selectedPlan.currency) : "plan price"}${billingInterval === "yearly" ? " × 12 months with 20% yearly saving" : " per month"}.`}
            </p>
          </div>
          <strong>{subtotal === null ? "—" : formatCurrency(subtotal, previewCurrency)}</strong>
        </div>

        <Field label="Billing email" htmlFor="billingEmail" required>
          <Input id="billingEmail" name="billingEmail" type="email" placeholder="finance@company.eu" required />
        </Field>
        <Field label="VAT number" htmlFor="vatNumber">
          <Input id="vatNumber" name="vatNumber" placeholder="EU VAT number, if applicable" />
        </Field>
        <Field label="Purchase order" htmlFor="purchaseOrderNumber">
          <Input id="purchaseOrderNumber" name="purchaseOrderNumber" placeholder="Optional PO number" />
        </Field>
        <Field label="Billing address" htmlFor="billingAddress" required>
          <Textarea id="billingAddress" name="billingAddress" rows={3} placeholder="Company legal billing address" required />
        </Field>
        <Field label="Notes" htmlFor="notes" className="lp-span-2">
          <Textarea id="notes" name="notes" rows={3} placeholder="Payment terms, onboarding notes, or admin invite reminder" />
        </Field>
      </FieldGrid>

      <div className="lp-form-foot">
        <small className="lp-hint">After payment is confirmed, create or send the company admin invite so they can add managers and employees.</small>
        <Button type="submit" icon={<FileText />}>Generate invoice</Button>
      </div>
    </form>
  );
}
