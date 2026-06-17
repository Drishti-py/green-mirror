import { describe, it, expect } from "vitest";
import { recommendForContext, projectMealsMonthly } from "@/lib/recommendations";

describe("recommendations: recommendForContext", () => {
  it("always returns at least one recommendation", () => {
    expect(recommendForContext({}).length).toBeGreaterThan(0);
  });

  it("includes a transport recommendation for car users", () => {
    const recs = recommendForContext({ transport: "car" });
    expect(recs.some((r) => r.id === "transport-shift")).toBe(true);
  });

  it("flags flights as the highest-impact lever", () => {
    const recs = recommendForContext({ transport: "flight" });
    const flight = recs.find((r) => r.id === "flight-offset");
    expect(flight).toBeDefined();
    expect(flight!.impactKgPerMonth).toBeGreaterThan(100);
  });

  it("suggests plant-forward days for meat-heavy diets", () => {
    const recs = recommendForContext({ diet: "meat_heavy" });
    expect(recs.find((r) => r.id === "diet-plant-days")).toBeDefined();
  });

  it("suggests halving red meat for mixed diets (different rec)", () => {
    const recs = recommendForContext({ diet: "mixed" });
    expect(recs.find((r) => r.id === "diet-cut-beef")).toBeDefined();
    expect(recs.find((r) => r.id === "diet-plant-days")).toBeUndefined();
  });

  it("recognizes fossil/grid energy sources via regex", () => {
    expect(
      recommendForContext({ energy_source: "natural gas" }).find(
        (r) => r.id === "energy-clean-tariff",
      ),
    ).toBeDefined();
    expect(
      recommendForContext({ energy_source: "Coal grid" }).find(
        (r) => r.id === "energy-clean-tariff",
      ),
    ).toBeDefined();
    expect(
      recommendForContext({ energy_source: "100% solar" }).find(
        (r) => r.id === "energy-clean-tariff",
      ),
    ).toBeUndefined();
  });

  it("orders by impact descending in normal mode", () => {
    const recs = recommendForContext({
      transport: "car",
      diet: "mixed",
      energy_source: "gas",
    });
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].impactKgPerMonth).toBeLessThanOrEqual(recs[i - 1].impactKgPerMonth);
    }
  });

  it("prioritizes transport when monthly footprint exceeds 800 kg", () => {
    const recs = recommendForContext({
      transport: "car",
      diet: "mixed",
      monthly_kg: 1200,
    });
    expect(recs[0].category).toBe("transport");
  });

  it("includes the daily habit fallback even with empty context", () => {
    expect(recommendForContext({}).find((r) => r.id === "habit-reflection")).toBeDefined();
  });

  it("is deterministic for identical input", () => {
    const a = recommendForContext({ transport: "car", diet: "mixed" });
    const b = recommendForContext({ transport: "car", diet: "mixed" });
    expect(a).toEqual(b);
  });
});

describe("recommendations: projectMealsMonthly", () => {
  it("scales with diet intensity", () => {
    expect(projectMealsMonthly("plant_based").monthlyKgIfSustained).toBeLessThan(
      projectMealsMonthly("mixed").monthlyKgIfSustained,
    );
    expect(projectMealsMonthly("mixed").monthlyKgIfSustained).toBeLessThan(
      projectMealsMonthly("meat_heavy").monthlyKgIfSustained,
    );
  });
});
