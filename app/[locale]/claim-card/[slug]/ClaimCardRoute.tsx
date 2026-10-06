import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import type { AppLocale } from "@/i18n/routing";
import { ClaimCardClient } from "./ClaimCardClient";
import { getPublicCardBySlug } from "@/lib/card-library";
import { loadCompanyColleagues, type ColleagueOption } from "@/lib/colleagues";
import { people } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function hasSupabaseServerConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "GC";
}

export async function ClaimCardRoute({
  locale,
  slug,
  initialFlowMode = "claim"
}: {
  locale: string;
  slug: string;
  initialFlowMode?: "give" | "claim";
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const card = await getPublicCardBySlug(slug);
  const supabaseConfigured = hasSupabaseServerConfig();
  let giverOptions: ColleagueOption[] = supabaseConfigured
    ? []
    : people.map((person) => ({
        id: person.id,
        name: person.name,
        initials: person.initials,
        team: person.team,
        email: person.email
      }));
  let companyName: string | null = null;
  let receiverUser = {
    name: "there",
    initials: "GU",
    team: "",
    dashboardHref: `/${locale}/employee`
  };

  if (supabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, company_id, first_name, last_name, email, profile_image, team_id, role, team:teams!profiles_team_id_fkey(name)")
        .eq("id", user.id)
        .maybeSingle<{
          id: string;
          company_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          profile_image: string | null;
          team_id: string | null;
          role: string | null;
          team: { name: string } | Array<{ name: string }> | null;
        }>();

      if (profile) {
        const colleagueResult = await loadCompanyColleagues(supabase, user.id, {
          unassignedTeam: t("unassignedTeam")
        });
        giverOptions = colleagueResult.colleagues;
        companyName = colleagueResult.companyName;

        const receiverTeam = Array.isArray(profile.team) ? profile.team[0] : profile.team;
        const role = profile.role ?? "employee";
        const dashboardRole =
          role === "company_admin" ? "company" : role === "manager" ? "manager" : role === "platform_admin" || role === "super_admin" ? "admin" : "employee";

        receiverUser = {
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          initials: getInitials(profile.first_name, profile.last_name),
          team: receiverTeam?.name ?? t("yourCompany"),
          dashboardHref: `/${locale}/${dashboardRole}`
        };
      }
    }
  }

  return (
    <main className="lp lp-claim">
      <header className="lp-claim-bar">
        <Link href={`/${locale}`} className="lp-brand" aria-label="GETH®">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/geth-crest.svg" alt="" />
          <b>
            GETH<sup>®</sup>
          </b>
        </Link>
        <div className="lp-claim-bar-right">
          <a href="mailto:info@geth.pro?subject=GETH%20claim%20card%20help">
            <HelpCircle aria-hidden="true" />
            {t("help")}
          </a>
          <Link href={receiverUser.dashboardHref}>{tNav("hi", { name: receiverUser.name.split(" ")[0] || "there" })}</Link>
          <LanguageToggle locale={locale as AppLocale} label={tNav("language")} />
        </div>
      </header>
      <ClaimCardClient
        card={card ?? null}
        requestedSlug={slug}
        giverOptions={giverOptions}
        companyName={companyName}
        receiverName={receiverUser.name}
        locale={locale}
        initialFlowMode={initialFlowMode}
      />
    </main>
  );
}
