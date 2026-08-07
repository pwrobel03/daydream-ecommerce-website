import path from "path";
import { beforeAll, describe, expect, it } from "vitest";

let resolveUploadPath: typeof import("@/lib/uploads").resolveUploadPath;
let UPLOAD_URL_PREFIX: string;

beforeAll(async () => {
  const mod = await import("@/lib/uploads");
  resolveUploadPath = mod.resolveUploadPath;
  UPLOAD_URL_PREFIX = mod.UPLOAD_URL_PREFIX;
});

describe("resolveUploadPath", () => {
  const root = path.resolve("./storage/uploads-test");

  it("resolves a normal upload url inside the upload directory", () => {
    const resolved = resolveUploadPath(`${UPLOAD_URL_PREFIX}/products/abc/img.webp`);

    expect(resolved).toBe(path.join(root, "products", "abc", "img.webp"));
  });

  it("rejects a url outside the upload prefix", () => {
    expect(resolveUploadPath("/static/products/main.webp")).toBeNull();
    expect(resolveUploadPath("/etc/passwd")).toBeNull();
  });

  it.each([
    "/uploads/../../etc/passwd",
    "/uploads/products/../../../../etc/passwd",
    "/uploads/./../../secret.env",
  ])("rejects traversal attempt %s", (url) => {
    // Handler serwuje i kasuje pliki po tej ścieżce, więc ucieczka poza katalog
    // uploadu oznaczałaby odczyt i usuwanie dowolnego pliku procesu.
    expect(resolveUploadPath(url)).toBeNull();
  });

  it("does not treat a sibling directory with a shared prefix as inside", () => {
    expect(resolveUploadPath("/uploads/../uploads-test-other/x.webp")).toBeNull();
  });
});
