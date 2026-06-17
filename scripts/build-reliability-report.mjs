#!/usr/bin/env node
/**
 * Reads vitest JSON output + coverage summary, and writes
 * src/data/test-report.json for the System Reliability page.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const VITEST_JSON = resolve(ROOT, "vitest-results.json");
const COVERAGE_JSON = resolve(ROOT, "coverage/coverage-summary.json");
const OUT = resolve(ROOT, "src/data/test-report.json");

function safeRead(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

const vitest = safeRead(VITEST_JSON);
const coverage = safeRead(COVERAGE_JSON);

const passed = vitest?.numPassedTests ?? 0;
const failed = vitest?.numFailedTests ?? 0;
const total = vitest?.numTotalTests ?? passed + failed;
const suites = vitest?.numTotalTestSuites ?? vitest?.testResults?.length ?? 0;

const total_coverage = coverage?.total ?? {};
const overall = {
  lines: total_coverage.lines?.pct ?? 0,
  statements: total_coverage.statements?.pct ?? 0,
  functions: total_coverage.functions?.pct ?? 0,
  branches: total_coverage.branches?.pct ?? 0,
};

const businessModules = [
  "src/lib/carbon.ts",
  "src/lib/recommendations.ts",
  "src/lib/dashboard-state.ts",
  "src/lib/auth-guard.ts",
  "src/lib/profile.ts",
  "src/lib/utils.ts",
];

const modules = businessModules.map((path) => {
  const key = Object.keys(coverage ?? {}).find((k) => k.endsWith(path));
  const m = key ? coverage[key] : null;
  return {
    path,
    lines: m?.lines?.pct ?? 0,
    functions: m?.functions?.pct ?? 0,
    branches: m?.branches?.pct ?? 0,
    covered: !!m,
  };
});

const businessAvg =
  modules.reduce((acc, m) => acc + m.lines, 0) / Math.max(modules.length, 1);

const report = {
  generatedAt: new Date().toISOString(),
  totals: { passed, failed, total, suites },
  overallCoverage: overall,
  businessLogicCoverage: Number(businessAvg.toFixed(2)),
  modules,
  thresholds: {
    overallLines: 70,
    businessLogicLines: 80,
  },
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(report, null, 2) + "\n");
console.log(
  `[reliability] wrote ${OUT}: ${passed}/${total} tests, ${overall.lines}% lines, ${report.businessLogicCoverage}% business.`,
);

if (!existsSync(VITEST_JSON)) {
  console.warn("[reliability] WARNING: vitest-results.json missing — totals are zero.");
}
if (!existsSync(COVERAGE_JSON)) {
  console.warn("[reliability] WARNING: coverage-summary.json missing — coverage is zero.");
}
