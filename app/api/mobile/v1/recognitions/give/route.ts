import { NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/authenticate-mobile-request";
import { giveRecognitionCore, type GiveRecognitionInput } from "@/lib/recognition/claim-recognition";

/**
 * POST /api/mobile/v1/recognitions/give
 * Body: GiveRecognitionInput (see lib/recognition/claim-recognition.ts)
 * Auth: `Authorization: Bearer <supabase access token>`
 *
 * Mobile counterpart of `app/actions/claimRecognition.ts`'s `giveRecognition` — same business
 * logic (`giveRecognitionCore`), reached over HTTP instead of a Server Action.
 */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: GiveRecognitionInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body?.cardSlug !== "string" || !body.cardSlug.trim()) {
    return NextResponse.json({ ok: false, error: "cardSlug is required." }, { status: 400 });
  }

  const result = await giveRecognitionCore(auth.supabase, auth.user, body);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
