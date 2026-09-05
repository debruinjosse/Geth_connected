import { NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/authenticate-mobile-request";
import { acknowledgeReceivedRecognitionCore } from "@/lib/recognition/verify-recognition";

/**
 * POST /api/mobile/v1/recognitions/:id/acknowledge
 * Auth: `Authorization: Bearer <supabase access token>`
 *
 * Mobile counterpart of `app/actions/recognitionVerification.ts`'s
 * `acknowledgeReceivedRecognition` — same business logic (`acknowledgeReceivedRecognitionCore`),
 * reached over HTTP.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const result = await acknowledgeReceivedRecognitionCore(auth.user, id);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
