import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lib/generated/**",
  ]),
  ...nextVitals,
  ...nextTs,
  // Wyłącza reguły formatujące kolidujące z Prettierem — musi być na końcu.
  prettier,
]);

export default eslintConfig;
