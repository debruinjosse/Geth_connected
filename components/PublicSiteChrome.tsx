import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { GoldenLeaves } from "@/components/GoldenLeaves";
import { getRouteForAppRole, normalizeAppRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#for-companies", label: "For companies" },
  { href: "/cards", label: "Cards" },
  { href: "/pricing", label: "Pricing" },
  { href: "/resources", label: "Resources" }
];

async function getPublicUserState() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, role")
      .eq("id", user.id)
      .maybeSingle<{ first_name: string; last_name: string; role: string }>();

    const role = normalizeAppRole(profile?.role);
    const fallbackName = user.email?.split("@")[0]?.replace(/[._-]+/g, " ") ?? "there";
    const name = profile?.first_name?.trim() || fallbackName;

    return {
      name,
      dashboardHref: getRouteForAppRole(role)
    };
  } catch {
    return null;
  }
}

export async function PublicSiteChrome({
  children,
  ctaLabel = "Book a demo",
  ctaHref = "/book-demo"
}: {
  children: ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const signedInUser = await getPublicUserState();

  return (
    <main>
      <header className="site-header">
        <BrandLogo href="/" />
        <nav className="site-nav" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="site-actions">
          {signedInUser ? (
            <>
              <Link className="site-user-link" href={signedInUser.dashboardHref}>Hi, {signedInUser.name}</Link>
              <Link className="btn btn-primary" href={signedInUser.dashboardHref}>
                Open dashboard
              </Link>
              <Link href="/auth/signout">Sign out</Link>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link className="btn btn-primary" href={ctaHref}>
                {ctaLabel}
              </Link>
            </>
          )}
        </div>
      </header>

      {children}

      <section className="footer-banner">
        <GoldenLeaves className="golden-leaves" style={{ left: "16px", bottom: "20px" }} />
        <GoldenLeaves className="golden-leaves mirrored" style={{ right: "16px", top: "20px" }} />
        <div className="eyebrow">Recognition that grows culture.</div>
        <h2>Bridging physical recognition with digital culture intelligence.</h2>
        <p style={{ maxWidth: 720, color: "rgba(255,255,255,0.8)" }}>
          GETH helps companies turn meaningful appreciation into visible insight across employees, managers, and entire organizations.
        </p>
        <footer className="site-footer">
          <div>
            <BrandLogo href="/" />
            <small style={{ display: "block", marginTop: 18 }}>hello@geth.com</small>
          </div>
          <div className="footer-links">
            <Link href="/">Product</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/book-demo">Book a demo</Link>
            <Link href="/resources">Resources</Link>
          </div>
          <div className="footer-meta">
            <Link href="/resources">Privacy</Link>
            <Link href="/resources">Terms</Link>
            <Link href="/resources">Security</Link>
            <small>&copy; 2025 GETH Connected Cards.</small>
          </div>
        </footer>
      </section>
    </main>
  );
}
