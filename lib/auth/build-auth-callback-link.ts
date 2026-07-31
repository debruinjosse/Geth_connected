type GenerateLinkProperties = {
  action_link?: string | null;
  hashed_token?: string | null;
  verification_type?: string | null;
};

export function buildAuthCallbackEmailLink(properties: GenerateLinkProperties, redirectTo: string, fallbackType: string) {
  const hashedToken = properties.hashed_token?.trim();
  if (hashedToken) {
    const callbackUrl = new URL(redirectTo);
    callbackUrl.searchParams.set("token_hash", hashedToken);
    callbackUrl.searchParams.set("type", properties.verification_type?.trim() || fallbackType);
    return callbackUrl.toString();
  }

  const fallback = properties.action_link?.trim();
  if (!fallback) {
    throw new Error("We could not generate an auth link for that email.");
  }

  return fallback;
}
