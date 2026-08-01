import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { resolveAuthCallbackRedirect } from "@/lib/auth/complete-auth-callback";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const invite = searchParams.get("invite");
  const next = searchParams.get("next");
  const role = searchParams.get("role");

  if (!tokenHash && !code) {
    return NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
  }

  const redirectTarget = new URL("/login?error=auth_callback_failed", request.url);
  const cookieCarrier = NextResponse.redirect(redirectTarget);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieCarrier.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        throw error;
      }
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType
      });
      if (error) {
        throw error;
      }
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw userError ?? new Error("No authenticated user was returned from Supabase.");
    }

    if (type === "recovery") {
      const resetRedirect = NextResponse.redirect(new URL("/reset-password", request.url));
      copyCookies(cookieCarrier, resetRedirect);
      return resetRedirect;
    }

    const { redirectTo } = await resolveAuthCallbackRedirect(user, {
      inviteToken: invite,
      targetPath: next,
      expectedRole: role,
      origin: request.url
    });

    const successRedirect = NextResponse.redirect(new URL(redirectTo, request.url));
    copyCookies(cookieCarrier, successRedirect);
    return successRedirect;
  } catch {
    const failureRedirect = NextResponse.redirect(new URL("/login?error=auth_callback_failed", request.url));
    copyCookies(cookieCarrier, failureRedirect);
    return failureRedirect;
  }
}
