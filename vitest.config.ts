import { defineConfig } from "vitest/config";
import path from "path";
import { testEnv } from "./tests/test-env";

export default defineConfig({
  test: {
    environment: "node",
    // Testy integracyjne wymagają Dockera (Testcontainers) i są uruchamiane
    // osobnym skryptem, żeby `npm test` zostało szybkie i bezwarunkowe.
    include: ["tests/unit/**/*.test.ts"],
    env: { ...testEnv, DATABASE_URL: "postgresql://unused:unused@localhost:5432/unused" },
    coverage: {
      provider: "v8",
      include: ["store.ts", "lib/**/*.ts"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
