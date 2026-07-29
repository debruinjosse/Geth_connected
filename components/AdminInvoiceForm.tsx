"use client";

import { useState } from "react";
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

const YEARLY_BILLING_MULTIPLIER = 0.8;

function formatCurrency(cents: number | null, currency = "eur") {
  if (!cents || cents <= 0) return "Custom";

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(cents / 100);
}

function isCustomPlan(plan: PlanOption | undefined) {
  return !plan || plan.plan_key === "enterprise" || !plan.price_cents;
}

function formatPlanOption(plan: PlanOption) {
  if (isCustomPlan(plan)) return `${plan.name} - Custom`;
  return `${plan.name} - ${formatCurrency(plan.price_cents, plan.currency)} / user / month`;
}

function calculateSubtotal(plan: PlanOption | undefined, billingInterval: BillingInterval, seatCount: number, customAmount: string) {
  if (!plan) return null;

  if (isCustomPlan(plan)) {
    const amount = Number(customAmount.replace(",", "."));
    return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
  }

  const monthlySubtotal = (plan.price_cents ?? 0) * seatCount;
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
  const [customAmount, setCustomAmount] = useState("");

  const selectedPlan = plans.find((plan) => plan.id === planId);
  const parsedSeatCount = Math.max(1, Number.parseInt(seatCount, 10) || 1);
  const subtotal = calculateSubtotal(selectedPlan, billingInterval, parsedSeatCount, customAmount);
  const previewCurrency = selectedPlan?.currency ?? "eur";

  return (
    <form action={requestInvoicePaymentAction} className="form-grid admin-company-create-form admin-invoice-form">
      <input type="hidden" name="locale" value={locale} />
      <div className="form-field">
        <label htmlFor="companyId">Company</label>
        <select id="companyId" className="input" name="companyId" required>
          <option value="">Choose company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>{company.company_name}</option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="planId">Plan</label>
        <select id="planId" className="input" name="planId" required value={planId} onChange={(event) => setPlanId(event.target.value)}>
          <option value="">Choose plan</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id} disabled={plan.invoice_enabled === false}>
              {formatPlanOption(plan)}
            </option>
          ))}
        </select>
        <span className="field-help">Starter and Growth calculate from users. Enterprise uses the custom amount below.</span>
      </div>
      <div className="form-field">
        <label htmlFor="billingInterval">Billing period</label>
        <select
          id="billingInterval"
          className="input"
          name="billingInterval"
          required
          value={billingInterval}
          onChange={(event) => setBillingInterval(event.target.value as BillingInterval)}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly - 20% yearly saving</option>
        </select>
      </div>
      <div className="form-field">
        <label htmlFor="seatCount">Users per month</label>
        <input
          id="seatCount"
          className="input"
          name="seatCount"
          type="number"
          min="1"
          step="1"
          value={seatCount}
          onChange={(event) => setSeatCount(event.target.value)}
          required
        />
        <span className="field-help">Used on the invoice line item and to calculate Starter/Growth pricing.</span>
      </div>
      <div className="form-field">
        <label htmlFor="customAmount">Custom Enterprise amount</label>
        <input
          id="customAmount"
          className="input"
          name="customAmount"
          type="number"
          min="0"
          step="0.01"
          placeholder="Required for Enterprise, e.g. 1250.00"
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
        />
        <span className="field-help">Enter the agreed subtotal before VAT for Enterprise/custom invoices.</span>
      </div>
      <div className="form-field admin-invoice-preview">
        <span className="eyebrow">Invoice subtotal</span>
        <strong>{subtotal === null ? "Choose values" : formatCurrency(subtotal, previewCurrency)}</strong>
        <p>
          {isCustomPlan(selectedPlan)
            ? "Custom Enterprise amount before VAT."
            : `${parsedSeatCount} user${parsedSeatCount === 1 ? "" : "s"} x ${selectedPlan ? formatCurrency(selectedPlan.price_cents, selectedPlan.currency) : "plan price"}${billingInterval === "yearly" ? " x 12 months with 20% yearly saving" : " per month"}.`}
        </p>
      </div>
      <div className="form-field">
        <label htmlFor="billingEmail">Billing email</label>
        <input id="billingEmail" className="input" name="billingEmail" type="email" placeholder="finance@company.eu" required />
      </div>
      <div className="form-field">
        <label htmlFor="vatNumber">VAT number</label>
        <input id="vatNumber" className="input" name="vatNumber" placeholder="EU VAT number, if applicable" />
      </div>
      <div className="form-field">
        <label htmlFor="purchaseOrderNumber">Purchase order</label>
        <input id="purchaseOrderNumber" className="input" name="purchaseOrderNumber" placeholder="Optional PO number" />
      </div>
      <div className="form-field">
        <label htmlFor="billingAddress">Billing address</label>
        <textarea id="billingAddress" className="input" name="billingAddress" rows={3} placeholder="Company legal billing address" required />
      </div>
      <div className="form-field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" className="input" name="notes" rows={3} placeholder="Payment terms, onboarding notes, or admin invite reminder" />
      </div>
      <div className="form-field admin-company-create-submit">
        <span className="field-help">After payment is confirmed, create or send the company admin invite so they can add managers and employees.</span>
        <button className="btn btn-primary" type="submit"><FileText size={16} /> Generate invoice</button>
      </div>
    </form>
  );
}
