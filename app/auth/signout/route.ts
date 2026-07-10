import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/demo-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const next = request.nextUrl.searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/login";
  const response = NextResponse.redirect(new URL(safeNext, request.url));
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax"
  });
  return response;
}
