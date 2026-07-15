import Link from "next/link";
import { HelpCircle } from "lucide-react";
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

export default async function ClaimCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = await getPublicCardBySlug(slug);
  let giverOptions: ClaimGiverOption[] = people.map((person) => ({
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
    dashboardHref: "/employee"
  };

  if (hasSupabaseServerConfig()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, company_id, first_name, last_name, email, profile_image, team_id, team:teams!profiles_team_id_fkey(name)")
        .eq("id", user.id)
        .maybeSingle<{
          id: string;
          company_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          profile_image: string | null;
          team_id: string | null;
          team: { name: string } | Array<{ name: string }> | null;
        }>();

      if (profile?.company_id) {
        const { data: companyProfiles } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, profile_image, team_id, team:teams!profiles_team_id_fkey(name)")
          .eq("company_id", profile.company_id)
          .neq("id", profile.id)
          .order("first_name");

        giverOptions = (companyProfiles ?? []).map((person) => {
          const team = Array.isArray(person.team) ? person.team[0] : person.team;
          return {
            id: person.id,
            name: `${person.first_name} ${person.last_name}`.trim(),
            initials: getInitials(person.first_name, person.last_name),
            team: team?.name ?? "Unassigned team",
            email: person.email,
            imageUrl: person.profile_image
          };
        });

        const receiverTeam = Array.isArray(profile.team) ? profile.team[0] : profile.team;
        receiverUser = {
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          initials: getInitials(profile.first_name, profile.last_name),
          team: receiverTeam?.name ?? "Your company",
          dashboardHref: "/employee"
        };
      } else {
        giverOptions = [];
      }
    } else {
      giverOptions = [];
    }
  }

  return (
    <main className="claim-page">
      <header className="claim-header">
        <BrandLogo href="/" />
        <div className="claim-header-right">
          <a className="claim-help" href="mailto:hello@geth.com?subject=GETH%20claim%20card%20help">
            <HelpCircle size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
            Help
          </a>
          <Link className="claim-help" href={receiverUser.dashboardHref}>
            Hi, {receiverUser.name.split(" ")[0] || "there"}
          </Link>
        </div>
      </header>
      <ClaimCardClient card={card ?? null} requestedSlug={slug} giverOptions={giverOptions} receiverName={receiverUser.name} />
    </main>
  );
}
