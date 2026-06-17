import { describe, it, expect } from "vitest";
import { buildDashboardState } from "@/lib/dashboard-state";

describe("dashboard-state: buildDashboardState", () => {
  it("returns sensible defaults for an empty backend", () => {
    const s = buildDashboardState({
      profile: null,
      onboarding: null,
      reflection: null,
      streak: null,
    });
    expect(s.profile).toBeNull();
    expect(s.monthlyKg).toBeNull();
    expect(s.baselineHealth).toBe(0.6);
    expect(s.todayDelta).toBeNull();
    expect(s.liveHealth).toBe(0.6);
    expect(s.streak).toEqual({ current: 0, longest: 0, total: 0 });
    expect(s.needsOnboarding).toBe(false);
  });

  it("flags needsOnboarding when profile is incomplete", () => {
    const s = buildDashboardState({
      profile: { id: "u1", display_name: "Ada", onboarding_completed: false },
      onboarding: null,
      reflection: null,
      streak: null,
    });
    expect(s.needsOnboarding).toBe(true);
    expect(s.profile?.firstName).toBe("Ada");
  });

  it("derives health from monthly baseline", () => {
    const s = buildDashboardState({
      profile: { id: "u1", onboarding_completed: true },
      onboarding: { baseline_kg_co2_per_month: 100 },
      reflection: null,
      streak: null,
    });
    expect(s.baselineHealth).toBeGreaterThan(0.8);
    expect(s.stage).toBe("flourishing");
  });

  it("applies today's positive delta as a health nudge", () => {
    const noDelta = buildDashboardState({
      profile: null,
      onboarding: { baseline_kg_co2_per_month: 600 },
      reflection: null,
      streak: null,
    });
    const withDelta = buildDashboardState({
      profile: null,
      onboarding: { baseline_kg_co2_per_month: 600 },
      reflection: { ecosystem_delta: 10 },
      streak: null,
    });
    expect(withDelta.liveHealth).toBeGreaterThan(noDelta.liveHealth);
    expect(withDelta.todayDelta).toBe(10);
  });

  it("computes delta from today's kg when ecosystem_delta is missing", () => {
    const s = buildDashboardState({
      profile: null,
      onboarding: { baseline_kg_co2_per_month: 600 },
      reflection: { estimated_kg_co2_today: 5 },
      streak: null,
    });
    expect(s.todayDelta).toBe(15);
  });

  it("propagates streak counts", () => {
    const s = buildDashboardState({
      profile: null,
      onboarding: null,
      reflection: null,
      streak: { current_streak: 7, longest_streak: 12, total_reflections: 40 },
    });
    expect(s.streak).toEqual({ current: 7, longest: 12, total: 40 });
  });
});
