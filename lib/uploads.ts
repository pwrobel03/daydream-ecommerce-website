// lib/uploads.ts
import { existsSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { env } from "@/lib/env";
import { reportError } from "@/lib/logger";

// Publiczny prefiks URL-i obsługiwanych przez app/uploads/[...path]/route.ts.
export const UPLOAD_URL_PREFIX = "/uploads";

/**
 * Katalog docelowy uploadu. Leży poza `public/`, bo `public/` jest częścią obrazu
 * kontenera — pliki dopisane tam w runtime znikają przy każdym odtworzeniu
 * kontenera i mieszają dane użytkownika z assetami repozytorium.
 */
const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR);

/**
 * Zamienia publiczny URL na ścieżkę na dysku, odrzucając wszystko, co wychodzi
 * poza katalog uploadu. Bez tej kontroli `../` w URL-u pozwalałby czytać
 * i kasować dowolny plik dostępny dla procesu.
 */
export function resolveUploadPath(url: string): string | null {
  if (!url.startsWith(`${UPLOAD_URL_PREFIX}/`)) return null;

  const relative = url.slice(UPLOAD_URL_PREFIX.length + 1);
  const absolute = path.resolve(UPLOAD_ROOT, relative);

  if (absolute !== UPLOAD_ROOT && !absolute.startsWith(UPLOAD_ROOT + path.sep)) {
    return null;
  }

  return absolute;
}

/** Zapisuje plik w podkatalogu uploadu i zwraca URL do zapisania w bazie. */
export async function saveUpload(
  relativeDir: string,
  fileName: string,
  data: Buffer
): Promise<string> {
  const targetDir = path.resolve(UPLOAD_ROOT, relativeDir);

  if (!targetDir.startsWith(UPLOAD_ROOT)) {
    throw new Error("Upload path escapes the upload directory");
  }

  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  await writeFile(path.join(targetDir, fileName), data);
  return `${UPLOAD_URL_PREFIX}/${relativeDir}/${fileName}`;
}

/**
 * Usuwa plik wskazany przez URL z bazy.
 *
 * Kasuje wyłącznie to, co leży w katalogu uploadu — `resolveUploadPath` zwraca
 * `null` dla czegokolwiek innego. Dane demonstracyjne (`/static/...`) są więc
 * nietykalne: leżą w repozytorium, są współdzielone przez wszystkie instancje
 * i usunięcie produktu nie może ich ruszyć.
 *
 * Wcześniej stała tu druga ścieżka rozpoznająca URL-e sprzed przeniesienia
 * uploadu poza `public/`. Przegląd bazy pokazał, że takich rekordów nie ma
 * (wszystkie 92 wskazują na `/static/`), a nowe instancje startują z pustym
 * katalogiem albo z danymi demo. Gdyby kiedyś pojawił się starszy zrzut,
 * `scripts/migrate-uploads.ts` przepisze go, zanim ta ścieżka byłaby potrzebna.
 */
export async function deleteUpload(url: string): Promise<void> {
  const target = resolveUploadPath(url);

  if (!target || !existsSync(target)) return;

  try {
    await unlink(target);
  } catch (error) {
    reportError(error, { area: "uploads.delete", url });
  }
}

export interface ProcessOptions {
  /** Podkatalog w UPLOAD_DIR, np. "products/<id>" albo "ingredients". */
  dir: string;
  /** Nazwa bez rozszerzenia; wynik zawsze zapisujemy jako .webp. */
  fileName: string;
  width: number;
  height: number;
  /** "inside" zachowuje proporcje, "cover" kadruje do kwadratu. */
  fit?: "inside" | "cover";
  quality?: number;
}

/**
 * Przetwarza wgrany plik przez sharp i zapisuje jako WebP.
 *
 * Wcześniej każda akcja miała własny wariant tego kodu, a upload kategorii
 * nie przechodził przez sharp w ogóle — zapisywał surowy bufor w oryginalnym
 * formacie, więc admin mógł wgrać wielomegabajtowy PNG serwowany bez zmian.
 */
export async function processAndStore(
  file: File,
  { dir, fileName, width, height, fit = "inside", quality = 80 }: ProcessOptions
): Promise<string> {
  const sharp = (await import("sharp")).default;
  const buffer = Buffer.from(await file.arrayBuffer());

  const optimized = await sharp(buffer)
    .resize(width, height, {
      fit,
      ...(fit === "inside" && { withoutEnlargement: true }),
    })
    .webp({ quality })
    .toBuffer();

  return saveUpload(dir, `${fileName}.webp`, optimized);
}
