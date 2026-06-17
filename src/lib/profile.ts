/**
 * Pure helpers for working with user profile rows. Kept free of
 * Supabase imports so the test suite can validate normalization
 * and display logic in isolation.
 */

export interface ProfileRow {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  onboarding_completed?: boolean | null;
  locale?: string | null;
  timezone?: string | null;
}

/** Public-safe view of a profile, with sensible defaults applied. */
export interface DisplayProfile {
  id: string;
  displayName: string;
  firstName: string;
  initials: string;
  avatarUrl: string | null;
  locale: string;
  onboardingCompleted: boolean;
}

export function toDisplayProfile(row: ProfileRow | null | undefined): DisplayProfile | null {
  if (!row || !row.id) return null;
  const displayName = (row.display_name ?? "Friend").trim() || "Friend";
  const firstName = displayName.split(/\s+/)[0];
  return {
    id: row.id,
    displayName,
    firstName,
    initials: computeInitials(displayName),
    avatarUrl: row.avatar_url?.trim() ? row.avatar_url : null,
    locale: row.locale ?? "en",
    onboardingCompleted: !!row.onboarding_completed,
  };
}

export function computeInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/** Reject obviously invalid profile updates before they hit the DB. */
export function validateProfileUpdate(
  patch: Partial<Pick<ProfileRow, "display_name" | "avatar_url" | "locale">>,
): { ok: true; patch: typeof patch } | { ok: false; error: string } {
  if (patch.display_name !== undefined) {
    const v = (patch.display_name ?? "").trim();
    if (v.length === 0) return { ok: false, error: "Display name cannot be empty" };
    if (v.length > 80) return { ok: false, error: "Display name is too long" };
    patch.display_name = v;
  }
  if (patch.avatar_url !== undefined && patch.avatar_url) {
    try {
      const url = new URL(patch.avatar_url);
      if (!/^https?:$/.test(url.protocol)) {
        return { ok: false, error: "Avatar URL must use http(s)" };
      }
    } catch {
      return { ok: false, error: "Avatar URL is malformed" };
    }
  }
  if (patch.locale !== undefined && patch.locale && !/^[a-z]{2}(-[A-Z]{2})?$/.test(patch.locale)) {
    return { ok: false, error: "Locale must look like 'en' or 'en-US'" };
  }
  return { ok: true, patch };
}
