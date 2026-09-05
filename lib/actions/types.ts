/**
 * Shared result types for Next.js Server Actions under `app/actions/`.
 *
 * Naming convention used across `app/actions/`:
 * - Functions suffixed `...Action` (e.g. `updateOwnProfileNameAction`) are bound directly to
 *   `<form action={fn}>` (optionally via `useActionState`). They receive `FormData`, and on
 *   failure they typically `redirect()` back to the calling page with a `?status=` query param
 *   rather than returning a value — this is the Next.js progressive-enhancement form pattern.
 * - Functions without the `Action` suffix (e.g. `claimRecognition`, `requestMagicLinkEmail`) are
 *   called programmatically from a client component (`await fn(...)`), not bound to a form. These
 *   return one of the shapes below so the caller can branch on `result.ok`.
 *
 * Both conventions are intentional, not inconsistent — don't unify them into one shape.
 */

/**
 * Result of a programmatic Server Action that returns success data on success and a
 * human-readable error (plus an optional machine-readable code for callers that branch on
 * specific failure reasons) on failure. Omit `TSuccess` for actions whose success case carries
 * no extra data beyond `{ ok: true }`.
 */
export type ActionResult<TSuccess = void> =
  | (TSuccess extends void ? { ok: true } : { ok: true } & TSuccess)
  | { ok: false; error: string; code?: string };

/**
 * Result of a programmatic Server Action that reports a single human-readable outcome message
 * regardless of whether it succeeded or failed (the message is shown to the user either way).
 */
export type ActionOutcome = {
  ok: boolean;
  message: string;
};
