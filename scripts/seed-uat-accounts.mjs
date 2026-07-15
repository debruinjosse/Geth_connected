import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, ".env.local");
const ARTIFACTS_DIR = resolve(ROOT, "artifacts", "uat");
const PASSWORD = "GethDemo!2026";

function loadEnvFile() {
  const env = {};
  const raw = readFileSync(ENV_PATH, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function splitName(name) {
  const parts = name.split(/\s+/).filter(Boolean);
  return {
    first_name: parts[0] ?? "GETH",
    last_name: parts.slice(1).join(" ") || "User"
  };
}

async function findAuthUserByEmail(admin, email) {
  let page = 1;
  const perPage = 100;

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
}

async function upsertAuthUser(admin, account) {
  const existing = await findAuthUserByEmail(admin, account.email);

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      email: account.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: account.name,
        company: account.companyName,
        role: account.role
      }
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: account.name,
      company: account.companyName,
      role: account.role
    }
  });

  if (error) throw error;
  return data.user;
}

async function main() {
  const env = loadEnvFile();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const companyName = "GETH UAT Company";
  const companySlug = slugify(companyName);
  const { data: company, error: companyError } = await admin
    .from("companies")
    .upsert(
      {
        company_name: companyName,
        slug: companySlug,
        industry: "Employee recognition",
        subscription_plan: "growth",
        status: "active"
      },
      { onConflict: "slug" }
    )
    .select("id, company_name")
    .single();

  if (companyError) throw companyError;

  const teamSeeds = ["Culture Team", "Product Team"];
  const teams = new Map();
  for (const teamName of teamSeeds) {
    const { data: team, error } = await admin
      .from("teams")
      .upsert(
        {
          company_id: company.id,
          name: teamName
        },
        { onConflict: "company_id,name" }
      )
      .select("id, name")
      .single();
    if (error) throw error;
    teams.set(teamName, team);
  }

  const accounts = [
    { role: "super_admin", name: "GETH Super Admin", email: "super.admin@geth-demo.com", companyName, teamName: null },
    { role: "company_admin", name: "Ali Ahmed", email: "company.admin@geth-demo.com", companyName, teamName: null },
    { role: "manager", name: "Sarah Manager", email: "manager@geth-demo.com", companyName, teamName: "Product Team" },
    { role: "employee", name: "Ayna Sulaiman", email: "employee1@geth-demo.com", companyName, teamName: "Product Team" },
    { role: "employee", name: "Jamie Miller", email: "employee2@geth-demo.com", companyName, teamName: "Product Team" },
    { role: "employee", name: "Lisa Jansen", email: "employee3@geth-demo.com", companyName, teamName: "Culture Team" },
    { role: "employee", name: "Mark de Vries", email: "employee4@geth-demo.com", companyName, teamName: "Culture Team" }
  ];

  const createdUsers = new Map();
  for (const account of accounts) {
    const user = await upsertAuthUser(admin, account);
    createdUsers.set(account.email, user);
    const names = splitName(account.name);
    const teamId = account.teamName ? teams.get(account.teamName)?.id ?? null : null;
    const companyId = account.role === "super_admin" ? null : company.id;

    const { error } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          company_id: companyId,
          team_id: teamId,
          email: account.email,
          role: account.role,
          status: "active",
          ...names
        },
        { onConflict: "id" }
      );

    if (error) throw error;
  }

  const manager = createdUsers.get("manager@geth-demo.com");
  const productTeam = teams.get("Product Team");
  const cultureTeam = teams.get("Culture Team");

  if (manager && productTeam) {
    const { error } = await admin.from("teams").update({ manager_id: manager.id }).eq("id", productTeam.id);
    if (error) throw error;
  }

  const cultureManager = createdUsers.get("company.admin@geth-demo.com");
  if (cultureManager && cultureTeam) {
    const { error } = await admin.from("teams").update({ manager_id: null }).eq("id", cultureTeam.id);
    if (error) throw error;
  }

  const { data: cards, error: cardError } = await admin
    .from("card_library")
    .select("id, title, category")
    .eq("active", true)
    .limit(6);

  if (cardError) throw cardError;

  await admin.from("recognition_events").delete().eq("company_id", company.id);

  if (cards?.length) {
    const employees = accounts.filter((account) => account.role === "employee");
    const recognitionRows = employees.flatMap((employee, index) => {
      const receiver = createdUsers.get(employee.email);
      if (!receiver) return [];
      const teamId = employee.teamName ? teams.get(employee.teamName)?.id ?? null : null;
      return [
        {
          company_id: company.id,
          team_id: teamId,
          card_id: cards[index % cards.length].id,
          receiver_user_id: receiver.id,
          giver_user_id: manager?.id ?? null,
          giver_name: "Sarah Manager",
          giver_email: "manager@geth-demo.com",
          personal_note: `Seed recognition for ${employee.name}.`,
          status: "claimed",
          claimed_at: new Date(Date.now() - index * 86400000).toISOString()
        },
        {
          company_id: company.id,
          team_id: teamId,
          card_id: cards[(index + 2) % cards.length].id,
          receiver_user_id: receiver.id,
          giver_user_id: createdUsers.get("company.admin@geth-demo.com")?.id ?? null,
          giver_name: "Ali Ahmed",
          giver_email: "company.admin@geth-demo.com",
          personal_note: "Thank you for keeping recognition visible.",
          status: "claimed",
          claimed_at: new Date(Date.now() - (index + 3) * 86400000).toISOString()
        }
      ];
    });

    const { error } = await admin.from("recognition_events").insert(recognitionRows);
    if (error) throw error;
  }

  const credentialRows = [
    ["Role", "Email", "Password", "Login URL", "Expected Dashboard", "Notes"],
    ["Super Admin", "super.admin@geth-demo.com", PASSWORD, "http://localhost:3000/login", "/admin", "Platform overview and admin portal"],
    ["Company Admin", "company.admin@geth-demo.com", PASSWORD, "http://localhost:3000/login", "/company", "Can manage teams, employees, managers, invites"],
    ["Manager", "manager@geth-demo.com", PASSWORD, "http://localhost:3000/login", "/manager", "Assigned to Product Team"],
    ["Employee 1", "employee1@geth-demo.com", PASSWORD, "http://localhost:3000/login", "/employee", "Seed recognitions included"],
    ["Employee 2", "employee2@geth-demo.com", PASSWORD, "http://localhost:3000/login", "/employee", "Seed recognitions included"],
    ["Employee 3", "employee3@geth-demo.com", PASSWORD, "http://localhost:3000/login", "/employee", "Seed recognitions included"],
    ["Employee 4", "employee4@geth-demo.com", PASSWORD, "http://localhost:3000/login", "/employee", "Seed recognitions included"]
  ];
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const credentialCsv = credentialRows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  writeFileSync(resolve(ARTIFACTS_DIR, "GETH_TEST_CREDENTIALS.csv"), credentialCsv);

  const useCases = [
    ["Area", "Use case", "Role", "Route", "Expected result", "Status"],
    ["Auth", "Password login", "All seeded roles", "/login", "Role redirects to correct dashboard", "Ready for Playwright"],
    ["Auth", "Show/hide password", "Public", "/login", "Password visibility toggles without changing value", "Implemented"],
    ["Public", "Logged-in home header", "All seeded roles", "/", "Header shows user name and dashboard CTA", "Implemented"],
    ["Cards", "Browse card library", "Public/authenticated", "/cards", "Cards load from Supabase with fallback", "Existing"],
    ["Claim", "Claim connector card", "Employee", "/claim-card/connector", "Recognition inserts into recognition_events", "Existing"],
    ["Employee", "Dashboard data", "Employee", "/employee", "Metrics/recent recognitions use real rows", "Existing/refined"],
    ["Manager", "Team dashboard", "Manager", "/manager", "Team metrics use assigned team data", "Existing"],
    ["Company", "Create team", "Company Admin", "/company/teams", "Team server action creates row", "Existing"],
    ["Company", "Invite employee", "Company Admin", "/company/employees", "Invitation link generated and copyable", "Existing"],
    ["Company", "Manage employee status/team", "Company Admin", "/company/employees", "Server actions update profiles", "Existing"],
    ["Admin", "Platform overview", "Super Admin", "/admin", "Admin portal accessible for super_admin role", "Seeded access"]
  ];
  const useCaseCsv = useCases.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  writeFileSync(resolve(ARTIFACTS_DIR, "GETH_UAT_USE_CASES.csv"), useCaseCsv);

  console.log("UAT accounts seeded successfully.");
  console.log("Credentials written to artifacts/uat/GETH_TEST_CREDENTIALS.csv");
  console.log("Use cases written to artifacts/uat/GETH_UAT_USE_CASES.csv");
  console.table(credentialRows.slice(1).map(([role, email, password, login, dashboard]) => ({ role, email, password, login, dashboard })));
}

main().catch((error) => {
  console.error("Failed to seed UAT accounts:");
  console.error(error);
  process.exit(1);
});
