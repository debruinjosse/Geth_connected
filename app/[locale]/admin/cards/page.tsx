import { redirect } from "next/navigation";
import { updateCardActiveAction } from "@/app/actions/adminControls";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { getCanonicalCardBySlugOrNumber, getCategoryDisplayName } from "@/lib/cards";
import { superAdminUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminCardRow = {
  id: string;
  card_number: number;
  title: string;
  category: string;
  recognition_sentence: string;
  qr_slug: string;
  active: boolean;
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GA";
}

export default async function AdminCardsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <DashboardShell role="admin" title="Platform card library" subtitle="Connect Supabase to manage the live shared deck." user={superAdminUser}>
        <EmptyState title="Supabase not configured" copy="The platform card controls will appear here once Supabase env vars are configured." />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string; last_name: string; role: string }>();

  if (profileError || !profile || !["platform_admin", "super_admin"].includes(profile.role)) {
    redirect("/auth/repair-profile");
  }

  const [{ data: cards, error }, { data: recognitions, error: recognitionsError }] = await Promise.all([
    supabase
      .from("card_library")
      .select("id, card_number, title, category, recognition_sentence, qr_slug, active")
      .order("card_number", { ascending: true }),
    supabase.from("recognition_events").select("card_id")
  ]);

  if (error || recognitionsError) {
    throw new Error("Failed to load platform card library.");
  }

  const activeCount = cards?.filter((card) => card.active).length ?? 0;
  const usageCounts = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    usageCounts.set(recognition.card_id, (usageCounts.get(recognition.card_id) ?? 0) + 1);
  }

  return (
    <DashboardShell
      role="admin"
      title="Platform card library"
      subtitle="Control which recognition cards are available across public library and QR claim routes."
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: "GETH Platform"
      }}
      actions={<span className="quality-pill">{activeCount} active cards</span>}
    >
      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>Shared card deck</h2>
            <p>Pause a card to hide it from the public card library and claim route lookup.</p>
          </div>
        </div>
        <div className="table-wrap">
          {cards?.length ? (
            <table className="dashboard-table">
              <thead><tr><th>Card</th><th>Category</th><th>Number</th><th>Status</th><th>Usage</th><th>Route</th><th>Control</th></tr></thead>
              <tbody>
                {(cards as AdminCardRow[]).map((card) => {
                  const canonicalCard = getCanonicalCardBySlugOrNumber(card.card_number, card.qr_slug);

                  return (
                    <tr key={card.id}>
                      <td><strong>{canonicalCard?.title ?? card.title}</strong><p style={{ margin: "4px 0 0", color: "var(--theme-muted)" }}>{canonicalCard?.recognitionSentence ?? card.recognition_sentence}</p></td>
                      <td>{getCategoryDisplayName(canonicalCard?.category ?? card.category)}</td>
                      <td>{card.card_number}</td>
                      <td><span className="admin-status-pill">{card.active ? "active" : "paused"}</span></td>
                      <td>{usageCounts.get(card.id) ?? 0}</td>
                      <td>/claim-card/{canonicalCard?.slug ?? card.qr_slug}</td>
                      <td>
                        <form action={updateCardActiveAction}>
                          <input type="hidden" name="cardId" value={card.id} />
                          <input type="hidden" name="active" value={card.active ? "false" : "true"} />
                          <button className="btn btn-secondary compact" type="submit">
                            {card.active ? "Pause" : "Activate"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No cards seeded yet" copy="Seed card_library to control the platform deck from here." />
          )}
        </div>
      </article>
    </DashboardShell>
  );
}
