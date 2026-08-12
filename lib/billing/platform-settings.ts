import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvoiceConfig } from "@/lib/billing/eu-invoice";

export type PlatformBillingSettingsRow = {
  id: string;
  seller_legal_name: string;
  seller_vat_number: string | null;
  seller_billing_address: string;
  seller_email: string;
  payment_iban: string;
  payment_bic: string | null;
  payment_bank_name: string | null;
  payment_reference_prefix: string;
  payment_terms: string;
  payment_terms_days: number;
  vat_rate_percent: number;
};

const requiredInvoiceFields = [
  "sellerLegalName",
  "sellerBillingAddress",
  "sellerEmail",
  "paymentIban"
] as const satisfies ReadonlyArray<keyof InvoiceConfig>;

function getEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function getEnvInvoiceConfig(): InvoiceConfig {
  const paymentTermsDays = Number(getEnv("GETH_INVOICE_PAYMENT_TERMS_DAYS") || 14);
  const vatRatePercent = Number(getEnv("GETH_INVOICE_VAT_RATE_PERCENT") || 21);

  return {
    sellerLegalName: getEnv("GETH_INVOICE_SELLER_NAME"),
    sellerVatNumber: getEnv("GETH_INVOICE_SELLER_VAT_NUMBER"),
    sellerBillingAddress: getEnv("GETH_INVOICE_SELLER_ADDRESS"),
    sellerEmail: getEnv("GETH_INVOICE_SELLER_EMAIL"),
    paymentIban: getEnv("GETH_INVOICE_PAYMENT_IBAN"),
    paymentBic: getEnv("GETH_INVOICE_PAYMENT_BIC"),
    paymentBankName: getEnv("GETH_INVOICE_PAYMENT_BANK_NAME"),
    paymentReferencePrefix: getEnv("GETH_INVOICE_PAYMENT_REFERENCE_PREFIX") || "GETH",
    paymentTerms: getEnv("GETH_INVOICE_PAYMENT_TERMS") || `Payment due within ${paymentTermsDays} days by bank transfer.`,
    paymentTermsDays: Number.isFinite(paymentTermsDays) && paymentTermsDays > 0 ? paymentTermsDays : 14,
    vatRateBps: Number.isFinite(vatRatePercent) && vatRatePercent >= 0 ? Math.round(vatRatePercent * 100) : 2100
  };
}

function rowToInvoiceConfig(row: PlatformBillingSettingsRow): InvoiceConfig {
  const paymentTermsDays = Number(row.payment_terms_days) || 14;
  const vatRatePercent = Number(row.vat_rate_percent) || 21;

  return {
    sellerLegalName: row.seller_legal_name.trim(),
    sellerVatNumber: row.seller_vat_number?.trim() ?? "",
    sellerBillingAddress: row.seller_billing_address.trim(),
    sellerEmail: row.seller_email.trim(),
    paymentIban: row.payment_iban.trim(),
    paymentBic: row.payment_bic?.trim() ?? "",
    paymentBankName: row.payment_bank_name?.trim() ?? "",
    paymentReferencePrefix: row.payment_reference_prefix.trim() || "GETH",
    paymentTerms:
      row.payment_terms.trim() || `Payment due within ${paymentTermsDays} days by bank transfer.`,
    paymentTermsDays: Number.isFinite(paymentTermsDays) && paymentTermsDays > 0 ? paymentTermsDays : 14,
    vatRateBps: Number.isFinite(vatRatePercent) && vatRatePercent >= 0 ? Math.round(vatRatePercent * 100) : 2100
  };
}

function mergeInvoiceConfig(row: PlatformBillingSettingsRow | null, envConfig: InvoiceConfig): InvoiceConfig {
  if (!row) {
    return envConfig;
  }

  const dbConfig = rowToInvoiceConfig(row);

  return {
    sellerLegalName: dbConfig.sellerLegalName || envConfig.sellerLegalName,
    sellerVatNumber: dbConfig.sellerVatNumber || envConfig.sellerVatNumber,
    sellerBillingAddress: dbConfig.sellerBillingAddress || envConfig.sellerBillingAddress,
    sellerEmail: dbConfig.sellerEmail || envConfig.sellerEmail,
    paymentIban: dbConfig.paymentIban || envConfig.paymentIban,
    paymentBic: dbConfig.paymentBic || envConfig.paymentBic,
    paymentBankName: dbConfig.paymentBankName || envConfig.paymentBankName,
    paymentReferencePrefix: dbConfig.paymentReferencePrefix || envConfig.paymentReferencePrefix,
    paymentTerms: dbConfig.paymentTerms || envConfig.paymentTerms,
    paymentTermsDays: dbConfig.paymentTermsDays || envConfig.paymentTermsDays,
    vatRateBps: dbConfig.vatRateBps || envConfig.vatRateBps
  };
}

export function getMissingInvoiceFieldsFromConfig(config: InvoiceConfig) {
  const missing: string[] = [];

  if (!config.sellerLegalName) missing.push("sellerLegalName");
  if (!config.sellerBillingAddress) missing.push("sellerBillingAddress");
  if (!config.sellerEmail) missing.push("sellerEmail");
  if (!config.paymentIban) missing.push("paymentIban");

  return missing;
}

export async function loadPlatformBillingSettings(
  supabase: SupabaseClient
): Promise<PlatformBillingSettingsRow | null> {
  const { data, error } = await supabase
    .from("platform_billing_settings")
    .select(
      "id, seller_legal_name, seller_vat_number, seller_billing_address, seller_email, payment_iban, payment_bic, payment_bank_name, payment_reference_prefix, payment_terms, payment_terms_days, vat_rate_percent"
    )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<PlatformBillingSettingsRow>();

  if (error) {
    console.warn("loadPlatformBillingSettings failed:", error.message);
    return null;
  }

  return data;
}

export async function resolveInvoiceConfig(supabase?: SupabaseClient): Promise<InvoiceConfig> {
  const envConfig = getEnvInvoiceConfig();

  if (!supabase) {
    return envConfig;
  }

  const row = await loadPlatformBillingSettings(supabase);
  return mergeInvoiceConfig(row, envConfig);
}

export async function getMissingInvoiceConfig(supabase?: SupabaseClient) {
  const config = await resolveInvoiceConfig(supabase);
  return getMissingInvoiceFieldsFromConfig(config);
}

export async function getInvoiceConfig(supabase?: SupabaseClient): Promise<InvoiceConfig> {
  const config = await resolveInvoiceConfig(supabase);
  const missing = getMissingInvoiceFieldsFromConfig(config);

  if (missing.length) {
    throw new Error(`Missing invoice configuration: ${missing.join(", ")}`);
  }

  return config;
}

export function platformBillingSettingsToFormValues(
  row: PlatformBillingSettingsRow | null,
  envConfig: InvoiceConfig
) {
  const merged = mergeInvoiceConfig(row, envConfig);

  return {
    sellerLegalName: merged.sellerLegalName,
    sellerVatNumber: merged.sellerVatNumber,
    sellerBillingAddress: merged.sellerBillingAddress,
    sellerEmail: merged.sellerEmail,
    paymentIban: merged.paymentIban,
    paymentBic: merged.paymentBic,
    paymentBankName: merged.paymentBankName,
    paymentReferencePrefix: merged.paymentReferencePrefix,
    paymentTerms: merged.paymentTerms,
    paymentTermsDays: String(merged.paymentTermsDays),
    vatRatePercent: String(merged.vatRateBps / 100)
  };
}

export { requiredInvoiceFields };
