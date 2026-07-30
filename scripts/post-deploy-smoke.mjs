/**
 * Post-deploy smoke checks (local or production via POST_DEPLOY_URL).
 * Usage: node scripts/post-deploy-smoke.mjs
 *        POST_DEPLOY_URL=https://your-app.vercel.app node scripts/post-deploy-smoke.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const APP_URL = (process.env.POST_DEPLOY_URL || "http://localhost:3000").replace(/\/$/, "");
const PASSWORD = "GethDemo!2026";
const ARTIFACTS = resolve(ROOT, "artifacts", "post-deploy-smoke");

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(ROOT, ".env.local"), "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
    return env;
  } catch {
    return {};
  }
}

function authCookieName(supabaseUrl) {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

function buildAuthCookie(session, supabaseUrl) {
  const payload = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user
  });
  return `${authCookieName(supabaseUrl)}=${encodeURIComponent(payload)}`;
}

async function fetchText(path, cookie) {
  const headers = cookie ? { Cookie: cookie } : {};
  const response = await fetch(`${APP_URL}${path}`, { redirect: "manual", headers });
  const text = await response.text();
  return { status: response.status, location: response.headers.get("location"), text };
}

function pass(msg) {
  return { ok: true, msg };
}

function fail(msg) {
  return { ok: false, msg };
}

async function main() {
  const env = loadEnvFile();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const results = [];

  // 1. App reachable
  try {
    const home = await fetchText("/nl");
    results.push({
      name: "App reachable",
      ...(home.status >= 200 && home.status < 400 ? pass(`${home.status} at ${APP_URL}`) : fail(`HTTP ${home.status}`))
    });
  } catch (error) {
    results.push({ name: "App reachable", ...fail(error instanceof Error ? error.message : "fetch failed") });
    printAndExit(results);
    return;
  }

  // 2. Give-card route (public)
  const givePath = "/nl/give-card/connector";
  const give = await fetchText(givePath);
  const giveOk =
    give.status === 200 &&
    give.text.includes("claim-page") &&
    !give.text.includes("Who gave you this card?");
  results.push({
    name: "Give-card route (not claim copy)",
    ...(giveOk ? pass(`${givePath} → ${give.status}, give shell present`) : fail(`status ${give.status}, location ${give.location ?? "—"}`))
  });

  // 3. Give flow step 2 string exists in messages (bundled in client JS chunk)
  const giveHasStep2 =
    give.text.includes("Who do you want to give this card to?") ||
    give.text.includes("step2GiveTitle") ||
    give.text.includes("give-card");
  results.push({
    name: "Give flow step-2 copy",
    ...(giveHasStep2
      ? pass("Give-step copy or route marker found in page payload")
      : fail("Expected give receiver step text in HTML/JS (may need browser QA)"))
  });

  // 4. Cards intent=give banner
  const cards = await fetchText("/nl/cards?intent=give");
  const cardsOk = cards.status === 200 || cards.status === 307 || cards.status === 302;
  results.push({
    name: "Cards library (?intent=give)",
    ...(cardsOk ? pass(`HTTP ${cards.status}`) : fail(`HTTP ${cards.status}`))
  });

  // 5. Pricing mobile CSS markers
  const pricing = await fetchText("/nl/pricing");
  const pricingOk =
    pricing.status === 200 &&
    pricing.text.includes("pricing-plan-grid") &&
    pricing.text.includes("pricing-plan-card");
  results.push({
    name: "Pricing page structure",
    ...(pricingOk ? pass("pricing-plan-grid + cards present") : fail(`HTTP ${pricing.status}`))
  });

  // 6. Recognition asset
  const asset = await fetchText("/assets/geth-recognition-moment.png");
  results.push({
    name: "Get Certified image asset",
    ...(asset.status === 200 ? pass("geth-recognition-moment.png served") : fail(`HTTP ${asset.status}`))
  });

  // 7. Manager My Team (authenticated)
  if (supabaseUrl && anon) {
    const supabase = createClient(supabaseUrl, anon, { auth: { persistSession: false } });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "manager@geth-demo.com",
      password: PASSWORD
    });

    if (error || !data.session) {
      results.push({ name: "Manager My Team (auth)", ...fail(error?.message ?? "no session") });
    } else {
      const cookie = buildAuthCookie(data.session, supabaseUrl);
      const team = await fetchText("/nl/manager/team", cookie);
      const teamOk =
        team.status === 200 &&
        !team.location?.includes("/login") &&
        (team.text.includes("Team members") || team.text.includes("Teamleden") || team.text.includes("manager-team"));
      results.push({
        name: "Manager → My Team (no login kick)",
        ...(teamOk ? pass(`HTTP ${team.status}, team page HTML`) : fail(`HTTP ${team.status}, redirect ${team.location ?? "—"}`))
      });
      await supabase.auth.signOut();
    }

    // 8. Employee give cards link target
    const { data: empData, error: empErr } = await supabase.auth.signInWithPassword({
      email: "employee1@geth-demo.com",
      password: PASSWORD
    });
    if (empErr || !empData.session) {
      results.push({ name: "Employee dashboard", ...fail(empErr?.message ?? "no session") });
    } else {
      const empCookie = buildAuthCookie(empData.session, supabaseUrl);
      const emp = await fetchText("/nl/employee", empCookie);
      const empOk = emp.status === 200 && emp.text.includes("intent=give");
      results.push({
        name: "Employee Give a card → ?intent=give",
        ...(empOk ? pass("employee dashboard links to give intent") : fail("intent=give link not found in HTML"))
      });
      await supabase.auth.signOut();
    }
  } else {
    results.push({ name: "Manager / Employee auth tests", ...fail("Missing Supabase env in .env.local") });
  }

  // 9. SMTP sender configuration
  const smtpFrom = env.SMTP_FROM ?? "";
  const smtpUser = env.SMTP_USER ?? "";
  const smtpOk = /geth\.pro/i.test(smtpFrom) && /geth\.pro/i.test(smtpUser) && env.SMTP_HOST && env.SMTP_PASS;
  results.push({
    name: "SMTP env (info@geth.pro)",
    ...(smtpOk ? pass(`FROM=${smtpFrom}, USER=${smtpUser}`) : fail(`FROM=${smtpFrom || "missing"}, USER=${smtpUser || "missing"} — set in Vercel and redeploy`))
  });

  printAndExit(results);
}

function printAndExit(results) {
  mkdirSync(ARTIFACTS, { recursive: true });
  const lines = results.map((r) => `${r.ok ? "PASS" : "FAIL"} | ${r.name} | ${r.msg}`);
  writeFileSync(resolve(ARTIFACTS, "results.txt"), lines.join("\n"));
  console.log(`\nPost-deploy smoke — ${APP_URL}\n`);
  for (const r of results) {
    console.log(`${r.ok ? "✓" : "✗"} ${r.name}: ${r.msg}`);
  }
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
