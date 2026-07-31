type GenerateLinkProperties = {
  action_link?: string | null;
  hashed_token?: string | null;
  verification_type?: string | null;
};

/**
 * Build a link for auth emails. Prefer a direct app callback URL (token_hash).
 * If only Supabase verify URL exists, force redirect_to to the app callback (PKCE).
 */
export function buildAuthCallbackEmailLink(properties: GenerateLinkProperties, redirectTo: string, fallbackType: string) {
  const verificationType = properties.verification_type?.trim() || fallbackType;
  const hashedToken = properties.hashed_token?.trim();

  if (hashedToken) {
    const callbackUrl = new URL(redirectTo);
    callbackUrl.searchParams.set("token_hash", hashedToken);
    callbackUrl.searchParams.set("type", verificationType);
    return callbackUrl.toString();
  }

  const actionLink = properties.action_link?.trim();
  if (actionLink) {
    const verifyUrl = new URL(actionLink);
    verifyUrl.searchParams.set("redirect_to", redirectTo);
    return verifyUrl.toString();
  }

  throw new Error("We could not generate an auth link for that email.");
}
