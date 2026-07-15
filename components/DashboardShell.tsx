"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  FileBarChart2,
  Home,
  Menu,
  MessageSquare,
  QrCode,
  Settings,
  Shield,
  LogOut,
  CircleUserRound,
  UserRound,
  UsersRound,
  X
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { GoldenLeaves } from "@/components/GoldenLeaves";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearDemoSession, getDemoSession, hasSupabaseBrowserConfig } from "@/lib/demo-session";
import { stripLocaleFromPathname, type AppLocale } from "@/i18n/routing";

const navByRole = {
  employee: [
    ["Home", "/employee", Home],
    ["Scan Card", "/employee/scan", QrCode],
    ["My Cards", "/employee/cards", VerticalCardIcon],
    ["Growth", "/employee/growth", BarChart3],
    ["Messages", "/employee/messages", MessageSquare],
    ["Profile", "/employee/profile", UserRound]
  ],
  manager: [
    ["Overview", "/manager", Home],
    ["My Team", "/manager/team", UsersRound],
    ["Signals", "/manager/signals", Activity],
    ["Analytics", "/manager/analytics", BarChart3],
    ["Cards", "/cards", VerticalCardIcon],
    ["Reports", "/manager/reports", FileBarChart2]
  ],
  company: [
    ["Overview", "/company", Home],
    ["Teams", "/company/teams", UsersRound],
    ["Employees", "/company/employees", UserRound],
    ["Managers", "/company/managers", Shield],
    ["Reports", "/company/reports", BarChart3],
    ["Cards & Decks", "/company/cards", VerticalCardIcon],
    ["Billing", "/company/billing", Building2]
  ],
  admin: [
    ["Overview", "/admin", Home],
    ["Companies", "/admin/companies", Building2],
    ["Subscriptions", "/admin/subscriptions", VerticalCardIcon],
    ["Cards", "/admin/cards", VerticalCardIcon],
    ["QR Routes", "/admin/qr-routes", QrCode],
    ["Analytics", "/admin/analytics", BarChart3]
  ]
} as const;

function VerticalCardIcon({ size = 19 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 20 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4.25" y="2.75" width="11.5" height="18.5" rx="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.25 7.25H12.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.55" />
      <path d="M7.25 11.25H12.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.55" />
      <path d="M8.5 16.5H11.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.55" />
    </svg>
  );
}

const eyebrowCopy = {
  employee: "GETH employee dashboard",
  manager: "GETH manager workspace",
  company: "GETH company admin",
  admin: "GETH platform admin"
} as const;

const notificationHrefByRole = {
  employee: "/employee/notifications",
  manager: "/manager/notifications",
  company: "/company/notifications",
  admin: "/admin/notifications"
} as const;

function localizeDashboardHref(href: string, locale: AppLocale) {
  if (!href.startsWith("/") || href.startsWith("/auth")) {
    return href;
  }

  return `/${locale}${href}`;
}

export function DashboardShell({
  role,
  title,
  subtitle,
  user,
  children,
  actions,
  unreadNotifications = 0
}: {
  role: keyof typeof navByRole;
  title: string;
  subtitle: string;
  user: { name: string; initials: string; team: string; imageUrl?: string | null };
  children: ReactNode;
  actions?: ReactNode;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const basePathname = stripLocaleFromPathname(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const nav = navByRole[role];

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
      router.replace(localizeDashboardHref("/login", locale));
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <div className="dashboard-layout">
      <button className="mobile-shell-toggle" type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <div className={`dashboard-overlay ${mobileOpen ? "open" : ""}`.trim()} onClick={() => setMobileOpen(false)} />

      <aside className={`dashboard-sidebar ${mobileOpen ? "open" : ""}`.trim()}>
        <div className="dashboard-sidebar-top">
          <div className="dashboard-sidebar-head">
            <BrandLogo tagline href={`/${locale}`} />
            <button className="mobile-nav-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
          </div>
          <nav className="side-links" aria-label={`${role} navigation`}>
            {nav.map(([label, href, Icon]) => {
              const isRootDashboard = href === `/${role}` || (role === "company" && href === "/company");
              const active = basePathname === href || (!isRootDashboard && basePathname.startsWith(`${href}/`));
              return (
                <Link href={localizeDashboardHref(href, locale)} className={active ? "active" : ""} key={label} onClick={() => setMobileOpen(false)}>
                  <Icon size={19} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="dashboard-sidebar-bottom">
          <GoldenLeaves className="sidebar-leaves" />
          <button className="sidebar-logout" type="button" onClick={handleLogout} disabled={loggingOut}>
            <LogOut size={16} />
            <span>{loggingOut ? "Logging out..." : "Sign out"}</span>
          </button>
        </div>
      </aside>

      <main className={`dashboard-main dashboard-main-${role}`}>
        <div className="dashboard-header">
          <div>
            <div className="eyebrow">{eyebrowCopy[role]}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="dashboard-header-actions">
            {actions}
            <Link className="dashboard-icon-button notification-icon-button" href={localizeDashboardHref(notificationHrefByRole[role], locale)} aria-label={`${unreadNotifications} unread notifications`}>
              <Bell size={17} />
              {unreadNotifications > 0 ? <span className="notification-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span> : null}
            </Link>
            <Link className="dashboard-icon-button" href={localizeDashboardHref(`/${role === "company" ? "company" : role}/settings`, locale)} aria-label="Settings">
              <Settings size={17} />
            </Link>
            <div className="dashboard-avatar-chip" title={`${user.name} - ${user.team}`}>
              <div className="avatar">
                {user.imageUrl ? <Image src={user.imageUrl} alt={`${user.name} profile`} width={32} height={32} unoptimized /> : user.initials || <CircleUserRound size={18} />}
              </div>
            </div>
            <button className="btn btn-secondary dashboard-logout dashboard-top-signout" type="button" onClick={handleLogout} disabled={loggingOut}>
              <LogOut size={16} />
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
