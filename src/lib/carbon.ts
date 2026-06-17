/**
 * Pure carbon-accounting helpers used by the reflection server function,
 * the dashboard, and the test suite. Keep this module free of imports
 * from React, Supabase, or any environment so it stays unit-testable.
 */

export type Transport = "walk_bike" | "transit" | "car" | "long_drive" | "flight";
export type Meals = "plant_based" | "mixed" | "meat_heavy";
export type OrbState = "thriving" | "balanced" | "strained" | "critical";

/** Illustrative per-day kg CO2 by transport choice. */
export const TRANSPORT_KG: Record<Transport, number> = {
  walk_bike: 0,
  transit: 1.2,
  car: 4.6,
  long_drive: 11,
  flight: 90,
};

/** Illustrative per-day kg CO2 by meal pattern. */
export const MEALS_KG: Record<Meals, number> = {
  plant_based: 1.7,
  mixed: 3.2,
  meat_heavy: 6.1,
};

export interface DailyChoices {
  transport: Transport;
  meals: Meals;
  energy_mindful: boolean;
  water_mindful: boolean;
  waste_mindful: boolean;
}

/**
 * Estimate today's footprint in kg CO2 from a set of choices.
 * Mindful flags trim emissions; non-mindful flags add a small penalty.
 */
export function dailyEmissionsKg(choices: DailyChoices): number {
  const energy = choices.energy_mindful ? -0.6 : 0.4;
  const water = choices.water_mindful ? -0.2 : 0.1;
  const waste = choices.waste_mindful ? -0.3 : 0.2;
  const total =
    TRANSPORT_KG[choices.transport] + MEALS_KG[choices.meals] + energy + water + waste;
  // Footprint can never go below zero.
  return Math.max(0, Number(total.toFixed(2)));
}

/** Convert a monthly baseline (kg) into a daily baseline (kg). */
export function monthlyToDaily(monthlyKg: number | null | undefined): number {
  if (monthlyKg == null || !Number.isFinite(monthlyKg) || monthlyKg <= 0) return 15;
  return monthlyKg / 30;
}

/**
 * Positive delta = better than baseline (CO2 spared today).
 * Negative delta = over baseline.
 */
export function ecosystemDelta(
  todayKg: number,
  monthlyBaselineKg: number | null | undefined,
): number {
  const baselineDaily = monthlyToDaily(monthlyBaselineKg);
  return Number((baselineDaily - todayKg).toFixed(2));
}

/**
 * Map a monthly footprint to a 0..1 ecosystem health value.
 * 417 kg/month ≈ 5 t/yr per-capita target.
 */
export function baselineHealth(monthlyKg: number | null | undefined): number {
  if (monthlyKg == null || !Number.isFinite(monthlyKg)) return 0.6;
  if (monthlyKg <= 0) return 1;
  const ratio = Math.min(monthlyKg / 417, 2);
  return clamp01(1 - ratio / 2);
}

/**
 * Apply today's delta as a small nudge on top of baseline health.
 * Capped so a single day cannot overwhelm long-term context.
 */
export function nudgeHealth(baseline: number, todayDelta: number | null): number {
  if (todayDelta == null) return baseline;
  const nudge = Math.max(-0.18, Math.min(0.18, todayDelta / 30));
  return clamp01(baseline + nudge);
}

/** Categorize a monthly footprint into an orb-state band. */
export function orbState(monthlyKg: number | null | undefined): OrbState {
  if (monthlyKg == null || !Number.isFinite(monthlyKg)) return "balanced";
  if (monthlyKg <= 250) return "thriving";
  if (monthlyKg <= 500) return "balanced";
  if (monthlyKg <= 900) return "strained";
  return "critical";
}

/** Map a 0..1 health value to a discrete ecosystem stage. */
export type EcosystemStage = "barren" | "recovering" | "lush" | "flourishing";
export function ecosystemStage(health: number): EcosystemStage {
  const h = clamp01(health);
  if (h < 0.25) return "barren";
  if (h < 0.5) return "recovering";
  if (h < 0.8) return "lush";
  return "flourishing";
}

export function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(1, v));
}
