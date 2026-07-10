export type DemoRole = "employee" | "manager" | "company_admin" | "super_admin";

export type DemoSession = {
  role: DemoRole;
  userId: string;
  name: string;
  email?: string;
  company?: string;
  createdAt: string;
};

export type StoredRecognition = {
  id: string;
  cardSlug: string;
  cardTitle: string;
  category: string;
  giverId: string;
  giverName: string;
  receiverName: string;
  note?: string;
  createdAt: string;
};

const SESSION_KEY = "geth-demo-session";
const RECOGNITION_KEY = "geth-demo-recognitions";
export const DEMO_SESSION_COOKIE = "geth-demo-session";

export const roleRoutes: Record<DemoRole, string> = {
  employee: "/employee",
  manager: "/manager",
  company_admin: "/company",
  super_admin: "/admin"
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function writeDemoCookie(session: DemoSession) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${DEMO_SESSION_COOKIE}=${encodeURIComponent(JSON.stringify(session))}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearDemoCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function getRouteForRole(role: DemoRole) {
  return roleRoutes[role];
}

export function setDemoSession(session: DemoSession) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  writeDemoCookie(session);
}

export function getDemoSession() {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(SESSION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as DemoSession;
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(SESSION_KEY);
  clearDemoCookie();
}

export function getStoredRecognitions() {
  if (!canUseStorage()) return [] as StoredRecognition[];
  const value = window.localStorage.getItem(RECOGNITION_KEY);
  if (!value) return [] as StoredRecognition[];

  try {
    return JSON.parse(value) as StoredRecognition[];
  } catch {
    return [] as StoredRecognition[];
  }
}

export function saveStoredRecognition(recognition: StoredRecognition) {
  if (!canUseStorage()) return;
  const existing = getStoredRecognitions();
  window.localStorage.setItem(RECOGNITION_KEY, JSON.stringify([recognition, ...existing]));
}

export function formatRecognitionDate(isoString: string) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(isoString));
}

export function hasSupabaseBrowserConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
