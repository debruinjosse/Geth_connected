export type AppRole = "employee" | "manager" | "company_admin" | "platform_admin" | "super_admin";

export const appRoleRoutes: Record<AppRole, string> = {
  employee: "/employee",
  manager: "/manager",
  company_admin: "/company",
  platform_admin: "/admin",
  super_admin: "/admin"
};

export function normalizeAppRole(value: unknown): AppRole {
  switch (value) {
    case "manager":
    case "company_admin":
    case "platform_admin":
    case "super_admin":
      return value;
    default:
      return "employee";
  }
}

export function getRouteForAppRole(role: AppRole) {
  return appRoleRoutes[role];
}
