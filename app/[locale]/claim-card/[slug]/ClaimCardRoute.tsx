import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BrandLogo } from "@/components/BrandLogo";
import { ClaimCardClient } from "./ClaimCardClient";
import { getPublicCardBySlug } from "@/lib/card-library";
import { people } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ClaimGiverOption = {
  id: string;
  name: string;
  initials: string;
  team: string;
  email?: string;
  imageUrl?: string | null;
};

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
  let giverOptions: ClaimGiverOption[] = supabaseConfigured
    ? []
    : people.map((person) => ({
        id: person.id,
        name: person.name,
        initials: person.initials,
        team: person.team,
        email: person.email
      }));
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

      if (profile?.company_id) {
        const { data: companyProfiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, profile_image, team_id, role, team:teams!profiles_team_id_fkey(name)")
          .eq("company_id", profile.company_id)
          .eq("status", "active")
          .neq("id", profile.id)
          .in("role", ["employee", "manager", "company_admin"])
          .order("first_name");

        giverOptions = (companyProfiles ?? []).map((person) => {
          const team = Array.isArray(person.team) ? person.team[0] : person.team;
          return {
            id: person.id,
            name: `${person.first_name} ${person.last_name}`.trim(),
            initials: getInitials(person.first_name, person.last_name),
            team: team?.name ?? t("unassignedTeam"),
            email: person.email,
            imageUrl: person.profile_image
          };
        });

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
      } else {
        giverOptions = [];
      }
    } else {
      giverOptions = [];
    }
  }

  return (
    <main className="claim-page claim-one-page">
      <header className="claim-header">
        <BrandLogo href={`/${locale}`} />
        <div className="claim-header-right">
          <a className="claim-help" href="mailto:info@geth.pro?subject=GETH%20claim%20card%20help">
            <HelpCircle size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            {t("help")}
          </a>
          <Link className="claim-help" href={receiverUser.dashboardHref}>
            {tNav("hi", { name: receiverUser.name.split(" ")[0] || "there" })}
          </Link>
        </div>
      </header>
      <ClaimCardClient
        card={card ?? null}
        requestedSlug={slug}
        giverOptions={giverOptions}
        receiverName={receiverUser.name}
        locale={locale}
        initialFlowMode={initialFlowMode}
      />
    </main>
  );
}
