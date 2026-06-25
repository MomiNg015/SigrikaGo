import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import {
  buildCapturePlan,
  buildPendingSkill,
  parseExportArgs,
  playableEffectTypes
} from "./export-skill-gifs.mjs";

describe("skill GIF exporter config", () => {
  test("parses the documented minimal CLI arguments with stable defaults", () => {
    const options = parseExportArgs(["--character", "aemeath", "--effect", "hidden-hand"]);

    expect(options).toMatchObject({
      character: "aemeath",
      effect: "hidden-hand",
      size: 720,
      fps: 30,
      target: "6,6",
      theme: "black"
    });
  });

  test("builds predictable output paths and capture settings", () => {
    const plan = buildCapturePlan(parseExportArgs([
      "--character", "aemeath",
      "--effect", "voyage-star",
      "--output-name", "preview.gif",
      "--size", "512",
      "--fps", "24",
      "--target", "4,8",
      "--theme", "board"
    ]));

    expect(plan).toMatchObject({
      characterId: "aemeath",
      effectType: "voyage-star",
      filename: "preview.gif",
      size: 512,
      fps: 24,
      frameDelayMs: 1000 / 24,
      capturePrepDelayMs: 60000,
      targetId: "4,8",
      theme: "board",
      outputSubdir: "aemeath"
    });
    expect(plan.outputDir.endsWith("outputs\\skill-gifs\\aemeath")
      || plan.outputDir.endsWith("outputs/skill-gifs/aemeath")).toBe(true);
    expect(plan.frameCount).toBeGreaterThan(40);
  });

  test("creates representative pending skill metadata for target and area effects", () => {
    const voyageStar = buildPendingSkill(buildCapturePlan(parseExportArgs([
      "--character", "aemeath",
      "--effect", "voyage-star",
      "--target", "6,6"
    ])));
    const rowSlash = buildPendingSkill(buildCapturePlan(parseExportArgs([
      "--effect", "row-slash",
      "--target", "2,5"
    ])));

    expect(voyageStar).toMatchObject({
      characterId: "aemeath",
      effectType: "voyage-star",
      targetId: "6,6",
      boardEffectDurationMs: 1800
    });
    expect(voyageStar.removedStones.map((stone) => stone.id)).toContain("6,6");
    expect(voyageStar.affectedPointIds).toContain("6,5");

    expect(rowSlash).toMatchObject({
      effectType: "row-slash",
      targetId: "2,5",
      row: 5
    });
    expect(rowSlash.affectedPointIds).toContain("12,5");
  });

  test("lists every documented built-in effect preset", () => {
    expect(playableEffectTypes()).toEqual([
      "double-move",
      "erase-point",
      "flip-stone",
      "hidden-hand",
      "liberty-purge",
      "protocol-takeover",
      "random-blast",
      "row-slash",
      "spray-stone",
      "voyage-star"
    ]);
  });

  test("uses the current board texture behind effect-only captures", () => {
    const source = readFileSync(new URL("./export-skill-gifs.mjs", import.meta.url), "utf8");

    expect(source).toContain('className="skill-gif-effect-host board-wrap"');
    expect(source).toContain("background: var(--board-wood-texture)");
    expect(source).toContain(".skill-gif-black-theme .board-lines");
    expect(source).not.toContain(".skill-gif-black-theme .board-wrap,");
    expect(source).not.toContain("background: #000 !important");
  });

  test("drives capture timing from Playwright virtual time instead of screenshot wall time", () => {
    const source = readFileSync(new URL("./export-skill-gifs.mjs", import.meta.url), "utf8");

    expect(source).toContain("await page.clock.install");
    expect(source).toContain("await page.clock.pauseAt");
    expect(source).toContain("await page.clock.runFor(plan.frameDelayMs)");
    expect(source).toContain("frameDelayMs");
    expect(source).not.toContain("const startedAt = Date.now()");
    expect(source).not.toContain("expectedAt - Date.now()");
  });

  test("reveals the resolved Voyage Star crater behind the full-cover board GIF", () => {
    const source = readFileSync(new URL("./export-skill-gifs.mjs", import.meta.url), "utf8");

    expect(source).toContain("VOYAGE_STAR_WHITEOUT_RESOLUTION_PROGRESS");
    expect(source).toContain("setResolved(false)");
    expect(source).toContain("skillGifResolutionDelayMs(nextPlan.pendingSkill)");
    expect(source).toContain("sourcePendingSkill: displayPendingSkill");
    expect(source).toContain('id === voyageStarCenterId ? "voyage-star-crater-point" : "voyage-star-erased-point"');
    expect(source).toContain('history: resolvedVoyageStar ? [{');
    expect(source).toContain('effectType: "voyage-star"');
  });

  test("reveals the resolved row slash removal behind the ink-blade GIF", () => {
    const source = readFileSync(new URL("./export-skill-gifs.mjs", import.meta.url), "utf8");

    expect(source).toContain('pendingSkill?.effectType === "row-slash"');
    expect(source).toContain("return bannerDurationMs + 760");
    expect(source).toContain("const resolvedRowSlash = plan.resolved && plan.effectType === \"row-slash\"");
    expect(source).toContain("const rowSlashRemoved = rowSlashIds.has(id)");
    expect(source).toContain("voyageStarErased || rowSlashRemoved ? null : stones.get(id) ?? null");
    expect(source).toContain('effectType: "row-slash"');
    expect(source).toContain("rowEffects: resolvedRowSlash");
  });
});
