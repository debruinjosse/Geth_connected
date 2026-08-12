"use server";

import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeReturnTo(value: FormDataEntryValue | null) {
  const fallback = "/manager/team";
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function withStatus(returnTo: string, status: "sent" | "error" | "not_allowed") {
  const separator = returnTo.includes("?") ? "&" : "?";
  return `${returnTo}${separator}note=${status}`;
}

export async function sendManagerNoteAction(formData: FormData) {
  const returnTo = safeReturnTo(formData.get("return_to"));
  const recipientId = String(formData.get("recipient_id") ?? "");
  const body = String(formData.get("note_body") ?? "").trim();

  if (!recipientId || body.length < 3) {
    redirect(withStatus(returnTo, "error"));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(withStatus(returnTo, "not_allowed"));
  }

  const { data: managerProfile, error: managerError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, company_id, role")
    .eq("id", user.id)
    .maybeSingle<{ id: string; first_name: string | null; last_name: string | null; company_id: string | null; role: string }>();

  if (managerError || !managerProfile || managerProfile.role !== "manager") {
    redirect(withStatus(returnTo, "not_allowed"));
  }

  const { data: managedTeams, error: teamsError } = await supabase.from("teams").select("id").eq("manager_id", user.id);

  if (teamsError || !managedTeams?.length) {
    redirect(withStatus(returnTo, "not_allowed"));
  }

  const managedTeamIds = new Set(managedTeams.map((team) => team.id));
  const { data: recipient, error: recipientError } = await supabase
    .from("profiles")
    .select("id, company_id, team_id, role")
    .eq("id", recipientId)
    .maybeSingle<{ id: string; company_id: string | null; team_id: string | null; role: string }>();

  if (
    recipientError ||
    !recipient ||
    recipient.role !== "employee" ||
    !recipient.team_id ||
    !managedTeamIds.has(recipient.team_id) ||
    recipient.company_id !== managerProfile.company_id
  ) {
    redirect(withStatus(returnTo, "not_allowed"));
  }

  const managerName = `${managerProfile.first_name ?? ""} ${managerProfile.last_name ?? ""}`.trim() || "Your manager";

  const { error: noteError } = await supabase.from("manager_notes").insert({
    company_id: managerProfile.company_id,
    manager_user_id: user.id,
    recipient_user_id: recipient.id,
    body: body.slice(0, 500)
  });

  if (noteError) {
    console.warn("manager note insert failed:", noteError.message);
    redirect(withStatus(returnTo, "error"));
  }

  await createNotification(supabase, {
    userId: recipient.id,
    companyId: recipient.company_id,
    type: "manager_note",
    title: `Note from ${managerName}`,
    body: body.slice(0, 500),
    href: "/employee/messages"
  });

  redirect(withStatus(returnTo, "sent"));
}
