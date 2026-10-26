import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ENV_KEYS } from "@/lib/env";

describe("environment reference", () => {
  it.each(["en", "pl"])("docs/%s/environment.md lists every key of the env schema", (lang) => {
    const doc = readFileSync(`docs/${lang}/environment.md`, "utf8");
    const missing = ENV_KEYS.filter((key) => !doc.includes(`\`${key}\``));
    expect(missing).toEqual([]);
  });
});
