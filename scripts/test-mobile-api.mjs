// Exercises the mobile API routes (app/api/mobile/v1/*) end-to-end against the running dev
// server, using the UAT seed accounts (`npm run seed:uat`). This is a regression check to rerun
// after any future backend change touching claim/give/approve/acknowledge/growth-insights — not a
// one-off. Requires `npm run dev` running locally first.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const ARTIFACTS_DIR = resolve(ROOT, "artifacts", "mobile-api-test");
const APP_URL = process.env.MOBILE_API_TEST_URL || "http://localhost:3000";
const PASSWORD = "GethDemo!2026";
const GIVE_CARD_SLUG = "luisteraar";
const CLAIM_CARD_SLUG = "helder";

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

const results = [];

function record(step, ok, detail) {
  results.push({ step, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${step}${detail ? ` — ${detail}` : ""}`);
}

async function signIn(url, anon, email) {
  const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
  if (error || !data.session || !data.user) {
    throw new Error(`Could not sign in as ${email}: ${error?.message ?? "no session returned"}`);
  }
  return { supabase, accessToken: data.session.access_token, userId: data.user.id };
}

async function callApi(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${APP_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    // non-JSON response, leave json null
  }

  return { status: response.status, json };
}

async function findLatestRecognitionId(supabase, column, userId, status) {
  const { data, error } = await supabase
    .from("recognition_events")
    .select("id")
    .eq(column, userId)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Could not find a ${status} recognition_events row for ${column}=${userId}: ${error?.message ?? "none found"}`);
  }

  return data.id;
}

async function main() {
  const env = loadEnvFile();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.");
  }

  console.log(`Testing mobile API at ${APP_URL} — run \`npm run seed:uat\` first if sign-in fails.\n`);

  const giver = await signIn(url, anon, "employee1@geth-demo.com");
  const receiver = await signIn(url, anon, "employee2@geth-demo.com");

  // 1. Auth is actually enforced: no token -> 401.
  const unauthed = await callApi("/api/mobile/v1/growth-insights");
  record("Missing bearer token is rejected", unauthed.status === 401, `status ${unauthed.status}`);

  // 2. Give a card: employee1 -> employee2.
  const give = await callApi("/api/mobile/v1/recognitions/give", {
    method: "POST",
    token: giver.accessToken,
    body: { cardSlug: GIVE_CARD_SLUG, receiverUserId: receiver.userId, personalNote: "mobile-api test run" }
  });
  record("giveRecognition via API", give.status === 200 && give.json?.ok === true, JSON.stringify(give.json));

  // 3. employee2 acknowledges it.
  const givenId = await findLatestRecognitionId(receiver.supabase, "receiver_user_id", receiver.userId, "pending_acknowledgement");
  const acknowledge = await callApi(`/api/mobile/v1/recognitions/${givenId}/acknowledge`, {
    method: "POST",
    token: receiver.accessToken
  });
  record("acknowledgeReceivedRecognition via API", acknowledge.status === 200 && acknowledge.json?.ok === true, JSON.stringify(acknowledge.json));

  // 4. Claim a card: employee2 claims, naming employee1 as the giver (requires verification).
  const claim = await callApi("/api/mobile/v1/recognitions/claim", {
    method: "POST",
    token: receiver.accessToken,
    body: { cardSlug: CLAIM_CARD_SLUG, giverUserId: giver.userId, giverName: "Employee 1", claimOrigin: "manual_entry" }
  });
  record("claimRecognition via API", claim.status === 200 && claim.json?.ok === true, JSON.stringify(claim.json));

  // 5. employee1 approves it.
  const claimedId = await findLatestRecognitionId(giver.supabase, "giver_user_id", giver.userId, "pending_verification");
  const approve = await callApi(`/api/mobile/v1/recognitions/${claimedId}/approve`, {
    method: "POST",
    token: giver.accessToken
  });
  record("approveRecognitionVerification via API", approve.status === 200 && approve.json?.ok === true, JSON.stringify(approve.json));

  // 6. Growth insights for employee2, who now has at least one approved recognition.
  const growth = await callApi("/api/mobile/v1/growth-insights?locale=en", { token: receiver.accessToken });
  record(
    "growth-insights via API",
    growth.status === 200 && growth.json?.ok === true && Array.isArray(growth.json?.signals),
    JSON.stringify(growth.json)
  );

  const failed = results.filter((result) => !result.ok);
  const summary = [
    `Mobile API test run: ${results.length - failed.length}/${results.length} passed`,
    ...results.map((result) => `${result.ok ? "PASS" : "FAIL"}  ${result.step}${result.detail ? ` — ${result.detail}` : ""}`)
  ].join("\n");

  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  writeFileSync(resolve(ARTIFACTS_DIR, "results.txt"), summary, "utf8");

  console.log(`\n${results.length - failed.length}/${results.length} passed.`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Mobile API test run failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
