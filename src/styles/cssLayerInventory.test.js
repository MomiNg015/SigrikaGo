import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CSS_LAYER_GROUPS,
  CSS_PROTECTED_SURFACES,
  CSS_REFACTOR_ROUNDS,
  CSS_ROUND3_SHARED_SPLITS,
  CSS_ROUND4_REGRESSION_CHECKS,
  inventoryFilesForGroup
} from "./cssLayerInventory.js";

const stylesDir = dirname(fileURLToPath(new URL("./base.css", import.meta.url)));
const rootStylesPath = fileURLToPath(new URL("../styles.css", import.meta.url));

function cssImports(source) {
  return [...source.matchAll(/@import\s+"([^"]+)"[^;]*;/g)].map((match) => match[1]);
}

function cssSourceFor(files) {
  return files.map((filePath) => readFileSync(join(stylesDir, filePath), "utf8")).join("\n");
}

function concreteCssAfterImports(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@import\s+"[^"]+"[^;]*;\s*/g, "")
    .trim();
}

describe("CSS layer inventory", () => {
  it("keeps every inventory file pointed at an existing CSS file", () => {
    const inventoryFiles = new Set([
      ...CSS_LAYER_GROUPS.flatMap((group) => group.entries),
      ...CSS_PROTECTED_SURFACES.flatMap((surface) => surface.files)
    ]);
    const missingFiles = [...inventoryFiles].filter((filePath) => !existsSync(join(stylesDir, filePath)));

    expect(missingFiles).toEqual([]);
  });

  it("classifies every root stylesheet import into a refactor layer", () => {
    const rootImports = cssImports(readFileSync(rootStylesPath, "utf8"))
      .map((importPath) => importPath.replace("./styles/", ""));
    const classifiedRootEntries = new Set(CSS_LAYER_GROUPS.flatMap((group) => group.rootEntries));

    expect(rootImports.filter((importPath) => !classifiedRootEntries.has(importPath))).toEqual([]);
  });

  it("keeps the round-3 cleanup candidates out of gameplay and skill protected files", () => {
    const round3Candidates = new Set(inventoryFilesForGroup("reorganizable-shared-domains"));
    const protectedFiles = new Set([
      ...inventoryFilesForGroup("high-risk-gameplay-room"),
      ...inventoryFilesForGroup("skill-presentation-protected"),
      ...CSS_PROTECTED_SURFACES.flatMap((surface) => surface.files)
    ]);

    expect([...round3Candidates].filter((filePath) => protectedFiles.has(filePath))).toEqual([]);
    expect(round3Candidates.has("room.css")).toBe(false);
    expect(round3Candidates.has("mobile-room.css")).toBe(false);
    expect(round3Candidates.has("room-terminal.css")).toBe(false);
  });

  it("documents the required refactor rounds before visual cleanup", () => {
    expect(CSS_REFACTOR_ROUNDS.map((round) => round.round)).toEqual([2, 3, 4]);
    expect(CSS_REFACTOR_ROUNDS[0].focus).toContain("Inventory");
    expect(CSS_REFACTOR_ROUNDS[1].allowedWork).toContain("split import-only shared domains");
    expect(CSS_REFACTOR_ROUNDS[2].allowedWork).toContain("board skill presentation verification");
  });

  it("documents the round-4 desktop, mobile, and skill regression gates", () => {
    const commands = CSS_ROUND4_REGRESSION_CHECKS.map((check) => check.command).join("\n");
    const coverage = CSS_ROUND4_REGRESSION_CHECKS.flatMap((check) => check.coverage).join("\n");

    expect(commands).toContain("src/styles/cssLayerInventory.test.js");
    expect(commands).toContain("npm run verify:battle-fixes");
    expect(commands).toContain("npm run verify:stability -- tests/stability/skill-effects.spec.js");
    expect(coverage).toContain("desktop Chromium");
    expect(coverage).toContain("mobile Chromium");
    expect(coverage).toContain("Pixi");
    expect(coverage).toContain("skill SFX");
  });

  it("keeps round-3 shared splits import-only and in the low-risk inventory bucket", () => {
    const round3Candidates = new Set(inventoryFilesForGroup("reorganizable-shared-domains"));
    const protectedFiles = new Set([
      ...inventoryFilesForGroup("high-risk-gameplay-room"),
      ...inventoryFilesForGroup("skill-presentation-protected"),
      ...CSS_PROTECTED_SURFACES.flatMap((surface) => surface.files)
    ]);

    for (const split of CSS_ROUND3_SHARED_SPLITS) {
      const entrySource = readFileSync(join(stylesDir, split.entry), "utf8");
      const expectedImports = split.files.map((filePath) => {
        const [, ...nestedPath] = filePath.split("/");
        const entryDirectory = split.entry.split("/").slice(0, -1);
        const relativeParts = nestedPath.slice(entryDirectory.length - 1);

        return `./${relativeParts.join("/")}`;
      });

      expect(cssImports(entrySource)).toEqual(expectedImports);
      expect(concreteCssAfterImports(entrySource)).toBe("");
      expect(round3Candidates.has(split.entry)).toBe(true);

      for (const filePath of split.files) {
        expect(round3Candidates.has(filePath)).toBe(true);
        expect(protectedFiles.has(filePath)).toBe(false);
      }
    }
  });

  it("keeps protected surface contracts backed by current CSS fragments", () => {
    const missingFragments = CSS_PROTECTED_SURFACES.flatMap((surface) => {
      const source = cssSourceFor(surface.files);

      return surface.requiredFragments
        .filter((fragment) => !source.includes(fragment))
        .map((fragment) => `${surface.id}: ${fragment}`);
    });

    expect(missingFragments).toEqual([]);
  });
});
