import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { UPLOAD_URL_PREFIX, resolveUploadPath } from "@/lib/uploads";

// Pliki wgrane przez panel leżą poza `public/`, więc Next nie serwuje ich
// statycznie — ten handler jest ich jedyną drogą na zewnątrz.
const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const url = `${UPLOAD_URL_PREFIX}/${segments.join("/")}`;

  // resolveUploadPath odrzuca wszystko, co wychodzi poza katalog uploadu.
  const filePath = resolveUploadPath(url);
  if (!filePath) return new NextResponse("Not found", { status: 404 });

  let size: number;
  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) return new NextResponse("Not found", { status: 404 });
    size = stats.size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return new NextResponse("Unsupported media type", { status: 415 });

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(size),
      // Nazwy plików to UUID-y, więc treść pod danym URL-em nigdy się nie zmienia.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
