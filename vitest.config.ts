import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { dedupe: ["react", "react-dom"] },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "json-summary", "lcov"],
    },
  },
});
