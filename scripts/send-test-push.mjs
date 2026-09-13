import { loadLocalEnv } from "./lib/env-local.mjs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

await loadLocalEnv();

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const USER_ID = "88700993-1deb-47c0-959e-2a98c52af8f6";

const { data, error } = await admin
  .from("notifications")
  .insert({
    user_id: USER_ID,
    type: "test_push",
    title: "Icon test v3",
    body: "Correct matching logo, transparent background — final check."
  })
  .select()
  .single();

if (error) {
  console.error("Insert failed:", error.message);
  process.exit(1);
}
console.log("Inserted:", data.id);

await new Promise((r) => setTimeout(r, 2500));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const res = await client.query(
  "select status_code, content from net._http_response order by created desc limit 1"
);
console.log("pg_net response:", res.rows[0]);
await client.end();
