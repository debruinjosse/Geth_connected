import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { updateCardActiveAction, updateCardContentAction } from "@/app/actions/adminControls";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { getCategoryDisplayName } from "@/lib/cards";
import { superAdminUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminCardRow = {
  id: string;
  card_number: number;
  title: string;
  category: string;
  description: string;
  recognition_sentence: string;
  qr_slug: string;
  active: boolean;
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GA";
}

export default async function AdminCardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminPages" });
  const tc = await getTranslations({ locale, namespace: "common" });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <DashboardShell role="admin" title={t("cardsLibraryTitle")} subtitle={t("cardsLibraryNoSupabaseSubtitle")} user={superAdminUser}>
        <EmptyState title={t("cardsLibraryNoSupabaseTitle")} copy={t("cardsLibraryNoSupabaseCopy")} />
      </DashboardShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) redirect(`/${locale}/login`);

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
      .select("id, card_number, title, category, description, recognition_sentence, qr_slug, active")
      .order("card_number", { ascending: true }),
    supabase.from("recognition_events").select("card_id")
  ]);

  if (error || recognitionsError) {
    throw new Error(t("errLoadCards"));
  }

  const activeCount = cards?.filter((card) => card.active).length ?? 0;
  const usageCounts = new Map<string, number>();
  for (const recognition of recognitions ?? []) {
    usageCounts.set(recognition.card_id, (usageCounts.get(recognition.card_id) ?? 0) + 1);
  }

  return (
    <DashboardShell
      role="admin"
      title={t("cardsLibraryTitle")}
      subtitle={t("cardsLibrarySubtitleLive")}
      user={{
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        initials: getInitials(profile.first_name, profile.last_name),
        team: tc("platformTeam")
      }}
      actions={<span className="quality-pill">{t("activeCardsPill", { count: activeCount })}</span>}
    >
      <article className="panel dashboard-panel">
        <div className="panel-top">
          <div>
            <h2>{t("sharedCardDeckTitle")}</h2>
            <p>{t("sharedCardDeckCopy")}</p>
          </div>
        </div>
        <div className="table-wrap admin-table-scroll admin-card-library-scroll">
          {cards?.length ? (
            <table className="dashboard-table">
              <thead><tr><th>{t("tableCard")}</th><th>{t("tableCategory")}</th><th>{t("tableNumber")}</th><th>{t("tableStatus")}</th><th>{t("tableUsage")}</th><th>{t("tableRoute")}</th><th>{t("tableControl")}</th></tr></thead>
              <tbody>
                {(cards as AdminCardRow[]).map((card) => (
                  <tr key={card.id}>
                    <td>
                      <strong>{card.title}</strong>
                      <p className="admin-card-caption">{card.recognition_sentence}</p>
                    </td>
                    <td>{getCategoryDisplayName(card.category)}</td>
                    <td>{card.card_number}</td>
                    <td><span className="admin-status-pill">{card.active ? t("cardStatusActive") : t("cardStatusPaused")}</span></td>
                    <td>{usageCounts.get(card.id) ?? 0}</td>
                    <td>/claim-card/{card.qr_slug}</td>
                    <td>
                      <div className="admin-card-controls">
                        <form action={updateCardActiveAction}>
                          <input type="hidden" name="cardId" value={card.id} />
                          <input type="hidden" name="active" value={card.active ? "false" : "true"} />
                          <button className="btn btn-secondary compact" type="submit">
                            {card.active ? t("pauseButton") : t("activateButton")}
                          </button>
                        </form>
                        <details className="admin-card-edit">
                          <summary>{t("editButton")}</summary>
                          <form action={updateCardContentAction} className="admin-card-edit-form">
                            <input type="hidden" name="cardId" value={card.id} />
                            <label>
                              {t("formNameLabel")}
                              <input className="input" name="title" defaultValue={card.title} required />
                            </label>
                            <label>
                              {t("tableCategory")}
                              <select className="input" name="category" defaultValue={card.category} required>
                                <option value="Communication">Communication</option>
                                <option value="Creativity">Creativity</option>
                                <option value="Competence">Competence</option>
                                <option value="Collegiality">Collegiality</option>
                                <option value="Open Category">Open Category</option>
                              </select>
                            </label>
                            <label>
                              {t("formCaptionLabel")}
                              <textarea className="input" name="description" rows={3} defaultValue={card.description} required />
                            </label>
                            <label>
                              {t("formRecognitionSentenceLabel")}
                              <textarea className="input" name="recognitionSentence" rows={3} defaultValue={card.recognition_sentence} required />
                            </label>
                            <p>{t("qrSlugLocked", { slug: card.qr_slug })}</p>
                            <button className="btn btn-primary compact" type="submit">{t("saveCardTextButton")}</button>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title={t("emptyNoCardsSeededTitle")} copy={t("emptyNoCardsSeededCopy")} />
          )}
        </div>
      </article>
    </DashboardShell>
  );
}
