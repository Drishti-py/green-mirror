import { describe, it, expect } from "vitest";
import { deriveBadges, deriveLevel, ecosystemStatusLabel } from "./achievements";

const base = {
  total_reflections: 0,
  current_streak: 0,
  longest_streak: 0,
  days_active: 0,
  carbon_saved_kg: 0,
  documents_uploaded: 0,
  baseline_kg_per_month: 300,
};

describe("achievements", () => {
  it("starts with no badges earned", () => {
    const badges = deriveBadges(base);
    expect(badges.every((b) => !b.earned)).toBe(true);
    expect(badges[0].progress).toBe(0);
  });

  it("earns First Light after one reflection", () => {
    const badges = deriveBadges({ ...base, total_reflections: 1 });
    expect(badges.find((b) => b.id === "first-reflection")?.earned).toBe(true);
  });

  it("earns Seven Suns at a 7-day streak", () => {
    const badges = deriveBadges({ ...base, longest_streak: 7 });
    expect(badges.find((b) => b.id === "week-streak")?.earned).toBe(true);
    expect(badges.find((b) => b.id === "month-streak")?.earned).toBe(false);
  });

  it("earns carbon-saver tiers with cumulative savings", () => {
    const badges = deriveBadges({ ...base, carbon_saved_kg: 50 });
    expect(badges.find((b) => b.id === "carbon-saver-10")?.earned).toBe(true);
    expect(badges.find((b) => b.id === "carbon-saver-50")?.earned).toBe(true);
  });

  it("clamps progress to 1", () => {
    const badges = deriveBadges({ ...base, longest_streak: 999 });
    const week = badges.find((b) => b.id === "week-streak");
    expect(week?.progress).toBe(1);
  });
});

describe("deriveLevel", () => {
  it("starts as Seedling", () => {
    expect(deriveLevel(base).tier).toBe("Seedling");
    expect(deriveLevel(base).score).toBe(0);
  });

  it("escalates with engagement", () => {
    const lvl = deriveLevel({
      ...base,
      total_reflections: 60,
      longest_streak: 30,
      carbon_saved_kg: 80,
      documents_uploaded: 6,
    });
    expect(lvl.score).toBeGreaterThanOrEqual(80);
    expect(["Forest", "Biosphere"]).toContain(lvl.tier);
  });

  it("caps at Biosphere", () => {
    const lvl = deriveLevel({
      ...base,
      total_reflections: 9999,
      longest_streak: 9999,
      carbon_saved_kg: 9999,
      documents_uploaded: 9999,
    });
    expect(lvl.tier).toBe("Biosphere");
    expect(lvl.next).toBeNull();
    expect(lvl.score).toBeLessThanOrEqual(100);
  });
});

describe("ecosystemStatusLabel", () => {
  it.each([
    [0.95, "Flourishing"],
    [0.7, "Thriving"],
    [0.5, "Steady"],
    [0.3, "Strained"],
    [0.1, "Critical"],
  ])("maps health %s → %s", (h, label) => {
    expect(ecosystemStatusLabel(h).label).toBe(label);
  });
});
