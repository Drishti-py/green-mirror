import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/carbon.ts",
        "src/lib/recommendations.ts",
        "src/lib/auth-guard.ts",
        "src/lib/profile.ts",
        "src/lib/utils.ts",
        "src/components/dashboard/CarbonOrb.tsx",
        "src/components/dashboard/LivingEcosystem.tsx",
        "src/components/dashboard/StreakBadge.tsx",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 60,
      },
    },
  },
});
