"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Bell,
  ChevronLeft,
  LogOut,
  Menu,
  PanelLeft,
  CircleUserRound,
  X
} from "lucide-react";
import { BrandLogo, BrandMarkIcon } from "@/components/BrandLogo";
import { GoogleTranslateWidget } from "@/components/GoogleTranslateWidget";
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
  return <BrandMarkIcon alt="" aria-hidden="true" className="side-link-brand-icon" size={size} />;
}

function renderNavIcon(icon: DashboardNavItem["icon"]) {
  if (icon === "vertical-card") return <VerticalCardIcon size={19} />;
  if (icon === "calendar") return <CalendarIcon size={19} />;
  if (icon === "geth-bird" || icon === "brand-mark") return <GethBirdIcon size={19} />;
  const LucideIcon = icon;
  return <LucideIcon size={19} />;
}

const SIDEBAR_COLLAPSED_KEY = "geth-sidebar-collapsed";

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
  const [mobileOpen, setMobileOpen] = useState(false);
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
      setMobileOpen(false);
      router.replace(`/${locale}`);
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`.trim()}>
      <div className={`dashboard-overlay ${mobileOpen ? "open" : ""}`.trim()} onClick={() => setMobileOpen(false)} />

      <aside className={`dashboard-sidebar ${mobileOpen ? "open" : ""}`.trim()}>
        <div className="dashboard-sidebar-top">
          <div className="dashboard-sidebar-head">
            {sidebarCollapsed ? (
              <button
                className="dashboard-sidebar-expand"
                type="button"
                onClick={() => persistSidebarCollapsed(false)}
                aria-label={t("expandSidebar")}
              >
                <PanelLeft size={18} />
              </button>
            ) : (
              <>
                <div className="dashboard-sidebar-brand-wrap">
                  <BrandLogo href={`/${locale}`} />
                </div>
                <button
                  className="dashboard-sidebar-collapse"
                  type="button"
                  onClick={() => persistSidebarCollapsed(true)}
                  aria-label={t("collapseSidebar")}
                >
                  <ChevronLeft size={18} />
                </button>
                <button className="mobile-nav-close" type="button" onClick={() => setMobileOpen(false)} aria-label={t("closeNavigation")}>
                  <X size={18} />
                </button>
              </>
            )}
          </div>
          <nav className="side-links" aria-label={t("navigationLabel", { role })}>
            {nav.map((item) => {
              const active = isDashboardNavActive(basePathname, item.href, role);
              const label = t(item.labelKey);
              return (
                <Link
                  href={localizeDashboardHref(item.href, locale)}
                  className={active ? "active" : ""}
                  key={item.href}
                  title={label}
                  onClick={() => setMobileOpen(false)}
                >
                  {renderNavIcon(item.icon)}
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-sidebar-language" aria-label={tNav("language")}>
            <GoogleTranslateWidget />
          </div>
          <button className="sidebar-logout" type="button" onClick={handleLogout} disabled={loggingOut}>
            <LogOut size={16} />
            <span>{loggingOut ? t("loggingOut") : t("signOut")}</span>
          </button>
        </div>
      </aside>

      <main className={`dashboard-main dashboard-main-${role}`}>
        <div className="dashboard-header">
          <div className="dashboard-header-intro">
            <button
              className="dashboard-header-menu mobile-shell-toggle"
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("openNavigation")}
            >
              <Menu size={20} />
            </button>
            {sidebarCollapsed ? (
              <button
                className="dashboard-sidebar-expand-floating"
                type="button"
                onClick={() => persistSidebarCollapsed(false)}
                aria-label={t("expandSidebar")}
              >
                <PanelLeft size={18} />
              </button>
            ) : null}
            <div>
              <div className="eyebrow">{t(dashboardEyebrowKeyByRole[role])}</div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          <div className="dashboard-header-actions">
            {actions}
            <Link
              className="dashboard-icon-button notification-icon-button"
              href={notificationHref}
              aria-label={t("unreadNotifications", { count: unreadNotifications })}
            >
              <Bell size={17} />
              {unreadNotifications > 0 ? <span className="notification-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span> : null}
            </Link>
            <Link
              className="dashboard-avatar-chip"
              href={profileHref}
              title={`${user.name} - ${user.team}`}
              aria-label={t("openProfile", { name: user.name })}
            >
              <div className="avatar">
                {user.imageUrl ? (
                  <Image src={user.imageUrl} alt={t("profilePhotoAlt", { name: user.name })} width={32} height={32} unoptimized />
                ) : (
                  user.initials || <CircleUserRound size={18} />
                )}
              </div>
            </Link>
            <button className="btn btn-secondary dashboard-logout dashboard-top-signout" type="button" onClick={handleLogout} disabled={loggingOut}>
              <LogOut size={16} />
              {loggingOut ? t("signingOut") : t("signOut")}
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
