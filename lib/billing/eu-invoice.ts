import { randomUUID } from "node:crypto";

export type InvoiceConfig = {
  sellerLegalName: string;
  sellerVatNumber: string;
  sellerBillingAddress: string;
  sellerEmail: string;
  paymentIban: string;
  paymentBic: string;
  paymentBankName: string;
  paymentReferencePrefix: string;
  paymentTerms: string;
  paymentTermsDays: number;
  vatRateBps: number;
};

export type InvoiceDocument = {
  invoice_number: string;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal_cents: number;
  vat_rate_bps: number;
  vat_cents: number;
  total_cents: number;
  billing_interval?: string | null;
  seat_count?: number | null;
  unit_price_cents?: number | null;
  custom_amount_cents?: number | null;
  billing_email: string;
  buyer_name: string;
  buyer_vat_number: string | null;
  buyer_billing_address: string | null;
  seller_legal_name: string;
  seller_vat_number: string | null;
  seller_billing_address: string;
  seller_email: string;
  payment_iban: string;
  payment_bic: string | null;
  payment_reference: string;
  payment_terms: string;
  notes: string | null;
  plan?: { name: string | null; plan_key: string | null } | Array<{ name: string | null; plan_key: string | null }> | null;
  company?: { company_name: string | null } | Array<{ company_name: string | null }> | null;
};

const requiredInvoiceEnv = [
  "GETH_INVOICE_SELLER_NAME",
  "GETH_INVOICE_SELLER_ADDRESS",
  "GETH_INVOICE_SELLER_EMAIL",
  "GETH_INVOICE_PAYMENT_IBAN"
] as const;

function getEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function getMissingInvoiceConfig() {
  return requiredInvoiceEnv.filter((name) => !getEnv(name));
}

export function getInvoiceConfig(): InvoiceConfig {
  const missing = getMissingInvoiceConfig();
  if (missing.length) {
    throw new Error(`Missing invoice configuration: ${missing.join(", ")}`);
  }

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
    paymentReferencePrefix: getEnv("GETH_INVOICE_PAYMENT_REFERENCE_PREFIX"),
    paymentTerms: getEnv("GETH_INVOICE_PAYMENT_TERMS") || `Payment due within ${paymentTermsDays} days by bank transfer.`,
    paymentTermsDays: Number.isFinite(paymentTermsDays) && paymentTermsDays > 0 ? paymentTermsDays : 14,
    vatRateBps: Number.isFinite(vatRatePercent) && vatRatePercent >= 0 ? Math.round(vatRatePercent * 100) : 2100
  };
}

export function createInvoiceNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `GETH-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function calculateVat(subtotalCents: number, vatRateBps: number) {
  return Math.round((subtotalCents * vatRateBps) / 10000);
}

export function formatMoney(cents: number, currency = "eur") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency.toUpperCase()
  }).format(cents / 100);
}

export function getSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function pdfEscape(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n]+/g, " ");
}

function wrapText(text: string, maxLength: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function wrapAddressLines(text: string, maxLength: number) {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      continue;
    }

    lines.push(...wrapText(trimmed, maxLength));
  }

  return lines.length ? lines : [""];
}

function textLine(x: number, y: number, text: string | number, size = 10, font = "F1") {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET`;
}

function moneyLine(label: string, value: string, y: number) {
  return `${textLine(360, y, label, 10)}\n${textLine(485, y, value, 10, "F2")}`;
}

function formatInterval(value: string | null | undefined) {
  return value === "yearly" ? "Yearly" : "Monthly";
}

export function createInvoicePdf(invoice: InvoiceDocument) {
  const plan = getSingle(invoice.plan);
  const company = getSingle(invoice.company);
  const lines: string[] = [];
  const seatCount = invoice.seat_count && invoice.seat_count > 0 ? invoice.seat_count : 1;
  const intervalLabel = formatInterval(invoice.billing_interval);
  const isCustomAmount = typeof invoice.custom_amount_cents === "number" && invoice.custom_amount_cents > 0;
  const descriptionParts = [
    plan?.name ? `GETH ${plan.name} subscription` : "GETH subscription",
    `${intervalLabel.toLowerCase()} billing`,
    `${seatCount} user${seatCount === 1 ? "" : "s"}`
  ];
  const description = descriptionParts.join(" - ");

  lines.push("0.08 0.03 0.14 rg 0 738 595 104 re f");
  lines.push("0.86 0.64 0.23 rg 48 774 38 38 re f");
  lines.push("1 1 1 rg");
  lines.push(textLine(59, 787, "G", 20, "F2"));
  lines.push("0.86 0.64 0.23 rg");
  lines.push(textLine(98, 795, "GETH®", 24, "F2"));
  lines.push(textLine(100, 778, "RECOGNIZE TO ENERGIZE", 7, "F2"));
  lines.push("1 1 1 rg");
  lines.push(textLine(390, 792, "INVOICE", 28, "F2"));
  lines.push(textLine(390, 770, invoice.invoice_number, 11));
  lines.push("0 0 0 rg");
  lines.push(textLine(48, 720, "Recognition platform invoice", 10));

  lines.push(textLine(48, 688, "Seller", 12, "F2"));
  lines.push(textLine(48, 672, invoice.seller_legal_name, 10));
  let y = 658;
  for (const line of wrapAddressLines(invoice.seller_billing_address, 52)) {
    lines.push(textLine(48, y, line, 9));
    y -= 12;
  }
  if (invoice.seller_vat_number) {
    lines.push(textLine(48, y, `VAT: ${invoice.seller_vat_number}`, 9));
    y -= 12;
  }
  lines.push(textLine(48, y, invoice.seller_email, 9));

  lines.push(textLine(310, 688, "Bill to", 12, "F2"));
  lines.push(textLine(310, 672, invoice.buyer_name || company?.company_name || "Customer", 10));
  y = 658;
  for (const line of wrapAddressLines(invoice.buyer_billing_address || "Billing address not provided", 42)) {
    lines.push(textLine(310, y, line, 9));
    y -= 12;
  }
  if (invoice.buyer_vat_number) {
    lines.push(textLine(310, y, `VAT: ${invoice.buyer_vat_number}`, 9));
    y -= 12;
  }
  lines.push(textLine(310, y, invoice.billing_email, 9));

  lines.push(textLine(48, 598, "Issue date", 10, "F2"));
  lines.push(textLine(130, 598, invoice.issue_date, 10));
  lines.push(textLine(230, 598, "Due date", 10, "F2"));
  lines.push(textLine(300, 598, invoice.due_date, 10));
  lines.push(textLine(390, 598, "Reference", 10, "F2"));
  lines.push(textLine(465, 598, invoice.payment_reference, 10));

  lines.push("0.95 0.93 0.89 rg 48 545 500 28 re f");
  lines.push("0 0 0 rg");
  lines.push(textLine(60, 555, "Description", 10, "F2"));
  lines.push(textLine(455, 555, "Amount", 10, "F2"));
  lines.push(textLine(60, 520, description, 10));
  lines.push(textLine(455, 520, formatMoney(invoice.subtotal_cents, invoice.currency), 10));
  if (invoice.unit_price_cents && !isCustomAmount) {
    lines.push(textLine(60, 502, `Unit price: ${formatMoney(invoice.unit_price_cents, invoice.currency)} per user/month`, 8));
  } else if (isCustomAmount) {
    lines.push(textLine(60, 502, "Custom Enterprise amount agreed with the customer.", 8));
  }

  const vatRate = `${(invoice.vat_rate_bps / 100).toFixed(2).replace(/\.00$/, "")}% VAT`;
  lines.push(moneyLine("Subtotal", formatMoney(invoice.subtotal_cents, invoice.currency), 470));
  lines.push(moneyLine(vatRate, formatMoney(invoice.vat_cents, invoice.currency), 452));
  lines.push("0.10 0.04 0.12 rg 350 418 198 32 re f");
  lines.push("1 1 1 rg");
  lines.push(textLine(365, 429, "Total", 12, "F2"));
  lines.push(textLine(470, 429, formatMoney(invoice.total_cents, invoice.currency), 12, "F2"));
  lines.push("0 0 0 rg");

  lines.push(textLine(48, 370, "Payment", 12, "F2"));
  lines.push(textLine(48, 352, `IBAN: ${invoice.payment_iban}`, 10));
  if (invoice.payment_bic) lines.push(textLine(48, 336, `BIC: ${invoice.payment_bic}`, 10));
  lines.push(textLine(48, 320, `Reference: ${invoice.payment_reference}`, 10));
  for (const line of wrapText(invoice.payment_terms, 86)) {
    lines.push(textLine(48, 292, line, 9));
  }

  if (invoice.notes) {
    lines.push(textLine(48, 248, "Notes", 12, "F2"));
    let noteY = 232;
    for (const line of wrapText(invoice.notes, 92).slice(0, 5)) {
      lines.push(textLine(48, noteY, line, 9));
      noteY -= 12;
    }
  }

  lines.push(textLine(48, 72, "Generated by GETH Connected Cards. Please keep this invoice for your administration.", 8));

  const content = lines.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
