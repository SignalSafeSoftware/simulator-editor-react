import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { dedupe: ["react", "react-dom"] },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      thresholds: { statements: 90, branches: 80, functions: 85, lines: 90 },
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "json-summary", "lcov"],
    },
  },
});
