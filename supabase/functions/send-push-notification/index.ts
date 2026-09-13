// Invoked automatically by the `trigger_push_on_notification_insert` trigger (see
// supabase/migrations/035_push_notification_trigger.sql) every time any existing code path
// inserts a row into `notifications` (lib/notifications.ts's createNotification and everything
// that calls it) — no changes needed to those call sites. The `notifications` row already exists
// by the time this runs (the trigger fires AFTER INSERT), so this function must NOT insert into
// `notifications` again — its only job is to look up device tokens and actually send the push.
//
// Required secrets (set via `supabase secrets set`, never committed):
//   FIREBASE_PROJECT_ID          - the Firebase project id (from Firebase Console)
//   FIREBASE_SERVICE_ACCOUNT_JSON - the full service-account JSON downloaded from
//                                   Firebase Console > Project Settings > Service Accounts,
//                                   as a single-line string
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform into every
// Edge Function — no manual secret needed for those two.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { create as createJwt, getNumericDate } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

type PushRequestBody = {
  userId: string;
  companyId?: string | null;
  type: string;
  title: string;
  body: string;
  notificationId?: string;
  route?: string | null;
};

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/**
 * Standard Google service-account OAuth2 flow: sign a short-lived JWT with the service account's
 * private key, exchange it for an access token scoped to FCM. No third-party auth library needed
 * beyond a JWT signer, since this is the one Google-specific piece with no Supabase precedent to
 * reuse in this repo.
 */
async function getFcmAccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  token_uri?: string;
}): Promise<string> {
  const key = await importPrivateKey(serviceAccount.private_key);
  const assertion = await createJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: serviceAccount.client_email,
      scope: FCM_SCOPE,
      aud: serviceAccount.token_uri ?? TOKEN_URL,
      exp: getNumericDate(60 * 55),
      iat: getNumericDate(0)
    },
    key
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    throw new Error(`FCM OAuth2 token exchange failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  let payload: PushRequestBody;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const { userId, type, title, body } = payload;
  if (!userId || !type || !title || !body) {
    return json({ ok: false, error: "userId, type, title, and body are required" }, 400);
  }

  const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!projectId || !serviceAccountJson) {
    // Push is best-effort — the in-app notification row already exists regardless of this
    // function's outcome, so a missing Firebase config is logged, not a hard failure.
    console.warn("send-push-notification: FIREBASE_PROJECT_ID/FIREBASE_SERVICE_ACCOUNT_JSON not configured, skipping.");
    return json({ ok: true, sent: 0, invalidTokensRemoved: 0, skipped: "firebase_not_configured" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: tokens, error: tokensError } = await supabase
    .from("device_tokens")
    .select("id, fcm_token")
    .eq("user_id", userId)
    .eq("active", true);

  if (tokensError) {
    return json({ ok: false, error: `Failed to load device tokens: ${tokensError.message}` }, 500);
  }

  if (!tokens || tokens.length === 0) {
    return json({ ok: true, sent: 0, invalidTokensRemoved: 0 });
  }

  let serviceAccount: { client_email: string; private_key: string; token_uri?: string };
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    return json({ ok: false, error: "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON" }, 500);
  }

  const accessToken = await getFcmAccessToken(serviceAccount);
  const sendUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  let sent = 0;
  let invalidTokensRemoved = 0;

  await Promise.all(
    tokens.map(async (row) => {
      const response = await fetch(sendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: {
            token: row.fcm_token,
            notification: { title, body },
            // Android's small status-bar icon (ic_stat_notify) is forced to a flat white/tinted
            // silhouette by the OS on every app — that's a platform rule, not something any app
            // can override. The "logo" people actually recognize in the notification list is the
            // large icon/avatar circle, which is blank by default unless supplied explicitly here.
            android: {
              notification: {
                color: "#2B1A2D",
                // The mobile app's actual current bird-shield mark (not the older/differently
                // colored "official" web logo) — transparent PNG, no baked background, hosted in
                // a dedicated public Supabase Storage bucket (app-assets) rather than the
                // profile-photos bucket, which is scoped to user-uploaded content.
                image: "https://bxnqshxoftirczmyayzk.supabase.co/storage/v1/object/public/app-assets/geth-notification-avatar.png"
              }
            },
            data: {
              type,
              route: payload.route ?? "",
              notificationId: payload.notificationId ?? ""
            }
          }
        })
      });

      if (response.ok) {
        sent += 1;
        return;
      }

      const errorBody = await response.text();
      if (errorBody.includes("UNREGISTERED") || errorBody.includes("INVALID_ARGUMENT") || errorBody.includes("NOT_FOUND")) {
        await supabase.from("device_tokens").update({ active: false }).eq("id", row.id);
        invalidTokensRemoved += 1;
      } else {
        console.error(`FCM send failed for token ${row.id} (${response.status}): ${errorBody}`);
      }
    })
  );

  return json({ ok: true, sent, invalidTokensRemoved });
});
