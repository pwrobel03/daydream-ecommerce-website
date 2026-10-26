// Usage: tsx tests/screenshots/compare.ts <before-dir> <after-dir> <out-dir> <repo> <pr> <sha>
// Writes changed before/after images to <out-dir> and the PR comment to <out-dir>/comment.md.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const [beforeDir, afterDir, outDir, repo, pr, sha] = process.argv.slice(2);
const MARKER = "<!-- screenshots -->";

const read = (dir: string, file: string) => PNG.sync.read(readFileSync(path.join(dir, file)));

function differs(file: string) {
  const a = read(beforeDir, file);
  const b = read(afterDir, file);
  if (a.width !== b.width || a.height !== b.height) return true;
  return pixelmatch(a.data, b.data, undefined, a.width, a.height, { threshold: 0.1 }) > 0;
}

const files = readdirSync(afterDir).filter((f) => f.endsWith(".png")).sort();
const baseFiles = new Set(readdirSync(beforeDir));
const changed: string[] = [];
const unchanged: string[] = [];
for (const file of files) (!baseFiles.has(file) || differs(file) ? changed : unchanged).push(file);

mkdirSync(outDir, { recursive: true });
const url = (kind: string, file: string) =>
  `https://raw.githubusercontent.com/${repo}/screenshots/pr-${pr}/${kind}-${file}?v=${sha}`;
const label = (file: string) => {
  const [, name, size] = /^(.*)-(desktop|mobile)\.png$/.exec(file)!;
  return { name, size };
};

const lines = [MARKER, "### Screenshots", ""];
if (changed.length === 0) {
  lines.push("No visual changes in the captured pages.");
} else {
  lines.push("| Page | Size | Before | After |", "| --- | --- | --- | --- |");
  for (const file of changed) {
    const { name, size } = label(file);
    const before = baseFiles.has(file);
    if (before) copyFileSync(path.join(beforeDir, file), path.join(outDir, `before-${file}`));
    copyFileSync(path.join(afterDir, file), path.join(outDir, `after-${file}`));
    const cell = (kind: string, ok: boolean) => (ok ? `<img src="${url(kind, file)}" width="${size === "mobile" ? 160 : 320}">` : "–");
    lines.push(`| ${name} | ${size} | ${cell("before", before)} | ${cell("after", true)} |`);
  }
}
if (unchanged.length > 0) {
  const names = unchanged.map((f) => { const { name, size } = label(f); return `${name} (${size})`; });
  lines.push("", "<details>", `<summary>Unchanged pages (${unchanged.length})</summary>`, "", names.join(", "), "", "</details>");
}
lines.push("", `Made from ${sha.slice(0, 7)}.`);
writeFileSync(path.join(outDir, "comment.md"), lines.join("\n") + "\n");
console.log(`${changed.length} changed, ${unchanged.length} unchanged`);
