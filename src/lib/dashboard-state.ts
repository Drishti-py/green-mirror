/**
 * Pure dashboard-data-processing helpers extracted so the reducer-style
 * logic that turns raw DB rows into UI-ready state is testable without
 * mounting React or talking to Supabase.
 */

import { baselineHealth, ecosystemDelta, nudgeHealth, ecosystemStage } from "./carbon";
import { toDisplayProfile, type ProfileRow, type DisplayProfile } from "./profile";

export interface OnboardingRow {
  baseline_kg_co2_per_month?: number | null;
  diet?: string | null;
  transport?: string | null;
  energy_source?: string | null;
  home_type?: string | null;
  household_size?: number | null;
  climate_goal?: string | null;
}

export interface ReflectionRow {
  estimated_kg_co2_today?: number | null;
  ecosystem_delta?: number | null;
}

export interface StreakRow {
  current_streak?: number | null;
  longest_streak?: number | null;
  total_reflections?: number | null;
}

export interface DashboardState {
  profile: DisplayProfile | null;
  monthlyKg: number | null;
  baselineHealth: number;
  todayDelta: number | null;
  liveHealth: number;
  stage: ReturnType<typeof ecosystemStage>;
  streak: { current: number; longest: number; total: number };
  needsOnboarding: boolean;
}

export function buildDashboardState(input: {
  profile: ProfileRow | null;
  onboarding: OnboardingRow | null;
  reflection: ReflectionRow | null;
  streak: StreakRow | null;
}): DashboardState {
  const profile = toDisplayProfile(input.profile);
  const monthlyKg = input.onboarding?.baseline_kg_co2_per_month ?? null;
  const base = baselineHealth(monthlyKg);
  const todayDelta =
    input.reflection?.ecosystem_delta != null
      ? Number(input.reflection.ecosystem_delta)
      : input.reflection?.estimated_kg_co2_today != null
        ? ecosystemDelta(Number(input.reflection.estimated_kg_co2_today), monthlyKg)
        : null;
  const liveHealth = nudgeHealth(base, todayDelta);

  return {
    profile,
    monthlyKg,
    baselineHealth: base,
    todayDelta,
    liveHealth,
    stage: ecosystemStage(liveHealth),
    streak: {
      current: input.streak?.current_streak ?? 0,
      longest: input.streak?.longest_streak ?? 0,
      total: input.streak?.total_reflections ?? 0,
    },
    needsOnboarding: !!input.profile && !input.profile.onboarding_completed,
  };
}
