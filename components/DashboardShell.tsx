"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileBarChart2,
  Home,
  Library,
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

const navByRole = {
  employee: [
    ["Home", "/employee", Home],
    ["My Cards", "/employee/cards", CreditCard],
    ["Growth", "/employee/growth", BarChart3],
    ["Messages", "/employee/messages", MessageSquare],
    ["Profile", "/employee/profile", UserRound],
    ["Notifications", "/employee/notifications", Bell],
    ["Settings", "/employee/settings", Settings]
  ],
  manager: [
    ["Overview", "/manager", Home],
    ["My Team", "/manager/team", UsersRound],
    ["Signals", "/manager/signals", Bell],
    ["Notifications", "/manager/notifications", Bell],
    ["Analytics", "/manager/analytics", BarChart3],
    ["Reports", "/manager/reports", FileBarChart2],
    ["Settings", "/manager/settings", Settings]
  ],
  company: [
    ["Overview", "/company", Home],
    ["Teams", "/company/teams", UsersRound],
    ["Employees", "/company/employees", UserRound],
    ["Managers", "/company/managers", Shield],
    ["Reports", "/company/reports", BarChart3],
    ["Notifications", "/company/notifications", Bell],
    ["Cards & Decks", "/company/cards", Library],
    ["Settings", "/company/settings", Settings],
    ["Billing", "/company/billing", Building2]
  ],
  admin: [
    ["Overview", "/admin", Home],
    ["Companies", "/admin/companies", Building2],
    ["Subscriptions", "/admin/subscriptions", CreditCard],
    ["Cards", "/admin/cards", Library],
    ["QR Routes", "/admin/qr-routes", QrCode],
    ["Analytics", "/admin/analytics", BarChart3],
    ["Notifications", "/admin/notifications", Bell],
    ["Settings", "/admin/settings", Settings]
  ]
} as const;

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
  user: { name: string; initials: string; team: string };
  children: ReactNode;
  actions?: ReactNode;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
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
      router.replace("/login");
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
            <BrandLogo tagline href="/" />
            <button className="mobile-nav-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
              <X size={18} />
            </button>
          </div>
          <nav className="side-links" aria-label={`${role} navigation`}>
            {nav.map(([label, href, Icon]) => {
              const isRootDashboard = href === `/${role}` || (role === "company" && href === "/company");
              const active = pathname === href || (!isRootDashboard && pathname.startsWith(`${href}/`));
              return (
                <Link href={href} className={active ? "active" : ""} key={label} onClick={() => setMobileOpen(false)}>
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

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <div className="eyebrow">{eyebrowCopy[role]}</div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="dashboard-header-actions">
            {actions}
            <Link className="dashboard-icon-button notification-icon-button" href={notificationHrefByRole[role]} aria-label={`${unreadNotifications} unread notifications`}>
              <Bell size={17} />
              {unreadNotifications > 0 ? <span className="notification-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span> : null}
            </Link>
            <Link className="dashboard-icon-button" href={`/${role === "company" ? "company" : role}/settings`} aria-label="Settings">
              <Settings size={17} />
            </Link>
            <div className="dashboard-avatar-chip" title={`${user.name} - ${user.team}`}>
              <div className="avatar">{user.initials || <CircleUserRound size={18} />}</div>
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
