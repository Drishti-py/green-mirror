/**
 * Pure helpers describing the auth-gate decision used by the
 * `_authenticated` layout. Extracted so the policy is unit-testable
 * without spinning up the router or Supabase.
 */

export interface SessionLike {
  user: { id: string; email?: string | null } | null;
  error?: { message: string } | null;
}

export type GuardDecision =
  | { kind: "allow"; userId: string }
  | { kind: "redirect"; to: "/auth"; reason: "no-session" | "auth-error" };

export function decideAuthGuard(session: SessionLike | null): GuardDecision {
  if (!session || session.error) {
    return { kind: "redirect", to: "/auth", reason: "auth-error" };
  }
  if (!session.user || !session.user.id) {
    return { kind: "redirect", to: "/auth", reason: "no-session" };
  }
  return { kind: "allow", userId: session.user.id };
}

/** Decide where to send a user after they finish (or skip) auth. */
export function postAuthRedirect(onboardingCompleted: boolean | null | undefined): string {
  return onboardingCompleted ? "/dashboard" : "/onboarding";
}
