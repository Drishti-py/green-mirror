/**
 * Lightweight, deterministic sustainability suggestion engine used by the
 * coach panel as a graceful fallback when the AI gateway is unavailable
 * and by the test suite to validate recommendation logic.
 */

import type { Transport, Meals } from "./carbon";

export interface ProfileContext {
  diet?: string | null;
  transport?: Transport | string | null;
  energy_source?: string | null;
  home_type?: string | null;
  household_size?: number | null;
  climate_goal?: string | null;
  monthly_kg?: number | null;
}

export interface Recommendation {
  id: string;
  title: string;
  body: string;
  impactKgPerMonth: number;
  category: "transport" | "diet" | "energy" | "home" | "habit";
}

/**
 * Generate ranked sustainability recommendations.
 * Output is deterministic for a given context — required for snapshot tests.
 */
export function recommendForContext(ctx: ProfileContext): Recommendation[] {
  const out: Recommendation[] = [];

  if (ctx.transport === "car" || ctx.transport === "long_drive") {
    out.push({
      id: "transport-shift",
      title: "Swap two car trips a week for transit or cycling",
      body: "The single highest-leverage move in your week.",
      impactKgPerMonth: 38,
      category: "transport",
    });
  }
  if (ctx.transport === "flight") {
    out.push({
      id: "flight-offset",
      title: "Trade one short-haul flight for rail this quarter",
      body: "A single flight can outweigh a year of mindful weeks.",
      impactKgPerMonth: 120,
      category: "transport",
    });
  }

  if (ctx.diet === "meat_heavy" || ctx.diet === "omnivore") {
    out.push({
      id: "diet-plant-days",
      title: "Try three plant-forward dinners a week",
      body: "Beans, lentils, mushrooms. Your gut and the soil both lighten.",
      impactKgPerMonth: 24,
      category: "diet",
    });
  } else if (ctx.diet === "mixed") {
    out.push({
      id: "diet-cut-beef",
      title: "Halve red meat for one month",
      body: "Beef carries the heaviest hoofprint per gram of protein.",
      impactKgPerMonth: 14,
      category: "diet",
    });
  }

  if (ctx.energy_source && /coal|gas|fossil|grid/i.test(ctx.energy_source)) {
    out.push({
      id: "energy-clean-tariff",
      title: "Switch to a certified clean-energy tariff",
      body: "One signup. Months of cleaner kilowatt-hours.",
      impactKgPerMonth: 55,
      category: "energy",
    });
  }

  if (ctx.home_type && /house|detached/i.test(ctx.home_type)) {
    out.push({
      id: "home-thermostat",
      title: "Drop the thermostat by 1°C in winter",
      body: "Sweater on. Boiler down. Your home breathes easier.",
      impactKgPerMonth: 18,
      category: "home",
    });
  }

  // Always provide at least one habit nudge so the panel is never empty.
  out.push({
    id: "habit-reflection",
    title: "Log a reflection every day for a week",
    body: "Awareness is the first carbon-saving habit.",
    impactKgPerMonth: 6,
    category: "habit",
  });

  // High footprint? push transport to the front if not already there.
  if ((ctx.monthly_kg ?? 0) > 800 && out[0]?.category !== "transport") {
    out.sort((a, b) => (a.category === "transport" ? -1 : b.category === "transport" ? 1 : 0));
  } else {
    out.sort((a, b) => b.impactKgPerMonth - a.impactKgPerMonth);
  }

  return out;
}

export interface MealsBreakdown {
  meals: Meals;
  monthlyKgIfSustained: number;
}

/** Project today's meal pattern to a monthly footprint, for trend hints. */
export function projectMealsMonthly(meals: Meals): MealsBreakdown {
  const map: Record<Meals, number> = {
    plant_based: 51,
    mixed: 96,
    meat_heavy: 183,
  };
  return { meals, monthlyKgIfSustained: map[meals] };
}
