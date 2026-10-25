import { defineConfig } from "vitest/config";
import path from "path";
import { testEnv } from "./tests/test-env";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    // Kontener startuje raz; testy dzielą bazę, więc muszą iść po kolei.
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 180_000,
    env: testEnv,
    // next-auth importuje "next/server" bez rozszerzenia, czego Node w trybie ESM
    // nie rozwiązuje; przepuszczenie paczki przez Vite to naprawia.
    server: { deps: { inline: ["next-auth"] } },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./") },
  },
});
