"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Bell,
  ChevronLeft,
  LogOut,
  MoreHorizontal,
  PanelLeft,
  CircleUserRound,
  X
} from "lucide-react";
import { BrandMarkIcon } from "@/components/BrandLogo";
import { Avatar } from "@/components/ui/Avatar";
import { cx } from "@/components/ui/cx";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearDemoSession, getDemoSession, hasSupabaseBrowserConfig } from "@/lib/demo-session";
import { stripLocaleFromPathname, type AppLocale } from "@/i18n/routing";
import {
  dashboardEyebrowKeyByRole,
  dashboardNavByRole,
  getDashboardProfileHref,
  isDashboardNavActive,
  localizeDashboardHref,
  notificationHrefByRole,
  type DashboardNavItem,
  type DashboardRole
} from "@/lib/navigation/dashboard-nav";

function CalendarIcon({ size = 19 }: { size?: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg">
      <rect x="3.75" y="5.25" width="16.5" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 3.75V7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M17 3.75V7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M4.5 9H19.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M9 14L11 16L15.5 11.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function VerticalCardIcon({ size = 19 }: { size?: number }) {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 20 24" width={size} xmlns="http://www.w3.org/2000/svg">
      <rect x="4.25" y="2.75" width="11.5" height="18.5" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.25 7.25H12.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.55" />
      <path d="M7.25 11.25H12.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.55" />
      <path d="M8.5 16.5H11.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.55" />
    </svg>
  );
}

function GethBirdIcon({ size = 19 }: { size?: number }) {
  return <BrandMarkIcon alt="" aria-hidden="true" className="lp-nav-bird" size={size} />;
}

function renderNavIcon(icon: DashboardNavItem["icon"], profileUser?: { name: string; initials: string; imageUrl?: string | null }) {
  if (icon === "profile-avatar") {
    return <Avatar name={profileUser?.name} initials={profileUser?.initials} imageUrl={profileUser?.imageUrl} size="sm" className="lp-nav-avatar" />;
  }
  if (icon === "vertical-card") return <VerticalCardIcon size={19} />;
  if (icon === "calendar") return <CalendarIcon size={19} />;
  if (icon === "geth-bird" || icon === "brand-mark") return <GethBirdIcon size={19} />;
  const LucideIcon = icon;
  return <LucideIcon size={19} />;
}

const SIDEBAR_COLLAPSED_KEY = "geth-sidebar-collapsed";
const TAB_LIMIT = 5;

export function DashboardShell({
  role,
  title,
  subtitle,
  user,
  children,
  actions,
  unreadNotifications = 0
}: {
  role: DashboardRole;
  title: string;
  subtitle: string;
  user: { name: string; initials: string; team: string; imageUrl?: string | null };
  children: ReactNode;
  actions?: ReactNode;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("shell");
  const tNav = useTranslations("nav");
  const locale = useLocale() as AppLocale;
  const basePathname = stripLocaleFromPathname(pathname);
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setSidebarCollapsed(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  function persistSidebarCollapsed(next: boolean) {
    setSidebarCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }

  const nav = dashboardNavByRole[role];
  const notificationHref = localizeDashboardHref(notificationHrefByRole[role], locale);
  const profileHref = getDashboardProfileHref(role, locale);
  const tabItems = nav.length > TAB_LIMIT ? nav.slice(0, TAB_LIMIT - 1) : nav;
  const hasMore = nav.length > TAB_LIMIT;

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const demoSession = getDemoSession();
      if (demoSession) {
        clearDemoSession();
      }

      if (hasSupabaseBrowserConfig()) {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      }
    } finally {
      setMoreOpen(false);
      router.replace(`/${locale}`);
      router.refresh();
      setLoggingOut(false);
    }
  }

  function renderLink(item: DashboardNavItem, extra?: string) {
    const active = isDashboardNavActive(basePathname, item.href, role);
    const label = t(item.labelKey);
    return (
      <Link
        href={localizeDashboardHref(item.href, locale)}
        className={cx(active && "lp-active", extra)}
        key={item.href}
        title={label}
        aria-current={active ? "page" : undefined}
      >
        {renderNavIcon(item.icon, item.icon === "profile-avatar" ? user : undefined)}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <div className={cx("lp lp-app", sidebarCollapsed && "lp-collapsed")}>
      <aside className="lp-side">
        <div>
          <div className="lp-side-head">
            {sidebarCollapsed ? (
              <button className="lp-iconbtn" type="button" onClick={() => persistSidebarCollapsed(false)} aria-label={t("expandSidebar")}>
                <PanelLeft size={18} />
              </button>
            ) : (
              <>
                <Link href={`/${locale}`} className="lp-brand" aria-label="GETH®">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/landing/geth-crest.svg" alt="" />
                  <b>
                    GETH<sup>®</sup>
                  </b>
                </Link>
                <button className="lp-iconbtn" type="button" onClick={() => persistSidebarCollapsed(true)} aria-label={t("collapseSidebar")}>
                  <ChevronLeft size={18} />
                </button>
              </>
            )}
          </div>
          <nav className="lp-nav-list" aria-label={t("navigationLabel", { role })}>
            {nav.map((item) => renderLink(item))}
          </nav>
        </div>

        <div className="lp-side-foot">
          <div className="lp-side-lang">
            <LanguageToggle locale={locale} label={tNav("language")} />
          </div>
          <div className="lp-side-user">
            <Avatar name={user.name} initials={user.initials} imageUrl={user.imageUrl} />
            <div>
              <b>{user.name}</b>
              <small>{user.team}</small>
            </div>
            <button className="lp-iconbtn" type="button" onClick={handleLogout} disabled={loggingOut} aria-label={loggingOut ? t("loggingOut") : t("signOut")} title={t("signOut")}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="lp-app-main">
        <header className="lp-app-top">
          <Link href={`/${locale}`} className="lp-brand lp-app-mobile-brand" aria-label="GETH®">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/landing/geth-crest.svg" alt="" />
          </Link>
          <div className="lp-app-title">
            <span className="lp-eyebrow">{t(dashboardEyebrowKeyByRole[role])}</span>
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="lp-app-quick">{actions}</div> : null}
          <div className="lp-app-actions">
            <Link className="lp-iconbtn lp-bell" href={notificationHref} aria-label={t("unreadNotifications", { count: unreadNotifications })}>
              <Bell size={19} />
              {unreadNotifications > 0 ? <span className="lp-bell-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span> : null}
            </Link>
            <Link className="lp-app-avatar" href={profileHref} title={`${user.name} - ${user.team}`} aria-label={t("openProfile", { name: user.name })}>
              <Avatar name={user.name} initials={user.initials} imageUrl={user.imageUrl} />
            </Link>
          </div>
        </header>

        <main className={cx("lp-app-body", role !== "employee" && `dashboard-main dashboard-main-${role}`)}>{children}</main>
      </div>

      <nav className="lp-tabbar" aria-label={t("navigationLabel", { role })}>
        {tabItems.map((item) => renderLink(item))}
        {hasMore ? (
          <button type="button" className={cx(moreOpen && "lp-active")} onClick={() => setMoreOpen(true)} aria-haspopup="dialog">
            <MoreHorizontal size={20} />
            <span>{t("navMore")}</span>
          </button>
        ) : null}
      </nav>

      {moreOpen ? (
        <div className="lp-sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="lp-sheet" role="dialog" aria-modal="true" aria-label={t("navigationLabel", { role })} onClick={(event) => event.stopPropagation()}>
            <button className="lp-iconbtn lp-sheet-close" type="button" onClick={() => setMoreOpen(false)} aria-label={t("closeNavigation")}>
              <X size={18} />
            </button>
            <div className="lp-nav-list">{nav.map((item) => renderLink(item))}</div>
            <div className="lp-sheet-foot">
              <LanguageToggle locale={locale} label={tNav("language")} />
              <button className="lp-btn lp-btn-ghost lp-btn-sm" type="button" onClick={handleLogout} disabled={loggingOut}>
                <LogOut size={16} /> {loggingOut ? t("signingOut") : t("signOut")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
