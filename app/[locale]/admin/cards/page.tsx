import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { updateCardActiveAction } from "@/app/actions/adminControls";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import {
  getLocalizedCardTitle,
  getLocalizedCategoryDisplayName,
  getLocalizedRecognitionSentence
} from "@/lib/cards";
import { superAdminUser } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { PagedTable } from "@/components/ui/PagedTable";
import { AdminCardEditor } from "@/components/AdminCardEditor";
import { Pill } from "@/components/ui/Pill";

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
      actions={<Pill>{t("activeCardsPill", { count: activeCount })}</Pill>}
    >
      <Panel title={t("sharedCardDeckTitle")} description={t("sharedCardDeckCopy")}>
        <>
          {cards?.length ? (
            <PagedTable
              className="lp-table-flat lp-table-stack"
              pageSize={10}
              pageLabel={tc("page")}
              previousLabel={tc("previous")}
              nextLabel={tc("next")}
              head={<tr><th>{t("tableCard")}</th><th>{t("tableCategory")}</th><th className="lp-ncol">{t("tableNumber")}</th><th>{t("tableStatus")}</th><th className="lp-ncol">{t("tableUsage")}</th><th className="lp-act">{t("tableControl")}</th></tr>}
              rows={(cards as AdminCardRow[]).map((card) => (
                <tr key={card.id}>
                  <td>
                    <strong>{getLocalizedCardTitle({ title: card.title, slug: card.qr_slug }, locale)}</strong>
                    <small className="lp-cell-sub lp-clamp">
                      {getLocalizedRecognitionSentence({ recognitionSentence: card.recognition_sentence, slug: card.qr_slug }, locale)}
                    </small>
                  </td>
                  <td data-label={t("tableCategory")}>{getLocalizedCategoryDisplayName(card.category, locale)}</td>
                  <td className="lp-ncol" data-label={t("tableNumber")}>{card.card_number}</td>
                  <td data-label={t("tableStatus")}><Pill tone={card.active ? "green" : "neutral"}>{card.active ? t("cardStatusActive") : t("cardStatusPaused")}</Pill></td>
                  <td className="lp-ncol" data-label={t("tableUsage")}>{usageCounts.get(card.id) ?? 0}</td>
                  <td className="lp-act" data-label={t("tableControl")} data-wide>
                    <div className="lp-row-actions">
                      <form action={updateCardActiveAction}>
                        <input type="hidden" name="cardId" value={card.id} />
                        <input type="hidden" name="active" value={card.active ? "false" : "true"} />
                        <Button variant="ghost" size="sm" type="submit">
                          {card.active ? t("pauseButton") : t("activateButton")}
                        </Button>
                      </form>
                      <AdminCardEditor
                        card={card}
                        categories={["Communication", "Creativity", "Competence", "Collegiality", "Open Category"].map((value) => ({ value, label: getLocalizedCategoryDisplayName(value, locale) }))}
                        labels={{
                          edit: t("editButton"),
                          name: t("formNameLabel"),
                          category: t("tableCategory"),
                          caption: t("formCaptionLabel"),
                          sentence: t("formRecognitionSentenceLabel"),
                          slugLocked: t("qrSlugLocked", { slug: card.qr_slug }),
                          save: t("saveCardTextButton")
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            />
          ) : (
            <EmptyState title={t("emptyNoCardsSeededTitle")} copy={t("emptyNoCardsSeededCopy")} />
          )}
        </>
      </Panel>
    </DashboardShell>
  );
}
