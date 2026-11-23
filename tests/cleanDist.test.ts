// @vitest-environment node
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it, vi } from "vitest";

function snapshot(directory: string): Record<string, string> {
  const files: Record<string, string> = {};
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [name, hash] of Object.entries(snapshot(path))) {
        files[join(entry.name, name)] = hash;
      }
    } else {
      files[entry.name] = createHash("sha256").update(readFileSync(path)).digest("hex");
    }
  }
  return files;
}

it("removes obsolete runtime/declaration trees and tolerates an already clean output", async () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const dist = join(root, "dist");
  // A same-filesystem rename preserves the exact existing build, including file metadata.
  const backup = mkdtempSync(join(root, ".clean-dist-test-"));
  const saved = join(backup, "dist");
  const original = existsSync(dist) ? snapshot(dist) : undefined;
  try {
    if (original !== undefined) renameSync(dist, saved);
    mkdirSync(join(dist, "obsolete/nested"), { recursive: true });
    writeFileSync(join(dist, "retired.js"), "export const obsolete = true;\n");
    writeFileSync(
      join(dist, "obsolete/nested/retired.d.ts"),
      "export declare const obsolete: true;\n",
    );
    const cleanup = new URL("../scripts/clean-dist.mjs", import.meta.url).href;
    vi.resetModules();
    await import(cleanup);
    expect(existsSync(dist)).toBe(false);
    vi.resetModules();
    await import(cleanup);
    expect(existsSync(dist)).toBe(false);
  } finally {
    rmSync(dist, { recursive: true, force: true });
    if (original !== undefined) renameSync(saved, dist);
    rmSync(backup, { recursive: true, force: true });
    expect(existsSync(dist)).toBe(original !== undefined);
    if (original !== undefined) expect(snapshot(dist)).toEqual(original);
  }
});
