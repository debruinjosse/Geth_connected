import { NextRequest } from "next/server";
import { createInvoicePdf, type InvoiceDocument } from "@/lib/billing/eu-invoice";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ invoiceId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { invoiceId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .maybeSingle<{ role: string; company_id: string | null }>();

  if (profileError || !profile) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("billing_invoices")
    .select(`
      invoice_number,
      company_id,
      issue_date,
      due_date,
      currency,
      subtotal_cents,
      vat_rate_bps,
      vat_cents,
      total_cents,
      billing_email,
      buyer_name,
      buyer_vat_number,
      buyer_billing_address,
      seller_legal_name,
      seller_vat_number,
      seller_billing_address,
      seller_email,
      payment_iban,
      payment_bic,
      payment_reference,
      payment_terms,
      notes,
      company:companies(company_name),
      plan:plans(name, plan_key)
    `)
    .eq("id", invoiceId)
    .maybeSingle<InvoiceDocument & { company_id?: string }>();

  if (invoiceError || !invoice) {
    return new Response("Invoice not found", { status: 404 });
  }

  const isGlobalAdmin = ["platform_admin", "super_admin"].includes(profile.role);
  const isOwnCompany = profile.role === "company_admin" && profile.company_id === invoice.company_id;

  if (!isGlobalAdmin && !isOwnCompany) {
    return new Response("Forbidden", { status: 403 });
  }

  const pdf = createInvoicePdf(invoice);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
