import { describe, it, expect } from "vitest";
import {
  TRANSPORT_KG,
  MEALS_KG,
  dailyEmissionsKg,
  monthlyToDaily,
  ecosystemDelta,
  baselineHealth,
  nudgeHealth,
  orbState,
  ecosystemStage,
  clamp01,
} from "@/lib/carbon";

describe("carbon: lookup tables", () => {
  it("orders transport by impact (walk < transit < car < long_drive < flight)", () => {
    expect(TRANSPORT_KG.walk_bike).toBeLessThan(TRANSPORT_KG.transit);
    expect(TRANSPORT_KG.transit).toBeLessThan(TRANSPORT_KG.car);
    expect(TRANSPORT_KG.car).toBeLessThan(TRANSPORT_KG.long_drive);
    expect(TRANSPORT_KG.long_drive).toBeLessThan(TRANSPORT_KG.flight);
  });
  it("orders meals by impact (plant < mixed < meat)", () => {
    expect(MEALS_KG.plant_based).toBeLessThan(MEALS_KG.mixed);
    expect(MEALS_KG.mixed).toBeLessThan(MEALS_KG.meat_heavy);
  });
});

describe("carbon: dailyEmissionsKg", () => {
  it("computes a low-impact day correctly", () => {
    const kg = dailyEmissionsKg({
      transport: "walk_bike",
      meals: "plant_based",
      energy_mindful: true,
      water_mindful: true,
      waste_mindful: true,
    });
    // 0 + 1.7 - 0.6 - 0.2 - 0.3 = 0.6
    expect(kg).toBeCloseTo(0.6, 2);
  });

  it("computes a high-impact day correctly", () => {
    const kg = dailyEmissionsKg({
      transport: "flight",
      meals: "meat_heavy",
      energy_mindful: false,
      water_mindful: false,
      waste_mindful: false,
    });
    // 90 + 6.1 + 0.4 + 0.1 + 0.2 = 96.8
    expect(kg).toBeCloseTo(96.8, 2);
  });

  it("never returns a negative footprint (mindful flags can't push below 0)", () => {
    const kg = dailyEmissionsKg({
      transport: "walk_bike",
      meals: "plant_based",
      energy_mindful: true,
      water_mindful: true,
      waste_mindful: true,
    });
    expect(kg).toBeGreaterThanOrEqual(0);
  });

  it("mindful flags strictly reduce footprint vs the same choices without them", () => {
    const base = {
      transport: "car" as const,
      meals: "mixed" as const,
      energy_mindful: false,
      water_mindful: false,
      waste_mindful: false,
    };
    const mindful = { ...base, energy_mindful: true, water_mindful: true, waste_mindful: true };
    expect(dailyEmissionsKg(mindful)).toBeLessThan(dailyEmissionsKg(base));
  });

  it("rounds to two decimals", () => {
    const kg = dailyEmissionsKg({
      transport: "transit",
      meals: "mixed",
      energy_mindful: false,
      water_mindful: false,
      waste_mindful: false,
    });
    expect(kg.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
  });
});

describe("carbon: monthlyToDaily", () => {
  it("divides by 30", () => {
    expect(monthlyToDaily(300)).toBeCloseTo(10, 5);
  });
  it.each([null, undefined, 0, -5, NaN, Infinity])("falls back to 15 for invalid %s", (v) => {
    expect(monthlyToDaily(v as number)).toBe(15);
  });
});

describe("carbon: ecosystemDelta", () => {
  it("is positive when today beats baseline", () => {
    // baseline daily = 600/30 = 20; today = 5 → delta = 15
    expect(ecosystemDelta(5, 600)).toBe(15);
  });
  it("is negative when today exceeds baseline", () => {
    expect(ecosystemDelta(30, 600)).toBe(-10);
  });
  it("uses 15 kg/day fallback when baseline is missing", () => {
    expect(ecosystemDelta(10, null)).toBe(5);
  });
});

describe("carbon: baselineHealth", () => {
  it("returns 1 for zero emissions", () => {
    expect(baselineHealth(0)).toBe(1);
  });
  it("returns ~0 for extreme footprints (clamped at ratio 2)", () => {
    expect(baselineHealth(10000)).toBe(0);
  });
  it("returns 0.6 fallback when null", () => {
    expect(baselineHealth(null)).toBe(0.6);
  });
  it("hits 0.5 at the per-capita 5t/yr target (~417 kg/mo)", () => {
    expect(baselineHealth(417)).toBeCloseTo(0.5, 1);
  });
  it("is monotonically decreasing as emissions grow", () => {
    const seq = [0, 100, 250, 417, 700, 1000, 2000];
    const healths = seq.map(baselineHealth);
    for (let i = 1; i < healths.length; i++) {
      expect(healths[i]).toBeLessThanOrEqual(healths[i - 1]);
    }
  });
});

describe("carbon: nudgeHealth", () => {
  it("returns baseline unchanged when delta is null", () => {
    expect(nudgeHealth(0.5, null)).toBe(0.5);
  });
  it("caps the nudge at +0.18", () => {
    expect(nudgeHealth(0.5, 1000)).toBeCloseTo(0.68, 5);
  });
  it("caps the nudge at -0.18", () => {
    expect(nudgeHealth(0.5, -1000)).toBeCloseTo(0.32, 5);
  });
  it("never goes below 0 or above 1", () => {
    expect(nudgeHealth(0.95, 100)).toBeLessThanOrEqual(1);
    expect(nudgeHealth(0.02, -100)).toBeGreaterThanOrEqual(0);
  });
});

describe("carbon: orbState transitions", () => {
  it.each([
    [100, "thriving"],
    [250, "thriving"],
    [251, "balanced"],
    [500, "balanced"],
    [501, "strained"],
    [900, "strained"],
    [901, "critical"],
    [5000, "critical"],
  ])("monthly %s kg → %s", (kg, expected) => {
    expect(orbState(kg as number)).toBe(expected);
  });
  it("defaults to balanced when unknown", () => {
    expect(orbState(null)).toBe("balanced");
    expect(orbState(NaN)).toBe("balanced");
  });
});

describe("carbon: ecosystemStage", () => {
  it.each([
    [0, "barren"],
    [0.1, "barren"],
    [0.25, "recovering"],
    [0.49, "recovering"],
    [0.5, "lush"],
    [0.79, "lush"],
    [0.8, "flourishing"],
    [1, "flourishing"],
  ])("health %s → %s", (h, expected) => {
    expect(ecosystemStage(h as number)).toBe(expected);
  });
  it("clamps out-of-range health values", () => {
    expect(ecosystemStage(-1)).toBe("barren");
    expect(ecosystemStage(2)).toBe("flourishing");
  });
});

describe("carbon: clamp01", () => {
  it("clamps to [0,1]", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(2)).toBe(1);
  });
  it("handles NaN", () => {
    expect(clamp01(NaN)).toBe(0);
  });
});
