import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Building2,
  FileBarChart2,
  FileText,
  Home,
  QrCode,
  Shield,
  UserRound,
  UsersRound
} from "lucide-react";
import type { AppLocale } from "@/i18n/routing";

export type DashboardRole = "employee" | "manager" | "company" | "admin";

export type DashboardNavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon | "brand-mark" | "vertical-card" | "calendar" | "geth-bird" | "profile-avatar";
};

export const dashboardNavByRole: Record<DashboardRole, DashboardNavItem[]> = {
  employee: [
    { labelKey: "navHome", href: "/employee", icon: Home },
    { labelKey: "navScanCard", href: "/employee/scan", icon: QrCode },
    { labelKey: "navMyCards", href: "/employee/cards", icon: "vertical-card" },
    { labelKey: "navMessages", href: "/employee/messages", icon: "geth-bird" },
    { labelKey: "navProfile", href: "/employee/profile", icon: "profile-avatar" }
  ],
  manager: [
    { labelKey: "navOverview", href: "/manager", icon: Home },
    { labelKey: "navMyTeam", href: "/manager/team", icon: UsersRound },
    { labelKey: "navSignals", href: "/manager/signals", icon: Activity },
    { labelKey: "navAnalytics", href: "/manager/analytics", icon: BarChart3 },
    { labelKey: "navCards", href: "/cards", icon: "vertical-card" },
    { labelKey: "navReports", href: "/manager/reports", icon: FileBarChart2 }
  ],
  company: [
    { labelKey: "navOverview", href: "/company", icon: Home },
    { labelKey: "navTeams", href: "/company/teams", icon: UsersRound },
    { labelKey: "navEmployees", href: "/company/employees", icon: UserRound },
    { labelKey: "navManagers", href: "/company/managers", icon: Shield },
    { labelKey: "navReports", href: "/company/reports", icon: BarChart3 },
    { labelKey: "navCardsDecks", href: "/company/cards", icon: "vertical-card" },
    { labelKey: "navBilling", href: "/company/billing", icon: Building2 }
  ],
  admin: [
    { labelKey: "navOverview", href: "/admin", icon: Home },
    { labelKey: "navCompanies", href: "/admin/companies", icon: Building2 },
    { labelKey: "navDemoBookings", href: "/admin/demo-bookings", icon: "calendar" },
    { labelKey: "navSubscriptions", href: "/admin/subscriptions", icon: "vertical-card" },
    { labelKey: "navCards", href: "/admin/cards", icon: "vertical-card" },
    { labelKey: "navQrRoutes", href: "/admin/qr-routes", icon: QrCode },
    { labelKey: "navSiteContent", href: "/admin/site-content", icon: FileText },
    { labelKey: "navAnalytics", href: "/admin/analytics", icon: BarChart3 }
  ]
};

export const dashboardEyebrowKeyByRole: Record<DashboardRole, string> = {
  employee: "eyebrowEmployee",
  manager: "eyebrowManager",
  company: "eyebrowCompany",
  admin: "eyebrowAdmin"
};

export const notificationHrefByRole: Record<DashboardRole, string> = {
  employee: "/employee/notifications",
  manager: "/manager/notifications",
  company: "/company/notifications",
  admin: "/admin/notifications"
};

export function localizeDashboardHref(href: string, locale: AppLocale) {
  if (!href.startsWith("/") || href.startsWith("/auth")) {
    return href;
  }

  return `/${locale}${href}`;
}

export function isDashboardNavActive(basePathname: string, href: string, role: DashboardRole) {
  const isRootDashboard = href === `/${role}` || (role === "company" && href === "/company");
  return basePathname === href || (!isRootDashboard && basePathname.startsWith(`${href}/`));
}

export function getDashboardProfileHref(role: DashboardRole, locale: AppLocale) {
  const path = role === "employee" ? "/employee/profile" : `/${role === "company" ? "company" : role}/settings`;
  return localizeDashboardHref(path, locale);
}
