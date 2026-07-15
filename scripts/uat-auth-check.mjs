import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ARTIFACTS_DIR = resolve(ROOT, "artifacts", "uat");
const PASSWORD = "GethDemo!2026";
const APP_URL = "http://localhost:3000";

function loadEnvFile() {
  const env = {};
  const raw = readFileSync(resolve(ROOT, ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const roleRoutes = {
  employee: "/employee",
  manager: "/manager",
  company_admin: "/company",
  platform_admin: "/admin",
  super_admin: "/admin"
};

const accounts = [
  ["Super Admin", "super.admin@geth-demo.com", "super_admin"],
  ["Company Admin", "company.admin@geth-demo.com", "company_admin"],
  ["Manager", "manager@geth-demo.com", "manager"],
  ["Employee 1", "employee1@geth-demo.com", "employee"],
  ["Employee 2", "employee2@geth-demo.com", "employee"],
  ["Employee 3", "employee3@geth-demo.com", "employee"],
  ["Employee 4", "employee4@geth-demo.com", "employee"]
];

async function checkRoute(path) {
  try {
    const response = await fetch(`${APP_URL}${path}`, { redirect: "manual" });
    return `${response.status}`;
  } catch (error) {
    return `ERROR: ${error instanceof Error ? error.message : "route failed"}`;
  }
}

async function main() {
  const env = loadEnvFile();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error("Missing Supabase URL or anon key.");

  const results = [["Area", "Use case", "Role", "Email", "Expected", "Actual", "Status", "Notes"]];

  for (const [label, email, expectedRole] of accounts) {
    const supabase = createClient(url, anon, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
    if (error || !data.user) {
      results.push(["Auth", "Password login", label, email, expectedRole, error?.message ?? "No user", "FAIL", "Could not sign in"]);
      continue;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, first_name, last_name, company_id, team_id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      results.push(["Auth", "Profile lookup", label, email, expectedRole, profileError?.message ?? "Missing profile", "FAIL", "Login worked but profile query failed"]);
      continue;
    }

    const route = roleRoutes[profile.role] ?? "/login";
    const roleStatus = profile.role === expectedRole ? "PASS" : "FAIL";
    results.push(["Auth", "Role profile", label, email, expectedRole, profile.role, roleStatus, `Expected dashboard ${route}`]);

    const routeStatus = await checkRoute(route);
    results.push(["Routes", "Dashboard route responds", label, email, route, routeStatus, routeStatus.startsWith("2") || routeStatus.startsWith("3") ? "PASS" : "CHECK", "HTTP check without browser session"]);

    await supabase.auth.signOut();
  }

  for (const path of ["/", "/login", "/signup", "/cards", "/claim-card/connector", "/pricing", "/book-demo"]) {
    const status = await checkRoute(path);
    results.push(["Public", "Route smoke", "Public", "", path, status, status.startsWith("2") || status.startsWith("3") ? "PASS" : "FAIL", "HTTP route check"]);
  }

  const csv = results.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  writeFileSync(resolve(ARTIFACTS_DIR, "GETH_UAT_RESULTS.csv"), csv);
  console.log("UAT auth/route checks written to artifacts/uat/GETH_UAT_RESULTS.csv");
  console.table(results.slice(1).map(([area, useCase, role, email, expected, actual, status]) => ({ area, useCase, role, email, expected, actual, status })));
}

main().catch((error) => {
  console.error("UAT check failed:");
  console.error(error);
  process.exit(1);
});
