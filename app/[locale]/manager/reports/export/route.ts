import { NextRequest } from "next/server";
import { fetchRecognitionReportRows, getRecognitionReportRange, recognitionRowsToCsv } from "@/lib/reports/recognition-report";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle<{ company_id: string | null; role: string }>();

  if (profileError || !profile) {
    return new Response("Profile not found", { status: 403 });
  }

  if (profile.role !== "manager") {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id")
    .eq("manager_id", user.id);

  if (teamsError) {
    return new Response("Unable to load managed teams", { status: 500 });
  }

  const teamIds = (teams ?? []).map((team) => team.id);
  const range = getRecognitionReportRange({
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined
  });
  const rows = await fetchRecognitionReportRows(supabase, { kind: "teams", companyId: profile.company_id, teamIds }, range);
  const csv = `\uFEFF${recognitionRowsToCsv(rows)}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="geth-manager-team-recognition-report-${range.from}-to-${range.to}.csv"`
    }
  });
}
