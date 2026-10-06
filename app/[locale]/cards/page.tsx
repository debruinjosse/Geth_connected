import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CardsLibraryClient } from "@/components/CardsLibraryClient";
import { DashboardShell } from "@/components/DashboardShell";
import { PublicSiteChrome } from "@/components/PublicSiteChrome";
import { Link } from "@/i18n/navigation";
import { Lock } from "lucide-react";
import { CardRail } from "@/components/landing/CardRail";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { PageHero } from "@/components/ui/PageHero";
import { buildRailCards, railFilters } from "@/lib/landing-cards";
import { localizePublicHref } from "@/lib/navigation/public-nav";
import { getPublicCardLibrary } from "@/lib/card-library";
import { normalizeAppRole, type AppRole } from "@/lib/auth/roles";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CardsPageProps = {
  params: Promise<{ locale: string }>;
};

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

type DashboardRole = "employee" | "manager" | "company" | "admin";

type AuthenticatedCardsContext = {
  dashboardRole: DashboardRole;
  user: {
    name: string;
    initials: string;
    team: string;
    imageUrl?: string | null;
  };
  unreadNotifications: number;
};

function getInitials(firstName: string | null, lastName: string | null, fallback: string) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  return initials || fallback.slice(0, 2).toUpperCase() || "GU";
}

function getDashboardRole(role: AppRole): DashboardRole {
  if (role === "company_admin") return "company";
  if (role === "platform_admin" || role === "super_admin") return "admin";
  return role;
}

function getDashboardAction(
  role: DashboardRole,
  labels: {
    scanCard: string;
    manageDecks: string;
    manageCards: string;
  }
) {
  if (role === "employee") {
    return (
      <Link className="btn btn-secondary compact" href="/employee/scan">
        {labels.scanCard}
      </Link>
    );
  }

  if (role === "company") {
    return (
      <Link className="btn btn-secondary compact" href="/company/cards">
        {labels.manageDecks}
      </Link>
    );
  }

  if (role === "admin") {
    return (
      <Link className="btn btn-secondary compact" href="/admin/cards">
        {labels.manageCards}
      </Link>
    );
  }

  return null;
}

async function getAuthenticatedCardsContext(locale: string): Promise<AuthenticatedCardsContext | null> {
  if (!hasSupabaseServerConfig()) {
    return null;
  }

  try {
    const tCommon = await getTranslations({ locale, namespace: "common" });
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role, team_id, profile_image")
      .eq("id", user.id)
      .maybeSingle<{
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        role: string | null;
        team_id: string | null;
        profile_image: string | null;
      }>();

    if (profileError) {
      return null;
    }

    if (!profile) {
      return null;
    }

    const [{ data: team }, unreadNotifications] = await Promise.all([
      profile.team_id ? supabase.from("teams").select("name").eq("id", profile.team_id).maybeSingle<{ name: string }>() : Promise.resolve({ data: null }),
      getUnreadNotificationCount(supabase, user.id)
    ]);

    const role = normalizeAppRole(profile.role);
    const fallbackName =
      profile.email?.split("@")[0]?.replace(/[._-]+/g, " ") ||
      user.email?.split("@")[0]?.replace(/[._-]+/g, " ") ||
      tCommon("gethUser");
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || fallbackName;

    return {
      dashboardRole: getDashboardRole(role),
      unreadNotifications,
      user: {
        name,
        initials: getInitials(profile.first_name, profile.last_name, fallbackName),
        team:
          team?.name ??
          (role === "company_admin"
            ? tCommon("companyAdminRole")
            : role === "platform_admin" || role === "super_admin"
              ? tCommon("platformAdminRole")
              : tCommon("workspaceFallback")),
        imageUrl: profile.profile_image
      }
    };
  } catch {
    return null;
  }
}

export default async function CardsPage({ params }: CardsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "cardsPage" });
  const authenticatedContext = await getAuthenticatedCardsContext(locale);
  const showFullDeck = Boolean(authenticatedContext);
  const cards = showFullDeck ? await getPublicCardLibrary() : [];
  const actionLabels = {
    scanCard: t("actionScanCard"),
    manageDecks: t("actionManageDecks"),
    manageCards: t("actionManageCards")
  };

  if (authenticatedContext) {
    return (
      <DashboardShell
        role={authenticatedContext.dashboardRole}
        title={t("title")}
        subtitle={t("copy")}
        user={authenticatedContext.user}
        unreadNotifications={authenticatedContext.unreadNotifications}
        actions={getDashboardAction(authenticatedContext.dashboardRole, actionLabels)}
      >
        <section className="cards-page dashboard-card-library">
          <Suspense fallback={<p className="section-copy">{t("loading")}</p>}>
            <CardsLibraryClient cards={cards} />
          </Suspense>
        </section>
      </DashboardShell>
    );
  }

  const lp = await getTranslations({ locale, namespace: "landingV2" });
  const lang = locale === "nl" ? "nl" : "en";
  const railCards = buildRailCards(lang, { com: lp("fCom"), cre: lp("fCre"), cmp: lp("fCmp"), col: lp("fCol") });
  const railFilterList = railFilters({ all: lp("fAll"), com: lp("fCom"), cre: lp("fCre"), cmp: lp("fCmp"), col: lp("fCol") });

  return (
    <PublicSiteChrome ctaHref="/book-demo" ctaLabel={t("lockedDemo")} locale={locale}>
      <PageHero eyebrow={t("lockedEyebrow")} title={t("lockedTitle")} lead={t("lockedCopy")} />
      <section className="lp-section-sm lp-bg-tint" style={{ paddingTop: 72 }}>
        <Container>
          <CardRail
            header={
              <div className="lp-sec-head">
                <Eyebrow>{lp("cEye")}</Eyebrow>
                <h2>{lp("cT")}</h2>
                <p>{lp("cP")}</p>
              </div>
            }
            cards={railCards}
            filters={railFilterList}
            ariaLabel={lp("cardsAria")}
            filterLabel={lp("category")}
            hint={lp("cHint")}
            prevLabel={lp("prev")}
            nextLabel={lp("next")}
            closeLabel={lp("close")}
          />
        </Container>
      </section>
      <section className="lp-section-sm" style={{ paddingBottom: 120 }}>
        <Container>
          <Card tone="tint" size="lg" className="lp-rv">
            <div className="lp-gate">
              <div>
                <span className="lp-icontile" aria-hidden="true">
                  <Lock />
                </span>
                <h2>{t("lockedPanelTitle")}</h2>
                <p style={{ color: "var(--ink-2)", marginTop: 12, maxWidth: "56ch" }}>{t("lockedPanelCopy")}</p>
              </div>
              <div className="lp-cta-row">
                <Button href={localizePublicHref("/book-demo", locale)} arrow>
                  {t("lockedDemo")}
                </Button>
                <Button href={localizePublicHref("/signup?role=company_admin", locale)} variant="ghost">
                  {t("lockedRegister")}
                </Button>
              </div>
            </div>
          </Card>
        </Container>
      </section>
    </PublicSiteChrome>
  );
}
