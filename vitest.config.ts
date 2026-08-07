import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    // Testy integracyjne wymagają Dockera (Testcontainers) i są uruchamiane
    // osobnym skryptem, żeby `npm test` zostało szybkie i bezwarunkowe.
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["store.ts", "lib/**/*.ts"],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
