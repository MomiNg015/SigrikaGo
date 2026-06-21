import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { SKILL_EFFECT_CATALOG } from "../shared/skillEffectCatalog.js";
import {
  BOARD_SKILL_EFFECT_RENDERERS,
  boardSkillEffectAssetUrls,
  playRegisteredBoardSkillEffect
} from "./boardSkillEffectRegistry.js";

describe("boardSkillEffectRegistry", () => {
  test("registers every catalog board effect", () => {
    const boardEffectTypes = Object.entries(SKILL_EFFECT_CATALOG)
      .filter(([, metadata]) => metadata.boardEffect)
      .map(([effectType]) => effectType);

    expect(Object.keys(BOARD_SKILL_EFFECT_RENDERERS).sort()).toEqual(boardEffectTypes.sort());
  });

  test("keeps hidden-hand registered as a full-board effect", () => {
    expect(BOARD_SKILL_EFFECT_RENDERERS["hidden-hand"]).toMatchObject({
      fullBoard: true,
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
  });

  test("keeps ChangLi double-move registered as a full-board effect", () => {
    expect(BOARD_SKILL_EFFECT_RENDERERS["double-move"]).toMatchObject({
      fullBoard: true,
      assets: [
        "/assets/effects/changli-fire-phoenix.svg",
        "/assets/effects/changli-flame-sprite.svg"
      ],
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
  });

  test("exposes renderer asset urls for banner-window preloading", () => {
    expect(boardSkillEffectAssetUrls("flip-stone")).toEqual(["/assets/effects/denia-bubble-pop.webp"]);
    expect(boardSkillEffectAssetUrls("random-blast")).toEqual(["/assets/baconbits.webp"]);
    expect(boardSkillEffectAssetUrls("unknown-effect")).toEqual([]);
  });

  test("keeps ChangLi fire field irregular instead of drawing a full-canvas rectangle", () => {
    const registrySource = fs.readFileSync(path.resolve("src/room/boardSkillEffectRegistry.js"), "utf8");
    const changliSource = registrySource.match(/function playChangliDoubleMove[\s\S]*?function changliFlamePointIds/)?.[0] ?? "";

    expect(changliSource).toContain("drawChangliFireField");
    expect(changliSource).not.toContain(".rect(0, 0, width, height)");
    expect(registrySource).toContain("/assets/effects/changli-fire-phoenix.svg");
    expect(registrySource).toContain("/assets/effects/changli-flame-sprite.svg");
  });

  test("keeps Mornye protocol takeover registered as a targeted Pixi beam effect", () => {
    expect(BOARD_SKILL_EFFECT_RENDERERS["protocol-takeover"]).toMatchObject({
      play: expect.any(Function),
      playReducedMotion: expect.any(Function)
    });
  });

  test("plays Lynae spray animation on every transformed point", () => {
    const registrySource = fs.readFileSync(path.resolve("src/room/boardSkillEffectRegistry.js"), "utf8");
    const spraySource = registrySource.match(/function playSprayStone[\s\S]*?function drawCracks/)?.[0] ?? "";

    expect(BOARD_SKILL_EFFECT_RENDERERS["spray-stone"]).toMatchObject({
      play: expect.any(Function)
    });
    expect(spraySource).toContain("sprayEffectTargets");
    expect(spraySource).toContain("pendingSkill?.affectedPointIds");
    expect(spraySource).toContain("for (const [targetIndex, effectTarget] of targets.entries())");
  });

  test("keeps row-slash out of Pixi renderers because it uses the DOM row overlay", () => {
    expect(BOARD_SKILL_EFFECT_RENDERERS["row-slash"]).toBeUndefined();
  });

  test("skips unknown effects without touching the Pixi stage", () => {
    const app = { stage: { addChild: () => { throw new Error("should not draw"); } } };

    expect(() => playRegisteredBoardSkillEffect({
      app,
      pixi: {},
      host: { clientWidth: 260, clientHeight: 260 },
      boardSize: 13,
      pendingSkill: { effectType: "unknown-effect", targetId: "6,6" },
      durationMs: 1000,
      reducedMotion: false
    })).not.toThrow();
  });
});
