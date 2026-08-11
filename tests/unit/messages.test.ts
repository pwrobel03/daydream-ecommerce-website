import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import pl from "@/messages/pl.json";

type Messages = { [key: string]: string | Messages };

function flatten(obj: Messages, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === "string"
      ? [`${prefix}${key}`]
      : flatten(value, `${prefix}${key}.`)
  );
}

function resolve(messages: Messages, path: string): string | Messages | undefined {
  return path.split(".").reduce<string | Messages | undefined>(
    (acc, part) =>
      acc && typeof acc === "object" ? (acc as Messages)[part] : undefined,
    messages
  );
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return full.endsWith(".tsx") || full.endsWith(".ts") ? [full] : [];
  });
}

describe("translation catalogues", () => {
  it("define exactly the same keys in every language", () => {
    // Rozjazd kluczy objawia się dopiero w interfejsie, jako surowy klucz
    // zamiast tekstu — i tylko w jednym języku, więc łatwo go przeoczyć.
    const enKeys = flatten(en as Messages).sort();
    const plKeys = flatten(pl as Messages).sort();

    expect(plKeys).toEqual(enKeys);
  });

  it("resolve every key referenced in the code to a string", () => {
    // Namespace i klucz są w kodzie dwoma osobnymi stringami, więc pomyłka
    // w którymkolwiek daje w interfejsie surowy klucz. TypeScript tego nie widzi.
    //
    // Samo istnienie ścieżki nie wystarczy: `dashboard.orders` istniało jako
    // obiekt, więc sprawdzenie „!== undefined" przepuszczało `t("orders")`
    // w sidebarze, a next-intl rzucał INSUFFICIENT_PATH i renderował surowy
    // klucz w nawigacji każdego zalogowanego użytkownika.
    const missing: string[] = [];

    for (const file of [...sourceFiles("app"), ...sourceFiles("components")]) {
      const source = readFileSync(file, "utf8");
      const ns = source.match(/(?:useTranslations|getTranslations)\("([^"]+)"\)/);
      if (!ns) continue;

      for (const [, key] of source.matchAll(/\bt\("([^"]+)"/g)) {
        const full = `${ns[1]}.${key}`;
        if (typeof resolve(en as Messages, full) !== "string") {
          missing.push(`${file}: ${full}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
