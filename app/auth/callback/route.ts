import { NextRequest, NextResponse } from "next/server";

const AUTH_VERIFY_QUERY_KEYS = ["token_hash", "type", "code", "role", "next", "invite"] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");

  if (tokenHash || code) {
    const verifyUrl = new URL("/auth/verify", request.url);

    for (const key of AUTH_VERIFY_QUERY_KEYS) {
      const value = searchParams.get(key);
      if (value) {
        verifyUrl.searchParams.set(key, value);
      }
    }

    return NextResponse.redirect(verifyUrl);
  }

  const completeUrl = request.nextUrl.clone();
  completeUrl.pathname = "/auth/callback/complete";
  return NextResponse.rewrite(completeUrl);
}
