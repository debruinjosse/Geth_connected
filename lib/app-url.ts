const PRODUCTION_APP_URL = "https://geth.pro";

export function getProductionAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
  if (!raw || /localhost|127\.0\.0\.1|ngrok/i.test(raw)) {
    return PRODUCTION_APP_URL;
  }

  return raw;
}

export function getAuthCallbackUrl(nextPath?: string) {
  const url = new URL("/auth/verify", getProductionAppUrl());
  if (nextPath?.startsWith("/")) {
    url.searchParams.set("next", nextPath);
  }

  return url.toString();
}
