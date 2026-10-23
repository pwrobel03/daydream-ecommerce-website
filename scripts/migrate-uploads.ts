/**
 * Jednorazowa migracja uploadów sprzed przeniesienia ich poza `public/`.
 *
 * Starsze wersje panelu zapisywały pliki w `public/products`, `public/categories`
 * i `public/ingredients`, a w bazie URL-e w postaci `/products/...`. Katalog
 * `public/` jest częścią obrazu kontenera, więc takie pliki znikały przy każdym
 * odtworzeniu kontenera. Nowe uploady trafiają do `UPLOAD_DIR` i mają prefiks
 * `/uploads`.
 *
 * Skrypt przenosi pliki i przepisuje rekordy. Jest idempotentny — rekordy już
 * przepisane pomija, a brakujący plik zgłasza i zostawia rekord w spokoju,
 * żeby nie wskazywał na nieistniejący zasób.
 *
 * Uruchomienie:  npx tsx scripts/migrate-uploads.ts [--dry-run]
 *
 * Dane demonstracyjne (`/static/...`) leżą w repozytorium i celowo nie są
 * ruszane — nie są uploadem użytkownika.
 */
import { existsSync } from "fs";
import { copyFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const LEGACY_DIRS = ["products", "categories", "ingredients"];
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");
const PUBLIC_ROOT = path.resolve("public");

const dryRun = process.argv.includes("--dry-run");

interface Move {
  url: string;
  nextUrl: string;
  from: string;
  to: string;
}

function planMove(url: string): Move | null {
  if (!url.startsWith("/")) return null;

  const [, first] = url.split("/");
  if (!LEGACY_DIRS.includes(first)) return null;

  const relative = url.slice(1);
  return {
    url,
    nextUrl: `/uploads/${relative}`,
    from: path.join(PUBLIC_ROOT, relative),
    to: path.join(UPLOAD_ROOT, relative),
  };
}

async function apply(move: Move): Promise<boolean> {
  if (!existsSync(move.from)) {
    console.warn(`  ! brak pliku, rekord bez zmian: ${move.from}`);
    return false;
  }

  if (dryRun) return true;

  await mkdir(path.dirname(move.to), { recursive: true });
  // Kopiujemy i dopiero potem kasujemy — przerwanie w połowie zostawia
  // działający stan zamiast pliku, którego nie ma w żadnym z miejsc.
  await copyFile(move.from, move.to);
  await unlink(move.from);
  return true;
}

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  let migrated = 0;
  let skipped = 0;

  const images = await db.productImage.findMany();
  for (const image of images) {
    const move = planMove(image.url);
    if (!move) continue;

    if (await apply(move)) {
      if (!dryRun) {
        await db.productImage.update({
          where: { id: image.id },
          data: { url: move.nextUrl },
        });
      }
      console.log(`  ${move.url} -> ${move.nextUrl}`);
      migrated++;
    } else {
      skipped++;
    }
  }

  // Kategorie i składniki rozpisane osobno: oba mają pole `image`, ale
  // delegaty Prismy nie mają wspólnego typu, po którym dałoby się iterować.
  const withImage = [
    {
      rows: await db.category.findMany(),
      update: (id: string, image: string) =>
        db.category.update({ where: { id }, data: { image } }),
    },
    {
      rows: await db.ingredient.findMany(),
      update: (id: string, image: string) =>
        db.ingredient.update({ where: { id }, data: { image } }),
    },
  ];

  for (const { rows, update } of withImage) {
    for (const row of rows) {
      if (!row.image) continue;

      const move = planMove(row.image);
      if (!move) continue;

      if (await apply(move)) {
        if (!dryRun) await update(row.id, move.nextUrl);
        console.log(`  ${move.url} -> ${move.nextUrl}`);
        migrated++;
      } else {
        skipped++;
      }
    }
  }

  console.log(
    `\n${dryRun ? "[dry-run] " : ""}przeniesione: ${migrated}, pominięte: ${skipped}`
  );
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
