import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".mjs",
  ".scss",
  ".ts",
  ".tsx",
]);
const SKIPPED_DIRS = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

const MOJIBAKE_PATTERN =
  /Ã[\u0080-\u00bf]|Â[\u0080-\u00bf]|Ä[\u0080-\u00bf]|Å[\u0080-\u00bf]|Æ[\u0080-\u00bf]|Ð[\u0080-\u00bf]|ð[\u0080-\u00bf]|â[\u0080-\u00bf]|á[º»]|Ă[\u00a0-\u00bf]|[\u0080-\u009f]|\uFFFD/g;

function collectTextFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIPPED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTextFiles(fullPath));
      continue;
    }

    if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

describe("source encoding", () => {
  it("does not contain mojibake text in source files", () => {
    const hits = collectTextFiles(ROOT).flatMap((filePath) => {
      const content = readFileSync(filePath, "utf8");
      const matches = Array.from(content.matchAll(MOJIBAKE_PATTERN));

      return matches.map((match) => {
        const line = content.slice(0, match.index).split(/\r?\n/).length;
        return `${path.relative(ROOT, filePath)}:${line}:${match[0]}`;
      });
    });

    expect(hits).toEqual([]);
  });
});
